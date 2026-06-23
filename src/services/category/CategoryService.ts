import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { ICategoryRepository } from '../../interfaces/repositories/ICategoryRepository';
import { AppError } from '../../core/errors/AppError';
import { deleteFromCloudinary, uploadToCloudinary } from '../../config/cloudinary';
import { Category } from '../../models/Category';

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

  async create(data: {
    name: string;
    description?: string;
    parent_category_id?: string;
    is_active?: boolean;
    imageFile?: { buffer: Buffer; mimetype: string };
  }): Promise<Category> {
    const slug = toSlug(data.name);

    if (await this.categoryRepo.existsBySlug(slug)) {
      throw new AppError(409, `Category "${data.name}" already exists`);
    }

    let image_url: string | null = null;
    let image_public_id: string | null = null;

    if (data.imageFile) {
      const uploaded = await uploadToCloudinary(
        data.imageFile.buffer,
        'aura-tech/categories',
        data.imageFile.mimetype,
      );
      image_url = uploaded.url;
      image_public_id = uploaded.public_id;
    }

    return this.categoryRepo.create({
      name: data.name,
      slug,
      description: data.description,
      parent_category_id: data.parent_category_id ?? null,
      image_url,
      image_public_id,
      is_active: data.is_active ?? true,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      parent_category_id?: string | null;
      imageFile?: { buffer: Buffer; mimetype: string };
    },
  ): Promise<Category> {
    const cat = await this.categoryRepo.findById(id);
    if (!cat) throw new AppError(404, 'Category not found');

    const updates: Record<string, any> = {};

    if (data.name && data.name !== cat.name) {
      const slug = toSlug(data.name);
      if (await this.categoryRepo.existsBySlug(slug)) {
        throw new AppError(409, `Category name "${data.name}" already exists`);
      }
      updates.name = data.name;
      updates.slug = slug;
    }
    if (data.description !== undefined) updates.description = data.description;
    if (data.parent_category_id !== undefined) updates.parent_category_id = data.parent_category_id;

    if (data.imageFile) {
      // Delete old image
      if (cat.image_public_id) await deleteFromCloudinary(cat.image_public_id).catch(() => {});
      const uploaded = await uploadToCloudinary(
        data.imageFile.buffer,
        'aura-tech/categories',
        data.imageFile.mimetype,
      );
      updates.image_url = uploaded.url;
      updates.image_public_id = uploaded.public_id;
    }

    return (await this.categoryRepo.update(id, updates))!;
  }

  async delete(id: string): Promise<void> {
    const cat = await this.categoryRepo.findById(id);
    if (!cat) throw new AppError(404, 'Category not found');
    if (cat.image_public_id) await deleteFromCloudinary(cat.image_public_id).catch(() => {});
    await this.categoryRepo.softDelete(id);
  }
}
