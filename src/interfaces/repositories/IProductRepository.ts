import { Product } from '../../models/Product';

export interface CreateProductDto {
  category_id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  brand?: string | null;
  features?: Record<string, any>;
  created_by_id?: string;
}

export interface ProductFilters {
  category_id?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findMany(filters: ProductFilters): Promise<{ items: Product[]; total: number }>;
  existsBySlug(slug: string): Promise<boolean>;
  create(dto: CreateProductDto): Promise<Product>;
  update(id: string, dto: Partial<CreateProductDto & { stock_quantity?: number }>): Promise<Product | null>;
  softDelete(id: string): Promise<void>;
  adjustStock(productId: string, variantId: string | null, delta: number): Promise<void>;
}
