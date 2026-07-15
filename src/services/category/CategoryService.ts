import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { ICategoryRepository } from '../../interfaces/repositories/ICategoryRepository';
import { AppError } from '../../core/errors/AppError';
import { Category } from '../../models/Category';
import { CategoryDto } from '../../mappers/categories.mapper';

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

@injectable()
export class CategoryService {
  constructor(
    @inject(REPOSITORY_TOKENS.ICategoryRepository)
    private categoryRepo: ICategoryRepository,
  ) {}

  async getAll(): Promise<Category[]> {
    return this.categoryRepo.findAll();
  }

  async getById(id: string): Promise<Category> {
    const cat = await this.categoryRepo.findById(id);
    if (!cat) throw new AppError(404, 'Category not found');
    return cat;
  }

  async getBySlug(slug: string): Promise<Category> {
    const cat = await this.categoryRepo.findBySlug(slug);
    if (!cat) throw new AppError(404, 'Category not found');
    return cat;
  }
}
