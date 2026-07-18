import { injectable } from 'tsyringe';
import { Not } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Blog } from '../../models/Blog';
import {
  CreateBlogDto,
  IBlogRepository,
  UpdateBlogDto,
} from '../../interfaces/repositories/IBlogRepository';

@injectable()
export class BlogRepository implements IBlogRepository {
  private repo = AppDataSource.getRepository(Blog);

  findAll(): Promise<Blog[]> {
    return this.repo.find({
      relations: ['author'],
      order: { created_at: 'DESC' },
    });
  }

  findPublished(limit = 50): Promise<Blog[]> {
    return this.repo.find({
      where: { is_published: true },
      order: { published_at: 'DESC', created_at: 'DESC' },
      take: limit,
    });
  }

  findBySlug(slug: string, publishedOnly = false): Promise<Blog | null> {
    return this.repo.findOne({
      where: publishedOnly ? { slug, is_published: true } : { slug },
      relations: ['author'],
    });
  }

  findById(id: string): Promise<Blog | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['author'],
    });
  }

  async create(data: CreateBlogDto): Promise<Blog> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: UpdateBlogDto): Promise<Blog | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const where = excludeId ? { slug, id: Not(excludeId) } : { slug };
    const count = await this.repo.count({ where });
    return count > 0;
  }
}
