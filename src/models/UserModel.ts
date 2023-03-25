import { AppDataSource } from '../dataSource';
import { User } from '../entities/User';

const userRepository = AppDataSource.getRepository(User);

async function getUserByUsername(username: string): Promise<User | null> {
  // TODO: Select all desired elements
  const user = await userRepository
    .createQueryBuilder('user')
    .where({ username })
    .leftJoinAndSelect('user.links', 'links')
    .getOne();

  return user;
}

async function addNewUser(username: string, passwordHash: string): Promise<User | null> {
  let newUser = new User();
  newUser.username = username;
  newUser.passwordHash = passwordHash;

  newUser = await userRepository.save(newUser);
  return newUser;
}

async function getUserById(userId: string): Promise<User | null> {
  // TODO: Select all desired elements
  const user = await userRepository
    .createQueryBuilder('user')
    .where({ userId })
    .leftJoinAndSelect('user.links', 'links')
    .getOne();

  return user;
}

export { getUserByUsername, addNewUser, getUserById };
