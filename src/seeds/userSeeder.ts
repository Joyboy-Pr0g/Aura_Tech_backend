import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { hashPassword } from '../utils/password';
import { Role, UserStatus } from '../types/rbac';

const seedUsers = [
  {
    full_name: 'Haithm Alsaeedi',
    email: 'admin@auratech.com',
    password: 'Admin@123456',
    role: Role.ADMIN,
    phone: '+9671000001',
  },
  {
    full_name: 'Haithm Alsaeedi',
    email: 'subadmin@auratech.com',
    password: 'Admin@123456',
    role: Role.SUB_ADMIN,
    phone: '+9671000002',
  },
  {
    full_name: 'Haithm Alsaeedi',
    email: 'customer@auratech.com',
    password: 'Customer@123456',
    role: Role.CUSTOMER,
    phone: '+9671000003',
  },
];

export async function seedUsersData(): Promise<void> {
  const repo = AppDataSource.getRepository(User);

  for (const u of seedUsers) {
    const exists = await repo.findOne({ where: { email: u.email } });
    if (exists) {
      console.log(`⏭️  Skipped user (exists): ${u.email}`);
      continue;
    }

    await repo.save(
      repo.create({
        full_name: u.full_name,
        email: u.email,
        password_hash: await hashPassword(u.password),
        phone: u.phone,
        role: u.role,
        status: UserStatus.ACTIVE,
      }),
    );
    console.log(`✅ Created [${u.role.padEnd(9)}] ${u.email}  pw: ${u.password}`);
  }
}
