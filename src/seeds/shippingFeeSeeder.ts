import { AppDataSource } from '../config/database';
import { ShippingFee } from '../models/ShippingFee';
import { ENGLISH_SHIPPING_FEES } from '../constants/englishCatalogSeed';

export type SeedShippingFeesOptions = {
  /** When true, update price/duration/is_active for matching delivery_way rows. */
  overwrite?: boolean;
};

export async function seedShippingFees(options: SeedShippingFeesOptions = {}): Promise<void> {
  const overwrite = options.overwrite ?? true;
  const repo = AppDataSource.getRepository(ShippingFee);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of ENGLISH_SHIPPING_FEES) {
    const existing = await repo.findOne({
      where: { delivery_way: row.delivery_way },
    });

    if (!existing) {
      await repo.save(repo.create(row));
      created++;
      continue;
    }

    if (overwrite) {
      await repo.update(existing.id, {
        price: row.price,
        duration: row.duration,
        is_active: row.is_active,
      });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(
    `✅ Shipping fees seed: ${created} created, ${updated} updated, ${skipped} skipped (${ENGLISH_SHIPPING_FEES.length} in catalog).`,
  );
}
