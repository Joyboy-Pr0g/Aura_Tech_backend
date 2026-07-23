import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { AppError } from '../../core/errors/AppError';
import {
  IProductRepository,
  ProductFilters,
} from '../../interfaces/repositories/IProductRepository';
import { Product } from '../../models/Product';
import { OrderItem } from '../../models/OrderItem';
import { CursorListResult, decodeCreatedAtIdCursor } from '../../utils/cursorPagination';
import { deleteFromCloudinary } from '../../config/cloudinary';
import { AppDataSource } from '../../config/database';
import { ProductService } from '../product/ProductService';
import { ParsedProductUploadFile, VariantInput } from '../../utils/productUploadFiles';
import { logAdminAction } from '../../utils/logAdminAction';

export interface AdminCreateProductInput {
  title: string;
  description: string;
  price: number;
  discount_price?: number | null;
  category_id: string;
  sub_category_id?: string | null;
  brand?: string;
  features?: Record<string, any>;
  imageFiles?: Array<{ buffer: Buffer; mimetype: string; is_primary?: boolean }>;
  variantImageFiles?: Map<number, ParsedProductUploadFile>;
  variants?: VariantInput[];
  stock_quantity?: number;
  created_by_id: string;
}

export interface AdminUpdateProductInput {
  title?: string;
  description?: string;
  price?: number;
  discount_price?: number | null;
  category_id?: string;
  sub_category_id?: string | null;
  brand?: string | null;
  features?: Record<string, any>;
  newImageFiles?: Array<{ buffer: Buffer; mimetype: string }>;
  variantImageFiles?: Map<number, ParsedProductUploadFile>;
  deleteImagePublicIds?: string[];
  stock_quantity?: number;
  variants?: VariantInput[];
}

@injectable()
export class AdminProductService {
  constructor(
    @inject(REPOSITORY_TOKENS.IProductRepository) private productRepo: IProductRepository,
    @inject(ProductService) private productService: ProductService,
  ) { }

  async getProducts(
    filters: Omit<ProductFilters, 'cursor'> & { cursor?: string },
  ): Promise<CursorListResult<Product>> {
    const decoded = decodeCreatedAtIdCursor(filters.cursor ?? '');
    if (decoded === 'invalid') {
      throw new AppError(400, 'Invalid or malformed cursor');
    }

    return this.productRepo.findManyAdmin({ ...filters, cursor: decoded });
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepo.findByIdAdmin(id);
    if (!product) throw new AppError(404, 'Product not found');
    return product;
  }

  async createProduct(data: AdminCreateProductInput): Promise<Product> {
    const product = await this.productService.create(data);
    void logAdminAction({
      admin_id: data.created_by_id,
      action: 'create',
      entity_type: 'product',
      entity_id: product.id,
      changes_json: { title: product.title },
    });
    return product;
  }

  async updateProduct(id: string, data: AdminUpdateProductInput, adminId: string): Promise<Product> {
    const product = await this.productService.update(id, data, adminId);
    void logAdminAction({
      admin_id: adminId,
      action: 'update',
      entity_type: 'product',
      entity_id: id,
      changes_json: data as Record<string, unknown>,
    });
    return product;
  }

  async addStock(
    productId: string,
    quantity: number,
    adminId: string,
    variantId?: string,
    notes?: string,
  ): Promise<Product> {
    return this.productService.addStock(productId, quantity, adminId, variantId, notes);
  }

  async softDeleteProduct(id: string, adminId: string): Promise<void> {
    const product = await this.ensureExists(id);
    if (product.deleted_at) throw new AppError(400, 'Product is already soft deleted');
    if (product.reserved_quantity > 0) {
      throw new AppError(400, 'Product has reserved stock and cannot be deleted');
    }
    await this.productRepo.softDelete(id);
    void logAdminAction({ admin_id: adminId, action: 'soft_delete', entity_type: 'product', entity_id: id });
  }

  async restoreProduct(id: string, adminId: string): Promise<void> {
    const product = await this.productRepo.findByIdAdmin(id);
    if (!product) throw new AppError(404, 'Product not found');
    if (!product.deleted_at) throw new AppError(400, 'Product is not soft deleted');
    await this.productRepo.restore(id);
    void logAdminAction({ admin_id: adminId, action: 'restore', entity_type: 'product', entity_id: id });
  }

  async deleteProduct(id: string, adminId: string): Promise<void> {
    const product = await this.productRepo.findByIdAdmin(id);
    if (!product) throw new AppError(404, 'Product not found');

    if (product.reserved_quantity > 0) {
      throw new AppError(400, 'Product has reserved stock and cannot be deleted');
    }

    const orderItemCount = await AppDataSource.getRepository(OrderItem).count({
      where: { product_id: id },
    });
    if (orderItemCount > 0) {
      throw new AppError(400, 'Product has order history and cannot be permanently deleted');
    }

    if (product.images?.length) {
      for (const img of product.images) {
        await deleteFromCloudinary(img.public_id).catch(() => { });
      }
    }

    const variants = product.variants ?? [];
    for (const variant of variants) {
      if (variant.images?.length) {
        for (const img of variant.images) {
          await deleteFromCloudinary(img.public_id).catch(() => { });
        }
      }
    }

    await this.productRepo.delete(id);
    void logAdminAction({ admin_id: adminId, action: 'delete', entity_type: 'product', entity_id: id });
  }

  async setPrimaryImage(productId: string, imageId: string, adminId: string): Promise<Product> {
    return this.productService.setPrimaryImage(productId, imageId, adminId);
  }

  async removeImage(productId: string, imageId: string, adminId: string): Promise<Product> {
    return this.productService.removeImage(productId, imageId, adminId);
  }

  private async ensureExists(id: string): Promise<Product> {
    const product = await this.productRepo.findById(id);
    if (!product || product.deleted_at) {
      throw new AppError(404, 'Product not found');
    }
    return product;
  }
}
