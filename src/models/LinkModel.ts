import { createHash } from 'crypto';
import { AppDataSource } from '../dataSource';
import { Link } from '../entities/Link';
import { User } from '../entities/User';

const linkRepository = AppDataSource.getRepository(Link);

async function getLinkById(linkId: string): Promise<Link | null> {
  const link = await linkRepository.findOne({ where: { linkId } });
  return link;
}

function createLinkId(originalUrl: string, userId: string): string {
  const md5 = createHash('md5');
  md5.update(`${originalUrl}${userId}`);
  const urlHash = md5.digest('base64url');
  const linkId = urlHash.slice(0, 9);
  return linkId;
}

async function createNewLink(originalUrl: string, linkId: string, creator: User): Promise<Link> {
  const newLink = new Link();

  newLink.linkId = linkId;
  newLink.originalUrl = originalUrl;
  newLink.user = creator;
  newLink.lastAccessedOn = new Date();

  await linkRepository.save(newLink);
  return newLink;
}

async function updateLinkVisits(link: Link): Promise<Link> {
  const updatedLink = link;
  updatedLink.numHits += 1;
  updatedLink.lastAccessedOn = new Date();
  await linkRepository.save(updatedLink);
  return updatedLink;
}

async function getLinksByUserId(userId: string): Promise<Link[]> {
  const links = await linkRepository
    .createQueryBuilder('link')
    .where({ user: { userId } })
    .leftJoinAndSelect('link.user', 'user')
    .select(['link.linkId', 'link.originalUrl', 'user.userId', 'user.username', 'user.isAdmin'])
    .getMany();

  return links;
}

async function getLinksByUserIdForOwnAccount(userId: string): Promise<Link[]> {
  const links = await linkRepository
    .createQueryBuilder('link')
    .where({ user: { userId } })
    .leftJoinAndSelect('link.user', 'user')
    .select([
      'link.linkId',
      'link.originalUrl',
      'link.numHits',
      'link.lastAccessedOn',
      'user.isPro',
      'user.userId',
      'user.username',
      'user.isAdmin',
    ])
    .getMany();

  return links;
}

async function deleteLink(linkId: string): Promise<void> {
  await linkRepository
    .createQueryBuilder('link')
    .delete()
    .from(Link)
    .where('linkId = :linkId', { linkId })
    .execute();
}

export {
  getLinkById,
  createLinkId,
  createNewLink,
  updateLinkVisits,
  getLinksByUserId,
  getLinksByUserIdForOwnAccount,
  deleteLink,
};
