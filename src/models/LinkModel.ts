import { createHash } from 'crypto';
import { AppDataSource } from '../dataSource';
import { Link } from '../entities/Link';

const linkRepository = AppDataSource.getRepository(Link);

async function getLinkById(linkId: string): Promise<Link | null> {
  // TODO: Select all desired elements
  const link = await linkRepository
    .createQueryBuilder('link')
    .where({ linkId })
    .leftJoinAndSelect('link.user', 'user')
    .getOne();

  return link;
}

function createLinkId(originalUrl: string, userId: string): string {
  const md5 = createHash('md5');
  md5.update(originalUrl.concat(userId));
  const urlHash = md5.digest('base64url');
  const linkId = urlHash.slice(9);

  return linkId;
}

export { getLinkById, createLinkId };
