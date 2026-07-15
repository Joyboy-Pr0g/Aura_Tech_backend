import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Category } from '../../models/Category';
import {
  ICategoryRepository,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryFilters,
} from '../../interfaces/repositories/ICategoryRepository';
import {
  applyCreatedAtIdCursorDesc,
  CursorListResult,
  DEFAULT_LIMIT,
  paginateByCursor,
} from '../../utils/cursorPagination';
import { CategoryDto } from '../../mappers/categories.mapper';

@injectable()
export class CategoryRepository implements ICategoryRepository {
  private get repo() {
    return AppDataSource.getRepository(Category);
  }

  async findAll(): Promise<Category[]> {
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.children', 'children')
      .loadRelationCountAndMap('c.product_count', 'c.products')
      .where('c.parent_category_id IS NULL');
    return qb.getMany();
  }

  async findById(id: string): Promise<Category | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const qb = this.repo.createQueryBuilder('c').where('c.slug = :slug', { slug });
    if (excludeId) {
      qb.andWhere('c.id != :excludeId', { excludeId });
    }
    return qb.getExists();
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<CreateCategoryDto> | UpdateCategoryDto): Promise<Category | null> {
    await this.repo.update(id, dto as Partial<Category>);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async activate(id: string): Promise<void> {
    await this.repo.update(id, { is_active: true });
  }

  async deactivate(id: string): Promise<void> {
    await this.repo.update(id, { is_active: false });
  }

  async unassignParentCategory(id: string): Promise<void> {
    await this.repo.update(id, { parent_category_id: null });
  }

  async findManyAdmin(filters: CategoryFilters): Promise<CursorListResult<CategoryDto>> {
    const { search, is_active, parent_category_id, cursor, limit = DEFAULT_LIMIT, include_deleted } = filters;

    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.children', 'children')
      .loadRelationCountAndMap('c.product_count', 'c.products')
      .where('c.parent_category_id IS NULL');

    if (include_deleted) {
      qb.withDeleted();
    }

    if (typeof is_active === 'boolean') {
      qb.andWhere('c.is_active = :is_active', { is_active });
    }

    if (parent_category_id === null) {
      qb.andWhere('c.parent_category_id IS NULL');
    } else if (parent_category_id) {
      qb.andWhere('c.parent_category_id = :parent_category_id', { parent_category_id });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(c.name) LIKE :q OR LOWER(c.slug) LIKE :q OR LOWER(c.description) LIKE :q)',
        { q: `%${search.toLowerCase()}%` },
      );
    }

    applyCreatedAtIdCursorDesc(qb, 'c', cursor ?? null);
    qb.orderBy('c.created_at', 'DESC').addOrderBy('c.id', 'DESC').take(limit + 1);

    const rows = await qb.getMany();
    return paginateByCursor(
      rows,
      limit,
    );
  }

  async findCategoryAdmin(id: string): Promise<Category | null> {
    return this.repo.findOne({ where: { id }, withDeleted: true });
  }
}
