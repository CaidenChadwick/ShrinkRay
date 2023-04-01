import { Request, Response } from 'express';
import {
  getLinkById,
  createLinkId,
  createNewLink,
  updateLinkVisits,
  getLinksByUserId,
  getLinksByUserIdForOwnAccount,
  deleteLinkById,
} from '../models/LinkModel';
import { getUserById } from '../models/UserModel';
import { parseDatabaseError } from '../utils/db-utils';

async function shortenUrl(req: Request, res: Response): Promise<void> {
  // Make sure the user is logged in
  if (!req.session.isLoggedIn) {
    res.sendStatus(401); // 401 Unauthorized
    // TODO: Send message
    return;
  }
  // Get the userId from `req.session`
  const { userId } = req.session.authenticatedUser;
  // Retrieve the user's account data using their ID
  const user = await getUserById(userId);
  // Check if you got back `null`
  if (!user) {
    res.sendStatus(404); // 404 Not Found
    // TODO: Send json message
    return;
  }

  // Check if the user is neither a "pro" nor an "admin" account
  if (!(user.isAdmin || user.isPro)) {
    if (user.links.length > 4) {
      res.sendStatus(403); // 403 Forbidden
      // TODO: Send json message
      return;
    }
  }

  // Generate a `linkId`
  // Add the new link to the database (wrap this in try/catch)
  // Respond with status 201 if the insert was successful
  const { originalUrl } = req.body;
  const newLinkId = createLinkId(originalUrl, user.userId);
  try {
    const newLink = await createNewLink(originalUrl, newLinkId, user);
    console.log(newLink);
    res.sendStatus(201); // 201 Created
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

async function getOriginalUrl(req: Request, res: Response): Promise<void> {
  // Retrieve the link data using the targetLinkId from the path parameter
  const { targetLinkId } = req.params as LinkIdParam;
  const link = await getLinkById(targetLinkId);
  // Check if you got back `null`
  if (!link) {
    res.sendStatus(404); // 404 Not Found
    return;
  }
  // Call the appropriate function to increment the number of hits and the last accessed date
  await updateLinkVisits(link);
  // Redirect the client to the original URL
  res.redirect(301, link.originalUrl);
}

async function getUserLinks(req: Request, res: Response): Promise<void> {
  const { targetUserId } = req.params as UserIdParam;
  const targetUser = await getUserById(targetUserId);
  if (!targetUser) {
    res.sendStatus(404); // 404 Not Found
    return;
  }

  const user = req.session.authenticatedUser;
  if (!req.session.isLoggedIn || (user.userId !== targetUserId && !user.isAdmin)) {
    const links = await getLinksByUserId(targetUserId);
    res.json(links);
  } else {
    const links = await getLinksByUserIdForOwnAccount(targetUserId);
    res.json(links);
  }
}

async function deleteLink(req: Request, res: Response): Promise<void> {
  const { targetUserId } = req.params as UserIdParam;
  const targetUser = await getUserById(targetUserId);
  if (!targetUser) {
    res.sendStatus(404); // 404 Not Found
    return;
  }

  const user = req.session.authenticatedUser;
  if (!req.session.isLoggedIn) {
    res.sendStatus(401); // 401 Unauthorized
    return;
  }

  if (!(user.isAdmin || user.userId === targetUserId)) {
    res.sendStatus(403);
    return;
  }

  const { targetLinkId } = req.params as LinkIdParam;
  const link = getLinkById(targetLinkId);
  if (!link) {
    res.sendStatus(404); // 404 Not Found
    return;
  }

  res.sendStatus(200);
  await deleteLinkById(targetLinkId);
}

export { shortenUrl, getOriginalUrl, getUserLinks, deleteLink };
