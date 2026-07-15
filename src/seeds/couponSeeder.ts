import { AppDataSource } from '../config/database';
import { Coupon } from '../models/Coupon';

const coupons = [
  {
    code: 'WELCOME10',
    discount_type: 'percentage',
    discount_value: 10,
    max_uses: 1000,
    min_purchase_amount: 50,
    max_discount_amount: 100,
    is_active: true,
  },
  {
    code: 'FLAT50',
    discount_type: 'fixed_amount',
    discount_value: 50,
    max_uses: 500,
    min_purchase_amount: 200,
    is_active: true,
  },
];

export async function seedCoupons(): Promise<void> {
  const repo = AppDataSource.getRepository(Coupon);

  for (const c of coupons) {
    const existing = await repo.findOne({ where: { code: c.code } });
    if (existing) {
      console.log(`⏭️  Skipped coupon (exists): ${c.code}`);
      continue;
    }

    await repo.save(repo.create(c));
    console.log(`✅ Created coupon: ${c.code}`);
  }
}
