import { AppDataSource } from '../config/database';
import { PaymentMethod } from '../models/PaymentMethod';

const paymentMethods = [
  {
    name: 'Bank of Yemen - Main Account',
    account_holder_name: 'AURA TECH LLC',
    bank_name: 'Bank of Yemen',
    account_number: '1234567890',
    iban: 'YE1234567890123456789012',
    swift_code: 'BOYMYE22',
    description: 'Primary bank transfer account for customer payments',
  },
  {
    name: 'CAC Bank - Secondary',
    account_holder_name: 'AURA TECH LLC',
    bank_name: 'CAC Bank',
    account_number: '9876543210',
    iban: null,
    swift_code: null,
    description: 'Backup payment account',
  },
];

export async function seedPaymentMethods(): Promise<void> {
  const repo = AppDataSource.getRepository(PaymentMethod);

  for (const pm of paymentMethods) {
    const existing = await repo.findOne({ where: { name: pm.name } });
    if (existing) {
      console.log(`⏭️  Skipped payment method (exists): ${pm.name}`);
      continue;
    }

    await repo.save(repo.create(pm));
    console.log(`✅ Created payment method: ${pm.name}`);
  }
}
