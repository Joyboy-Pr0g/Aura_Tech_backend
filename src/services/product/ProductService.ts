import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IProductRepository, ProductFilters } from '../../interfaces/repositories/IProductRepository';
import { ICategoryRepository } from '../../interfaces/repositories/ICategoryRepository';
import { AppError } from '../../core/errors/AppError';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import { AppDataSource } from '../../config/database';
import { Product, ProductImage } from '../../models/Product';
import { ProductVariant } from '../../models/ProductVariant';
import { InventoryLog } from '../../models/InventoryLog';
import {
  CursorListResult,
  decodeCreatedAtIdCursor,
} from '../../utils/cursorPagination';

function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeSubCategoryId(value?: string | null): string | null {
  if (!value || String(value).trim() === '') return null;
  return value;
}

@injectable()
export class ProductService {
  constructor(
    @inject(REPOSITORY_TOKENS.IProductRepository)
    private productRepo: IProductRepository,
    @inject(REPOSITORY_TOKENS.ICategoryRepository)
    private categoryRepo: ICategoryRepository,
  ) { }

  async getMany(
    filters: Omit<ProductFilters, 'cursor'> & { cursor?: string, userId?: string },
  ): Promise<CursorListResult<Product>> {
    const decoded = decodeCreatedAtIdCursor(filters.cursor);
    if (decoded === 'invalid') {
      throw new AppError(400, 'Invalid or malformed cursor');
    }
    return this.productRepo.findMany({ ...filters, cursor: decoded });
  }

  async getById(id: string): Promise<Product> {
    const p = await this.productRepo.findById(id);
    if (!p) throw new AppError(404, 'Product not found');
    return p;
  }

  async getBySlug(slug: string, userId?: string): Promise<Product> {
    const p = await this.productRepo.findBySlug(slug, userId);
    if (!p) throw new AppError(404, 'Product not found');
    return p;
  }

