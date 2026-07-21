import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../config/database';
import { seedPaymentProviders } from './paymentBridgeSeeder';

async function run(): Promise<void> {
  await AppDataSource.initialize();
  await seedPaymentProviders();
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('Payment bridge seed failed:', err.message);
  process.exit(1);
});
