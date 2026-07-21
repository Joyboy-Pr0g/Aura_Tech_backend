import { AppDataSource } from '../config/database';
import { PaymentProvider } from '../models/PaymentProvider';

export async function seedPaymentProviders(): Promise<void> {
  const repo = AppDataSource.getRepository(PaymentProvider);
  const count = await repo.count();
  if (count > 0) {
    console.log('Payment providers already seeded, skipping.');
    return;
  }

  await repo.save([
    repo.create({
      name: 'ejaib',
      aliases: ['JAIB', 'eJaib', 'EJAIB'],
      is_active: true,
    }),
    repo.create({
      name: 'kuraimi',
      aliases: ['KURAIMI', 'الكريمي', 'Kuraimi'],
      is_active: true,
    }),
  ]);

  console.log('Payment providers seeded.');
}
