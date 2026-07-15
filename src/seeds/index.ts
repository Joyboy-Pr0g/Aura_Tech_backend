import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../config/database';
import { seedUsersData } from './userSeeder';
import { seedCategories } from './categorySeeder';
import { seedProducts } from './productSeeder';
import { seedPaymentMethods } from './paymentMethodSeeder';
import { seedCoupons } from './couponSeeder';

async function runAll(): Promise<void> {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  console.log('🌱 Running all seeders...\n');

  console.log('── Users ──');
  await seedUsersData();

  console.log('\n── Categories ──');
  await seedCategories();

  console.log('\n── Products ──');
  await seedProducts();

  console.log('\n── Payment Methods ──');
  await seedPaymentMethods();

  console.log('\n── Coupons ──');
  await seedCoupons();

  console.log('\n✅ All seeders complete');
  await AppDataSource.destroy();
}

runAll().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