  async create(data: {
    title: string;
    description: string;
    price: number;
    category_id: string;
    sub_category_id?: string | null;
    brand?: string;
    features?: Record<string, any>;
    imageFiles?: Array<{ buffer: Buffer; mimetype: string; is_primary?: boolean }>;
    variants?: Array<{ sku: string; size?: string; color?: string; price?: number; stock_quantity?: number }>;
    stock_quantity?: number;
    created_by_id: string;
  }): Promise<Product> {

    const subCategoryId = normalizeSubCategoryId(data.sub_category_id);
    await this.validateProductCategories(data.category_id, subCategoryId);

    const slug = toSlug(data.title);
    if (await this.productRepo.existsBySlug(slug)) {
      throw new AppError(409, `Product with this title already exists`);
    }

    const images: ProductImage[] = [];
    if (data.imageFiles?.length) {
      for (let i = 0; i < data.imageFiles.length; i++) {
        const f = data.imageFiles[i];
        const uploaded = await uploadToCloudinary(f.buffer, `aura-tech/products/${slug}`, f.mimetype);
        images.push({
          url: uploaded.url,
          public_id: uploaded.public_id,
          is_primary: f.is_primary ?? i === 0,
        });
      }
    }

    const product = await this.productRepo.create({
      category_id: data.category_id,
      sub_category_id: subCategoryId,
      slug,
      title: data.title,
      description: data.description,
      price: data.price,
      brand: data.brand ?? null,
      features: data.features ?? {},
      stock_quantity: data.variants?.length ? 0 : (data.stock_quantity ?? 0),
      created_by_id: data.created_by_id,
    });

    if (images.length) {
      await this.productRepo.update(product.id, { images } as any);
    }

    if (data.variants?.length) {
      const variantRepo = AppDataSource.getRepository(ProductVariant);
      for (const v of data.variants) {
        await variantRepo.save(variantRepo.create({ ...v, product_id: product.id }));
      }
    }

    return (await this.productRepo.findById(product.id))!;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      price?: number;
      category_id?: string;
      sub_category_id?: string | null;
      brand?: string | null;
      features?: Record<string, any>;
      newImageFiles?: Array<{ buffer: Buffer; mimetype: string }>;
      deleteImagePublicIds?: string[];
      stock_quantity?: number;
      variants?: Array<{
        id?: string;
        sku: string;
        size?: string | null;
        color?: string | null;
        price?: number | null;
        stock_quantity?: number;
      }>;
    },
    adminId: string,
  ): Promise<Product> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new AppError(404, 'Product not found');

    const nextCategoryId = data.category_id ?? product.category_id;
    const nextSubCategoryId =
      data.sub_category_id !== undefined
        ? normalizeSubCategoryId(data.sub_category_id)
        : product.sub_category_id;

    if (data.category_id !== undefined || data.sub_category_id !== undefined) {
      await this.validateProductCategories(nextCategoryId, nextSubCategoryId);
    }

    const updates: Record<string, any> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.price !== undefined) updates.price = data.price;
    if (data.category_id !== undefined) updates.category_id = data.category_id;
    if (data.sub_category_id !== undefined) updates.sub_category_id = nextSubCategoryId;
    if (data.brand !== undefined) updates.brand = data.brand;
    if (data.features !== undefined) updates.features = data.features;
    if (data.stock_quantity !== undefined) updates.stock_quantity = data.stock_quantity;

    // Handle image deletions
    let currentImages = product.images ?? [];
    if (data.deleteImagePublicIds?.length) {
      for (const pid of data.deleteImagePublicIds) {
        await deleteFromCloudinary(pid).catch(() => { });
        currentImages = currentImages.filter((img) => img.public_id !== pid);
      }
    }

    // Upload new images
    if (data.newImageFiles?.length) {
      for (const f of data.newImageFiles) {
        const uploaded = await uploadToCloudinary(f.buffer, `aura-tech/products/${product.slug}`, f.mimetype);
        currentImages.push({ url: uploaded.url, public_id: uploaded.public_id, is_primary: false });
      }
    }

    updates.images = currentImages;
    updates.updated_by_id = adminId;
    await this.productRepo.update(id, updates);

    if (data.variants !== undefined) {
      await this.syncVariants(id, data.variants);
    }

    return (await this.productRepo.findById(id))!;
  }

  private async syncVariants(
    productId: string,
    variants: Array<{
      id?: string;
      sku: string;
      size?: string | null;
      color?: string | null;
      price?: number | null;
      stock_quantity?: number;
    }>,
  ): Promise<void> {
    const variantRepo = AppDataSource.getRepository(ProductVariant);
    const existing = await variantRepo.find({ where: { product_id: productId } });
    const submittedIds = new Set(variants.filter((v) => v.id).map((v) => v.id!));

    for (const current of existing) {
      if (!submittedIds.has(current.id)) {
        if (current.reserved_quantity > 0) {
          throw new AppError(400, `Variant ${current.sku} has reserved stock and cannot be removed`);
        }
        await variantRepo.delete(current.id);
      }
    }

    for (const variant of variants) {
      if (variant.id) {
        const current = existing.find((item) => item.id === variant.id);
        if (!current) throw new AppError(404, 'Variant not found');
        await variantRepo.update(variant.id, {
          sku: variant.sku,
          size: variant.size ?? null,
          color: variant.color ?? null,
          price: variant.price ?? null,
          stock_quantity: variant.stock_quantity ?? 0,
        });
        continue;
      }

      await variantRepo.save(
        variantRepo.create({
          product_id: productId,
          sku: variant.sku,
          size: variant.size ?? null,
          color: variant.color ?? null,
          price: variant.price ?? null,
          stock_quantity: variant.stock_quantity ?? 0,
        }),
      );
    }
  }

  async setPrimaryImage(productId: string, imageId: string, adminId: string): Promise<Product> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new AppError(404, 'Product not found');
    const image = product.images?.find((img) => img.public_id === imageId);
    if (!image) throw new AppError(404, 'Image not found');
    for (const img of product.images ?? []) {
      img.is_primary = false;
    }
    image.is_primary = true;
    await this.productRepo.update(productId, { images: product.images, updated_by_id: adminId } as any);
    return (await this.productRepo.findById(productId))!;
  }

  async removeImage(productId: string, imageId: string, adminId: string): Promise<Product> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new AppError(404, 'Product not found');
    const image = product.images?.find((img) => img.public_id === imageId);
    if (!image) throw new AppError(404, 'Image not found');
    await deleteFromCloudinary(imageId).catch(() => { });
    product.images = product.images?.filter((img) => img.public_id !== imageId) ?? [];
    await this.productRepo.update(productId, { images: product.images, updated_by_id: adminId } as any);
    return (await this.productRepo.findById(productId))!;
  }

  async addStock(
    productId: string,
    quantity: number,
    adminId: string,
    variantId?: string,
    notes?: string,
  ): Promise<Product> {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new AppError(404, 'Product not found');
    if (quantity <= 0) throw new AppError(400, 'Quantity must be positive');

    await AppDataSource.transaction(async (em) => {
      if (variantId) {
        await em.increment(ProductVariant, { id: variantId }, 'stock_quantity', quantity);
      } else {
        await em.increment(Product, { id: productId }, 'stock_quantity', quantity);
      }

      await em.save(InventoryLog, em.create(InventoryLog, {
        product_id: productId,
        variant_id: variantId ?? null,
        quantity_change: quantity,
        reason: 'restock',
        changed_by_id: adminId,
        notes: notes ?? null,
      }));
    });

    return (await this.productRepo.findById(productId))!;
  }

  async getBrands(): Promise<string[]> {
    return this.productRepo.brands();
  }
  async getMaxProductPrice(): Promise<number> {
    return this.productRepo.getMaxProductPrice();
  }

  private async validateProductCategories(categoryId: string, subCategoryId: string | null): Promise<void> {
    const category = await this.categoryRepo.findById(categoryId);
    if (!category) throw new AppError(404, 'Category not found');
    if (category.parent_category_id) {
      throw new AppError(400, 'category_id must be a parent category');
    }

    if (!subCategoryId) return;

    const subCategory = await this.categoryRepo.findById(subCategoryId);
    if (!subCategory || subCategory.parent_category_id !== categoryId) {
      throw new AppError(400, 'sub_category_id must be a child of the selected category');
    }
  }

  async delete(id: string): Promise<void> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new AppError(404, 'Product not found');

    // Delete Cloudinary images
    if (product.images?.length) {
      for (const img of product.images) {
        await deleteFromCloudinary(img.public_id).catch(() => { });
      }
    }

    await this.productRepo.softDelete(id);
  }
}
