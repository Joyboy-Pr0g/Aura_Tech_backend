import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { hashPassword } from '../utils/password';
import { Role, UserStatus } from '../types/rbac';

const seedUsers = [
  {
    email: 'admin@auratech.com',
    password: 'Admin@123456',
    role: Role.ADMIN,
    phone: '+9671000001',
  },
  {
    email: 'subadmin@auratech.com',
    password: 'Admin@123456',
    role: Role.SUB_ADMIN,
    phone: '+9671000002',
  },
  {
    email: 'customer@auratech.com',
    password: 'Customer@123456',
    role: Role.CUSTOMER,
    phone: '+9671000003',
  },
];

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  console.log('🌱 Seeding users...\n');

  const repo = AppDataSource.getRepository(User);

  for (const u of seedUsers) {
    const exists = await repo.findOne({ where: { email: u.email } });
    if (exists) {
      console.log(`⏭️  Skipped (exists): ${u.email}`);
      continue;
    }

    await repo.save(
      repo.create({
        email: u.email,
        password_hash: await hashPassword(u.password),
        phone: u.phone,
        role: u.role,
        status: UserStatus.ACTIVE,
      }),
    );
    console.log(`✅ Created [${u.role.padEnd(9)}] ${u.email}  pw: ${u.password}`);
  }

  console.log('\n✅ Seed complete');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
