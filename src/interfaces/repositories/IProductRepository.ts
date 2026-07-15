import { Product } from '../../models/Product';
import { DecodedCursor, CursorListResult } from '../../utils/cursorPagination';

export interface CreateProductDto {
  category_id: string;
  sub_category_id?: string | null;
  slug: string;
  title: string;
  description: string;
  price: number;
  brand?: string | null;
  features?: Record<string, any>;
  stock_quantity?: number;
  created_by_id?: string;
}

export interface ProductFilters {
  category_id?: string;
  sub_category_id?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  search?: string;
  cursor?: DecodedCursor | null;
  limit?: number;
  /** Authenticated customer id — enriches list results with is_wishlisted */
  userId?: string;
  /** When true, include soft-deleted rows (admin list) */
  include_deleted?: boolean;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string, userId?: string): Promise<Product | null>;
  findMany(filters: ProductFilters): Promise<CursorListResult<Product>>;
  existsBySlug(slug: string): Promise<boolean>;
  create(dto: CreateProductDto): Promise<Product>;
  update(id: string, dto: Partial<CreateProductDto & { stock_quantity?: number }>): Promise<Product | null>;
  softDelete(id: string): Promise<void>;
  adjustStock(productId: string, variantId: string | null, delta: number): Promise<void>;
  getTotalProductCount(): Promise<number>;
  brands(): Promise<string[]>;
  getMaxProductPrice(): Promise<number>;
  /** End of public methods */
  /** Admin methods */
  findManyAdmin(filters: ProductFilters): Promise<CursorListResult<Product>>;
  findByIdAdmin(id: string): Promise<Product | null>;
  restore(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
