import { Request, Response } from 'express';
import argon2 from 'argon2';
import { addNewUser, getUserByUsername } from '../models/UserModel';
import { parseDatabaseError } from '../utils/db-utils';

async function registerUser(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as AuthRequest;

  const user = await getUserByUsername(username);
  if (user) {
    res.sendStatus(409);
    return;
  }

  const passwordHash = await argon2.hash(password);

  try {
    const newUser = await addNewUser(username, passwordHash);

    res.status(201).json(newUser);
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

async function logIn(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as AuthRequest;

  const user = await getUserByUsername(username);
  if (!user) {
    res.sendStatus(404); // 404 Not Found - email doesn't exist
    return;
  }

  const { passwordHash } = user;
  if (!(await argon2.verify(passwordHash, password))) {
    res.sendStatus(404); // 404 Not Found - user with email/pass doesn't exist
    return;
  }

  await req.session.clearSession();
  req.session.authenticatedUser = {
    userId: user.userId,
    username: user.username,
    isPro: user.isPro,
    isAdmin: user.isAdmin,
  };
  req.session.isLoggedIn = true;

  res.sendStatus(200);
}

export { registerUser, logIn };
