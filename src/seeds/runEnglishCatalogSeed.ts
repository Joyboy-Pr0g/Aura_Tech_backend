import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../config/database';
import { seedUsersData } from './userSeeder';
import { seedCategories } from './categorySeeder';
import { seedWebsiteSettings } from './websiteSettingsSeeder';
import { seedShippingFees } from './shippingFeeSeeder';
import { seedPaymentMethods } from './paymentMethodSeeder';
import { seedProducts } from './productSeeder';

/**
 * Seeds English catalog data for website settings, shipping, payments, and products.
 * Requires categories + admin user for products.
 *
 * Usage: npm run seed:english-catalog
 */
async function run(): Promise<void> {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  console.log('🌱 English catalog seed\n');

  console.log('── Users ──');
  await seedUsersData();

  console.log('\n── Categories ──');
  await seedCategories();

  console.log('\n── Website settings (English) ──');
  await seedWebsiteSettings({ overwrite: true });

  console.log('\n── Shipping fees (English) ──');
  await seedShippingFees({ overwrite: true });

  console.log('\n── Payment methods (English) ──');
  await seedPaymentMethods({ overwrite: true });

  console.log('\n── Products (English catalog) ──');
  await seedProducts();

  console.log('\n✅ English catalog seed complete');
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('❌ English catalog seed failed:', err.message);
  process.exit(1);
});
