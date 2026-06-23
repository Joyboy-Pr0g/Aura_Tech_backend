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

function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

@injectable()
export class ProductService {
  constructor(
    @inject(REPOSITORY_TOKENS.IProductRepository)
    private productRepo: IProductRepository,
    @inject(REPOSITORY_TOKENS.ICategoryRepository)
    private categoryRepo: ICategoryRepository,
  ) {}

  async getMany(filters: ProductFilters): Promise<{ items: Product[]; total: number }> {
    return this.productRepo.findMany(filters);
  }

  async getById(id: string): Promise<Product> {
    const p = await this.productRepo.findById(id);
    if (!p) throw new AppError(404, 'Product not found');
    return p;
  }

  async getBySlug(slug: string): Promise<Product> {
    const p = await this.productRepo.findBySlug(slug);
    if (!p) throw new AppError(404, 'Product not found');
    return p;
  }

  async create(data: {
    title: string;
    description: string;
    price: number;
    category_id: string;
    brand?: string;
    features?: Record<string, any>;
    imageFiles?: Array<{ buffer: Buffer; mimetype: string; is_primary?: boolean }>;
    variants?: Array<{ sku: string; size?: string; color?: string; price?: number; stock_quantity?: number }>;
    created_by_id: string;
  }): Promise<Product> {
    // Validate category
    const category = await this.categoryRepo.findById(data.category_id);
    if (!category) throw new AppError(404, 'Category not found');

    const slug = toSlug(data.title);
    if (await this.productRepo.existsBySlug(slug)) {
      throw new AppError(409, `Product with this title already exists`);
    }

    // Upload images to Cloudinary
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
      slug,
      title: data.title,
      description: data.description,
      price: data.price,
      brand: data.brand ?? null,
      features: data.features ?? {},
      created_by_id: data.created_by_id,
    });

    // Save images
    if (images.length) {
      await this.productRepo.update(product.id, { images } as any);
    }

    // Create variants
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
      brand?: string | null;
      features?: Record<string, any>;
      newImageFiles?: Array<{ buffer: Buffer; mimetype: string }>;
      deleteImagePublicIds?: string[];
    },
    adminId: string,
  ): Promise<Product> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new AppError(404, 'Product not found');

    if (data.category_id) {
      const cat = await this.categoryRepo.findById(data.category_id);
      if (!cat) throw new AppError(404, 'Category not found');
    }

    const updates: Record<string, any> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.price !== undefined) updates.price = data.price;
    if (data.category_id !== undefined) updates.category_id = data.category_id;
    if (data.brand !== undefined) updates.brand = data.brand;
    if (data.features !== undefined) updates.features = data.features;

    // Handle image deletions
    let currentImages = product.images ?? [];
    if (data.deleteImagePublicIds?.length) {
      for (const pid of data.deleteImagePublicIds) {
        await deleteFromCloudinary(pid).catch(() => {});
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
    await this.productRepo.update(id, updates);

    return (await this.productRepo.findById(id))!;
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

  async delete(id: string): Promise<void> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new AppError(404, 'Product not found');

    // Delete Cloudinary images
    if (product.images?.length) {
      for (const img of product.images) {
        await deleteFromCloudinary(img.public_id).catch(() => {});
      }
    }

    await this.productRepo.softDelete(id);
  }
}
