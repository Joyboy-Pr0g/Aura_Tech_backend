import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IBlogRepository } from '../../interfaces/repositories/IBlogRepository';
import { Blog } from '../../models/Blog';
import { AppError } from '../../core/errors/AppError';
import { deleteFromCloudinary, uploadToCloudinary } from '../../config/cloudinary';
import { blogToSlug } from '../../validators/blog.validator';

function toNullableString(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

@injectable()
export class BlogService {
  constructor(@inject(REPOSITORY_TOKENS.IBlogRepository) private blogRepo: IBlogRepository) {}

  listPublished(): Promise<Blog[]> {
    return this.blogRepo.findPublished();
  }

  getPublishedBySlug(slug: string): Promise<Blog> {
    return this.ensurePublished(slug);
  }

  listAll(): Promise<Blog[]> {
    return this.blogRepo.findAll();
  }

  getById(id: string): Promise<Blog> {
    return this.ensureExists(id);
  }

  async create(data: {
    title: string;
    slug?: string;
    excerpt?: string | null;
    content: string;
    meta_title?: string | null;
    meta_description?: string | null;
    is_published?: boolean;
    author_id?: string;
    coverFile?: { buffer: Buffer; mimetype: string };
  }): Promise<Blog> {
    const slug = await this.resolveUniqueSlug(
      data.slug?.trim() ? blogToSlug(data.slug.trim()) : blogToSlug(data.title),
    );
    let cover_image_public_id: string | null = null;
    let cover_image_url: string | null = null;

    if (data.coverFile) {
      const uploaded = await uploadToCloudinary(
        data.coverFile.buffer,
        'aura-tech/blogs',
        data.coverFile.mimetype,
      );
      cover_image_public_id = uploaded.public_id;
      cover_image_url = uploaded.url;
    }

    const isPublished = data.is_published ?? false;
    return this.blogRepo.create({
      title: data.title.trim(),
      slug,
      excerpt: toNullableString(data.excerpt),
      content: data.content.trim(),
      meta_title: toNullableString(data.meta_title),
      meta_description: toNullableString(data.meta_description),
      is_published: isPublished,
      published_at: isPublished ? new Date() : null,
      author_id: data.author_id ?? null,
      cover_image_public_id,
      cover_image_url,
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      slug?: string;
      excerpt?: string | null;
      content?: string;
      meta_title?: string | null;
      meta_description?: string | null;
      is_published?: boolean;
      remove_cover_image?: boolean;
      coverFile?: { buffer: Buffer; mimetype: string };
    },
  ): Promise<Blog> {
    const current = await this.ensureExists(id);
    const patch: Record<string, unknown> = {};

    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.content !== undefined) patch.content = data.content.trim();
    if (data.excerpt !== undefined) patch.excerpt = toNullableString(data.excerpt);
    if (data.meta_title !== undefined) patch.meta_title = toNullableString(data.meta_title);
    if (data.meta_description !== undefined) patch.meta_description = toNullableString(data.meta_description);

    if (data.slug !== undefined) {
      patch.slug = await this.resolveUniqueSlug(blogToSlug(data.slug), id);
    } else if (data.title !== undefined) {
      patch.slug = await this.resolveUniqueSlug(blogToSlug(data.title), id);
    }

    if (data.is_published !== undefined) {
      patch.is_published = data.is_published;
      if (data.is_published && !current.published_at) {
        patch.published_at = new Date();
      }
      if (!data.is_published) {
        patch.published_at = null;
      }
    }

    if (data.remove_cover_image && current.cover_image_public_id) {
      await deleteFromCloudinary(current.cover_image_public_id);
      patch.cover_image_public_id = null;
      patch.cover_image_url = null;
    }

    if (data.coverFile) {
      if (current.cover_image_public_id) {
        await deleteFromCloudinary(current.cover_image_public_id);
      }
      const uploaded = await uploadToCloudinary(
        data.coverFile.buffer,
        'aura-tech/blogs',
        data.coverFile.mimetype,
      );
      patch.cover_image_public_id = uploaded.public_id;
      patch.cover_image_url = uploaded.url;
    }

    const updated = await this.blogRepo.update(id, patch);
    if (!updated) throw new AppError(404, 'Blog not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const blog = await this.ensureExists(id);
    if (blog.cover_image_public_id) {
      await deleteFromCloudinary(blog.cover_image_public_id);
    }
    await this.blogRepo.delete(id);
  }

  private async resolveUniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let counter = 1;
    while (await this.blogRepo.slugExists(slug, excludeId)) {
      slug = `${base}-${counter++}`;
    }
    return slug;
  }

  private async ensureExists(id: string): Promise<Blog> {
    const blog = await this.blogRepo.findById(id);
    if (!blog) throw new AppError(404, 'Blog not found');
    return blog;
  }

  private async ensurePublished(slug: string): Promise<Blog> {
    const blog = await this.blogRepo.findBySlug(slug, true);
    if (!blog) throw new AppError(404, 'Blog not found');
    return blog;
  }
}
