import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Category } from '../../models/Category';
import { ICategoryRepository, CreateCategoryDto } from '../../interfaces/repositories/ICategoryRepository';

@injectable()
export class CategoryRepository implements ICategoryRepository {
  private get repo() {
    return AppDataSource.getRepository(Category);
  }

  async findAll(): Promise<Category[]> {
    return this.repo.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.repo.existsBy({ slug });
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<CreateCategoryDto>): Promise<Category | null> {
    await this.repo.update(id, dto);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
