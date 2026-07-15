import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Product } from '../../models/Product';
import { ProductVariant } from '../../models/ProductVariant';
import { InventoryLog } from '../../models/InventoryLog';
import {
  IProductRepository,
  CreateProductDto,
  ProductFilters,
} from '../../interfaces/repositories/IProductRepository';
import {
  applyCreatedAtIdCursorDesc,
  CursorListResult,
  paginateByCursor,
  DEFAULT_LIMIT,
} from '../../utils/cursorPagination';
import { SelectQueryBuilder } from 'typeorm';

@injectable()
export class ProductRepository implements IProductRepository {
  private get repo() {
    return AppDataSource.getRepository(Product);
  }
  private get variantRepo() {
    return AppDataSource.getRepository(ProductVariant);
  }
  private get inventoryRepo() {
    return AppDataSource.getRepository(InventoryLog);
  }

  private getProductFilteredQueryBuilder(qb: SelectQueryBuilder<Product>, filters: ProductFilters) {
    if (filters.sub_category_id) {
      qb.andWhere('p.sub_category_id = :subCat', { subCat: filters.sub_category_id });
      if (filters.category_id) {
        qb.andWhere('p.category_id = :cat', { cat: filters.category_id });
      }
    } else if (filters.category_id) {
      qb.andWhere('p.category_id = :cat', { cat: filters.category_id });
    }
    if (filters.brand) {
      qb.andWhere('LOWER(p.brand) = LOWER(:brand)', { brand: filters.brand });
    }
    if (filters.min_price !== undefined) {
      qb.andWhere('p.price >= :minP', { minP: filters.min_price });
    }
    if (filters.max_price !== undefined) {
      qb.andWhere('p.price <= :maxP', { maxP: filters.max_price });
    }
    if (filters.in_stock === true) {
      qb.andWhere('(p.stock_quantity - p.reserved_quantity) > 0');
    } else if (filters.in_stock === false) {
      qb.andWhere('(p.stock_quantity - p.reserved_quantity) <= 0');
    }
    if (filters.search) {
      qb.andWhere(
        '(LOWER(p.title) LIKE :q OR LOWER(p.description) LIKE :q OR LOWER(p.brand) LIKE :q)',
        { q: `%${filters.search.toLowerCase()}%` },
      );
    }
  }

  private applyWishlistSelect(qb: SelectQueryBuilder<Product>, userId: string): void {
    qb.addSelect(
      `EXISTS (
        SELECT 1
        FROM wishlists w
        WHERE w.product_id = p.id
          AND w.customer_id = :wishlistCustomerId
      )`,
      'is_wishlisted',
    );
    qb.setParameter('wishlistCustomerId', userId);
  }

  private mapWishlistFlag(entities: Product[], raw: Record<string, unknown>[]): Product[] {
    return entities.map((entity, index) => {
      entity.is_wishlisted = Boolean(raw[index]?.is_wishlisted);
      return entity;
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['category', 'sub_category', 'variants'],
    });
  }

  async findBySlug(slug: string, userId?: string): Promise<Product | null> {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'cat')
      .leftJoinAndSelect('p.sub_category', 'sub_cat')
      .leftJoinAndSelect('p.variants', 'variants')
      .where('p.slug = :slug', { slug })
      .andWhere('p.deleted_at IS NULL');

    if (userId) {
      this.applyWishlistSelect(qb, userId);
      const { entities, raw } = await qb.getRawAndEntities();
      return this.mapWishlistFlag(entities, raw)[0] ?? null;
    }

    return qb.getOne();
  }

  async findMany(filters: ProductFilters): Promise<CursorListResult<Product>> {
    const limit = filters.limit ?? DEFAULT_LIMIT;
    const { userId, ...queryFilters } = filters;
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'cat')
      .where('p.deleted_at IS NULL');

    this.getProductFilteredQueryBuilder(qb, queryFilters);

    if (userId) {
      this.applyWishlistSelect(qb, userId);
    }

    applyCreatedAtIdCursorDesc(qb, 'p', queryFilters.cursor ?? null);

    qb.orderBy('p.created_at', 'DESC')
      .addOrderBy('p.id', 'DESC')
      .take(limit + 1);

    let rows: Product[];
    if (userId) {
      const { entities, raw } = await qb.getRawAndEntities();
      rows = this.mapWishlistFlag(entities, raw);
    } else {
      rows = await qb.getMany();
    }

    return paginateByCursor(rows, limit);
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.repo.existsBy({ slug });
  }

  async create(dto: CreateProductDto): Promise<Product> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<CreateProductDto & { stock_quantity?: number }>): Promise<Product | null> {
    await this.repo.update(id, dto as any);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async adjustStock(
    productId: string,
    variantId: string | null,
    delta: number,
  ): Promise<void> {
    if (variantId) {
      await this.variantRepo.increment({ id: variantId }, 'stock_quantity', delta);
    } else {
      await this.repo.increment({ id: productId }, 'stock_quantity', delta);
    }
  }

  async brands(): Promise<string[]> {
    return this.repo.createQueryBuilder('p').select('DISTINCT p.brand').getRawMany();
  }
  async getMaxProductPrice(): Promise<number> {
    const result = await this.repo.createQueryBuilder('p').select('MAX(p.price)').getRawOne();
    return result?.max ?? 0;
  }

  // Admin methods
  async getTotalProductCount(): Promise<number> {
    return this.repo.count();
  }
  async findManyAdmin(filters: ProductFilters): Promise<CursorListResult<Product>> {
    const { limit = DEFAULT_LIMIT, cursor, include_deleted } = filters;
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'cat')
      .leftJoinAndSelect('p.sub_category', 'sub_cat')
      .leftJoinAndSelect('p.variants', 'variants');

    if (include_deleted) {
      qb.withDeleted();
    } else {
      qb.andWhere('p.deleted_at IS NULL');
    }

    this.getProductFilteredQueryBuilder(qb, filters);
    applyCreatedAtIdCursorDesc(qb, 'p', cursor ?? null);
    qb.orderBy('p.created_at', 'DESC').addOrderBy('p.id', 'DESC').take(limit + 1);
    const rows = await qb.getMany();
    return paginateByCursor(rows, limit);
  }

  async findByIdAdmin(id: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { id },
      withDeleted: true,
      relations: ['category', 'sub_category', 'variants'],
    });
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }

  async delete(id: string): Promise<void> {
    await AppDataSource.transaction(async (em) => {
      await em.delete(InventoryLog, { product_id: id });
      await em.delete(ProductVariant, { product_id: id });
      await em.delete(Product, { id });
    });
  }
}
