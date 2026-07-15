import { AppDataSource } from '../config/database';
import { Category } from '../models/Category';

const categories = [
  {
    name: 'Laptops',
    slug: 'laptops',
    description: 'Notebooks and ultrabooks for work and gaming',
  },
  {
    name: 'Smartphones',
    slug: 'smartphones',
    description: 'Android and iOS mobile devices',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Cables, cases, chargers, and peripherals',
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Consoles, controllers, and gaming gear',
    parentSlug: 'accessories',
  },
];

export async function seedCategories(): Promise<void> {
  const repo = AppDataSource.getRepository(Category);
  const slugToId = new Map<string, string>();

  for (const cat of categories.filter((c) => !c.parentSlug)) {
    const existing = await repo.findOne({ where: { slug: cat.slug } });
    if (existing) {
      slugToId.set(cat.slug, existing.id);
      console.log(`⏭️  Skipped category (exists): ${cat.name}`);
      continue;
    }
    const saved = await repo.save(repo.create(cat));
    slugToId.set(cat.slug, saved.id);
    console.log(`✅ Created category: ${cat.name}`);
  }

  for (const cat of categories.filter((c) => c.parentSlug)) {
    const existing = await repo.findOne({ where: { slug: cat.slug } });
    if (existing) {
      console.log(`⏭️  Skipped category (exists): ${cat.name}`);
      continue;
    }
    const parentId = slugToId.get(cat.parentSlug!);
    if (!parentId) continue;
    await repo.save(
      repo.create({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parent_category_id: parentId,
      }),
    );
    console.log(`✅ Created sub-category: ${cat.name}`);
  }
}
