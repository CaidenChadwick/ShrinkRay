import { AppDataSource } from '../dataSource';
import { User } from '../entities/User';

const userRepository = AppDataSource.getRepository(User);

async function getUserById(userId: string): Promise<User | null> {
  const user = await userRepository.findOne({ where: { userId }, relations: ['links'] });
  return user;
}

async function getUserByUsername(username: string): Promise<User | null> {
  const user = await userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.links', 'links')
    .where('username = :username', { username })
    .getOne();
  return user;
}

async function addNewUser(username: string, passwordHash: string): Promise<User | null> {
  // Create the new user object
  let newUser = new User();
  newUser.username = username;
  newUser.passwordHash = passwordHash;

  newUser = await userRepository.save(newUser);

  return newUser;
}

export { getUserByUsername, addNewUser, getUserById };
