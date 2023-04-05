import { Request, Response } from 'express';
import { parseDatabaseError } from '../utils/db-utils';
import {
  createNewLink,
  getLinksByUserId,
  updateLinkVisits,
  createLinkId,
  getLinkById,
  getLinksByUserIdForOwnAccount,
  deleteLink,
} from '../models/LinkModel';
import { getUserById } from '../models/UserModel';

async function shortenUrl(req: Request, res: Response): Promise<void> {
  if (!req.session.isLoggedIn) {
    res.sendStatus(403);
    return;
  }

  // Get the userId from `req.session`
  const { authenticatedUser } = req.session;

  const user = await getUserById(authenticatedUser.userId);
  if (!user) {
    res.sendStatus(404);
    return;
  }

  if ((!user.isPro || !user.isAdmin) && user.links.length >= 5) {
    res.sendStatus(403);
    return;
  }

  const { originalUrl } = req.body as NewLinkRequest;

  const linkId = createLinkId(originalUrl, user.userId);

  try {
    const newLink = await createNewLink(originalUrl, linkId, user);
    newLink.user.passwordHash = undefined;
    res.status(201).json(newLink);
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

async function visitLink(req: Request, res: Response): Promise<void> {
  const { targetLinkId } = req.params as LinkParam;

  const link = await getLinkById(targetLinkId);
  if (!link) {
    res.sendStatus(404);
    return;
  }

  await updateLinkVisits(link);

  res.redirect(301, link.originalUrl);
}

async function getLinks(req: Request, res: Response): Promise<void> {
  const { targetUserId } = req.params as UserIdParam;

  let links;
  if (!req.session.isLoggedIn || req.session.authenticatedUser.userId !== targetUserId) {
    links = await getLinksByUserId(targetUserId);
  } else {
    links = await getLinksByUserIdForOwnAccount(targetUserId);
  }

  res.json(links);
}

async function removeLink(req: Request, res: Response): Promise<void> {
  const { targetUserId, targetLinkId } = req.params as DeleteLinkRequest;
  const { isLoggedIn, authenticatedUser } = req.session;
  if (!isLoggedIn) {
    res.sendStatus(401);
    return;
  }

  const link = await getLinkById(targetLinkId);
  if (!link) {
    res.sendStatus(404);
    return;
  }

  if (authenticatedUser.userId !== targetUserId && !authenticatedUser.isAdmin) {
    res.sendStatus(403);
    return;
  }

  await deleteLink(targetLinkId);

  res.sendStatus(200);
}

export { shortenUrl, visitLink, getLinks, removeLink };
