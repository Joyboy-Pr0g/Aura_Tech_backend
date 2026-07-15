import { Category } from '../../models/Category';
import { DecodedCursor, CursorListResult } from '../../utils/cursorPagination';
import { CategoryDto } from '../../mappers/categories.mapper';

export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  parent_category_id?: string | null;
  image_url?: string | null;
  image_public_id?: string | null;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  parent_category_id?: string | null;
  image_url?: string | null;
  image_public_id?: string | null;
}

export interface CategoryFilters {
  search?: string;
  is_active?: boolean;
  parent_category_id?: string | null;
  cursor?: DecodedCursor | null;
  limit?: number;
  /** When true, include soft-deleted rows */
  include_deleted?: boolean;
}

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
  create(dto: CreateCategoryDto): Promise<Category>;
  update(id: string, dto: Partial<CreateCategoryDto> | UpdateCategoryDto): Promise<Category | null>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  activate(id: string): Promise<void>;
  deactivate(id: string): Promise<void>;
  unassignParentCategory(id: string): Promise<void>;
  findManyAdmin(filters: CategoryFilters): Promise<CursorListResult<CategoryDto>>;
  findCategoryAdmin(id: string): Promise<Category | null>;
}
