import { Request, Response } from 'express';
import argon2 from 'argon2';
import { isBefore, parseISO, formatDistanceToNow } from 'date-fns';
import { addNewUser, getUserByUsername } from '../models/UserModel';
import { parseDatabaseError } from '../utils/db-utils';

async function registerUser(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as AuthRequest;

  // NOTES: Find way to check for username without using retrieval
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    res.sendStatus(409);
    return;
  }

  // Make sure to hash the password before adding it to the database
  const passwordHash = await argon2.hash(password);
  // Wrap the call to `addNewUser` in a try/catch like in the sample code
  try {
    const newUser = await addNewUser(username, passwordHash);
    console.log(newUser);
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

async function logIn(req: Request, res: Response): Promise<void> {
  console.log(req.session);

  const now = new Date();

  const logInTimeout = parseISO(req.session.logInTimeout);

  if (logInTimeout && isBefore(now, logInTimeout)) {
    const timeRemaining = formatDistanceToNow(logInTimeout);
    const message = `You have ${timeRemaining} remaining`;

    res.status(429).send(message); // 429 Too Many Requests
    return;
  }

  const { username, password } = req.body as AuthRequest;

  const user = await getUserByUsername(username);
  if (!user) {
    res.sendStatus(404); // 404 Not Found
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
