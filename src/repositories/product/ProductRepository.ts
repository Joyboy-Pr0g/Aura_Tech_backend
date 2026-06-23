import { injectable } from 'tsyringe';
import { IsNull } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Product } from '../../models/Product';
import { ProductVariant } from '../../models/ProductVariant';
import { InventoryLog } from '../../models/InventoryLog';
import {
  IProductRepository,
  CreateProductDto,
  ProductFilters,
} from '../../interfaces/repositories/IProductRepository';

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

  async findById(id: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['category', 'variants'],
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { slug },
      relations: ['category', 'variants'],
    });
  }

  async findMany(filters: ProductFilters): Promise<{ items: Product[]; total: number }> {
    const limit = filters.limit ?? 20;
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'cat')
      .where('p.deleted_at IS NULL');

    if (filters.category_id) {
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
    if (filters.in_stock) {
      qb.andWhere('(p.stock_quantity - p.reserved_quantity) > 0');
    }
    if (filters.search) {
      qb.andWhere(
        '(LOWER(p.title) LIKE :q OR LOWER(p.description) LIKE :q OR LOWER(p.brand) LIKE :q)',
        { q: `%${filters.search.toLowerCase()}%` },
      );
    }

    const total = await qb.getCount();

    qb.orderBy('p.created_at', 'DESC').take(limit);

    const items = await qb.getMany();
    return { items, total };
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
}
