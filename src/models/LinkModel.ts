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

export { getLinkById };
