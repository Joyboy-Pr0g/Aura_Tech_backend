import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { AppError } from '../../core/errors/AppError';
import {
  ICategoryRepository,
  CategoryFilters,
  UpdateCategoryDto,
} from '../../interfaces/repositories/ICategoryRepository';
import { Category } from '../../models/Category';
import { CursorListResult, decodeCreatedAtIdCursor } from '../../utils/cursorPagination';
import { deleteFromCloudinary, uploadToCloudinary } from '../../config/cloudinary';
import { CategoryDto } from '../../mappers/categories.mapper';
import { logAdminAction } from '../../utils/logAdminAction';

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export interface AdminCreateCategoryInput {
  name: string;
  description?: string;
  parent_category_id?: string | null;
  is_active?: boolean;
  imageFile?: { buffer: Buffer; mimetype: string };
}

export interface AdminUpdateCategoryInput {
  name?: string;
  description?: string | null;
  parent_category_id?: string | null;
  is_active?: boolean;
  imageFile?: { buffer: Buffer; mimetype: string };
}

@injectable()
export class AdminCategoryService {
  constructor(
    @inject(REPOSITORY_TOKENS.ICategoryRepository) private categoryRepo: ICategoryRepository,
  ) { }

  async getCategories(filters: Omit<CategoryFilters, 'cursor'> & { cursor?: string }): Promise<CursorListResult<CategoryDto>> {
    const decoded = decodeCreatedAtIdCursor(filters.cursor ?? '');
    if (decoded === 'invalid') {
      throw new AppError(400, 'Invalid or malformed cursor');
    }

    return this.categoryRepo.findManyAdmin({ ...filters, cursor: decoded });
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new AppError(404, 'Category not found');
    return category;
  }

  async createCategory(data: AdminCreateCategoryInput, adminId: string): Promise<Category> {
    const slug = toSlug(data.name);
    if (await this.categoryRepo.existsBySlug(slug)) {
      throw new AppError(409, `Category "${data.name}" already exists`);
    }

    if (data.parent_category_id) {
      const parent = await this.categoryRepo.findById(data.parent_category_id);
      if (!parent || parent.deleted_at) {
        throw new AppError(404, 'Parent category not found');
      }
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

    const category = await this.categoryRepo.create({
      name: data.name,
      slug,
      description: data.description,
      parent_category_id: data.parent_category_id ?? null,
      image_url,
      image_public_id,
      is_active: data.is_active ?? true,
    });

    void logAdminAction({
      admin_id: adminId,
      action: 'create',
      entity_type: 'category',
      entity_id: category.id,
      changes_json: { name: category.name },
    });

    return category;
  }

  async updateCategory(id: string, data: AdminUpdateCategoryInput, adminId: string): Promise<Category> {
    const category = await this.categoryRepo.findById(id);
    if (!category || category.deleted_at) {
      throw new AppError(404, 'Category not found');
    }

    const updates: UpdateCategoryDto = {};

    if (data.name && data.name !== category.name) {
      const slug = toSlug(data.name);
      if (await this.categoryRepo.existsBySlug(slug, id)) {
        throw new AppError(409, `Category name "${data.name}" already exists`);
      }
      updates.name = data.name;
      updates.slug = slug;
    }

    if (data.description !== undefined) updates.description = data.description;
    if (data.is_active !== undefined) updates.is_active = data.is_active;

    if (data.parent_category_id !== undefined) {
      if (data.parent_category_id === id) {
        throw new AppError(400, 'Category cannot be its own parent');
      }
      if (data.parent_category_id) {
        const parent = await this.categoryRepo.findById(data.parent_category_id);
        if (!parent || parent.deleted_at) {
          throw new AppError(404, 'Parent category not found');
        }
      }
      updates.parent_category_id = data.parent_category_id;
    }

    if (data.imageFile) {
      if (category.image_public_id) {
        await deleteFromCloudinary(category.image_public_id).catch(() => { });
      }
      const uploaded = await uploadToCloudinary(
        data.imageFile.buffer,
        'aura-tech/categories',
        data.imageFile.mimetype,
      );
      updates.image_url = uploaded.url;
      updates.image_public_id = uploaded.public_id;
    }

    const updated = await this.categoryRepo.update(id, updates);
    if (!updated) throw new AppError(404, 'Category not found');

    void logAdminAction({
      admin_id: adminId,
      action: 'update',
      entity_type: 'category',
      entity_id: id,
      changes_json: updates as Record<string, unknown>,
    });

    return updated;
  }

  async activateCategory(id: string, adminId: string): Promise<void> {
    const category = await this.ensureExists(id);
    if (category.is_active) throw new AppError(400, 'Category is already active');
    await this.categoryRepo.activate(id);
    void logAdminAction({ admin_id: adminId, action: 'activate', entity_type: 'category', entity_id: id });
  }

  async deactivateCategory(id: string, adminId: string): Promise<void> {
    const category = await this.ensureNoChildren(id);
    if (!category.is_active) throw new AppError(400, 'Category is already inactive');
    await this.categoryRepo.deactivate(id);
    void logAdminAction({ admin_id: adminId, action: 'deactivate', entity_type: 'category', entity_id: id });
  }

  async unassignParentCategory(id: string, adminId: string): Promise<void> {
    await this.ensureExists(id);
    await this.categoryRepo.unassignParentCategory(id);
    void logAdminAction({ admin_id: adminId, action: 'unassign_parent', entity_type: 'category', entity_id: id });
  }

  async deleteCategory(id: string, adminId: string): Promise<void> {
    const category = await this.ensureNoChildren(id);
    if (category.image_public_id) {
      await deleteFromCloudinary(category.image_public_id).catch(() => { });
    }
    await this.categoryRepo.delete(id);
    void logAdminAction({ admin_id: adminId, action: 'delete', entity_type: 'category', entity_id: id });
  }

  async softDeleteCategory(id: string, adminId: string): Promise<void> {
    const category = await this.ensureNoChildren(id);
    if (category.deleted_at) throw new AppError(400, 'Category is already soft deleted');
    await this.categoryRepo.softDelete(id);
    void logAdminAction({ admin_id: adminId, action: 'soft_delete', entity_type: 'category', entity_id: id });
  }

  async restoreCategory(id: string, adminId: string): Promise<void> {
    const category = await this.ensureExists(id);
    if (!category.deleted_at) throw new AppError(400, 'Category is not soft deleted');
    await this.categoryRepo.restore(id);
    void logAdminAction({ admin_id: adminId, action: 'restore', entity_type: 'category', entity_id: id });
  }

  private async ensureExists(id: string): Promise<Category> {
    const category = await this.categoryRepo.findCategoryAdmin(id);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }
    return category;
  }

  private async ensureNoChildren(id: string): Promise<Category> {
    const category = await this.categoryRepo.findCategoryAdmin(id);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    if (category.children && category.children.length > 0) {
      throw new AppError(400, 'Category has subcategories');
    }

    if (category.products && category.products.length > 0) {
      throw new AppError(400, 'Category has products');
    }

    return category;
  }
}
