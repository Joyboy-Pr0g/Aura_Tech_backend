import { Blog } from '../../models/Blog';

export interface CreateBlogDto {
  title: string;
  slug?: string;
  excerpt?: string | null;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  is_published?: boolean;
  cover_image_public_id?: string | null;
  cover_image_url?: string | null;
  author_id?: string | null;
  published_at?: Date | null;
}

export interface UpdateBlogDto {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  is_published?: boolean;
  cover_image_public_id?: string | null;
  cover_image_url?: string | null;
  published_at?: Date | null;
}

export interface IBlogRepository {
  findAll(): Promise<Blog[]>;
  findPublished(limit?: number): Promise<Blog[]>;
  findBySlug(slug: string, publishedOnly?: boolean): Promise<Blog | null>;
  findById(id: string): Promise<Blog | null>;
  create(data: CreateBlogDto): Promise<Blog>;
  update(id: string, data: UpdateBlogDto): Promise<Blog | null>;
  delete(id: string): Promise<void>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}
