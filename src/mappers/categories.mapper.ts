import { Category } from '../models';
import { Product } from '../models';

export interface CategoryDto {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    image_url: string | null;
    image_public_id: string | null;
    parent_category_id: string | null;
    product_count: number;
    deleted_at: Date | null;
    children: ChildCategoryDto[];
}

export interface ChildCategoryDto {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    image_public_id: string | null;
    is_active: boolean;
    deleted_at: Date | null;
    parent_category_id: string | null;
}
export const categoryToDto = (category: Category): CategoryDto => {
    return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        is_active: category.is_active,
        image_url: category.image_url,
        image_public_id: category.image_public_id,
        parent_category_id: category.parent_category_id,
        deleted_at: category.deleted_at,
        children: category.children.map(childCategoryToDto),
        product_count: category.product_count,
    }
}

export const childCategoryToDto = (child: Category): ChildCategoryDto => {
    return {
        id: child.id,
        name: child.name,
        slug: child.slug,
        image_url: child.image_url,
        image_public_id: child.image_public_id,
        is_active: child.is_active,
        deleted_at: child.deleted_at,
        parent_category_id: child.parent_category_id,
    }
}