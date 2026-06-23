import { Category } from '../../models/Category';

export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  parent_category_id?: string | null;
  image_url?: string | null;
  image_public_id?: string | null;
}

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  existsBySlug(slug: string): Promise<boolean>;
  create(dto: CreateCategoryDto): Promise<Category>;
  update(id: string, dto: Partial<CreateCategoryDto>): Promise<Category | null>;
  softDelete(id: string): Promise<void>;
}
