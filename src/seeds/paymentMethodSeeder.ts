import { AppDataSource } from '../config/database';
import { PaymentMethod } from '../models/PaymentMethod';
import { ENGLISH_PAYMENT_METHODS } from '../constants/englishCatalogSeed';

export type SeedPaymentMethodsOptions = {
  /** When true, refresh English fields on existing rows matched by name. */
  overwrite?: boolean;
};

export async function seedPaymentMethods(options: SeedPaymentMethodsOptions = {}): Promise<void> {
  const overwrite = options.overwrite ?? false;
  const repo = AppDataSource.getRepository(PaymentMethod);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const pm of ENGLISH_PAYMENT_METHODS) {
    const existing = await repo.findOne({ where: { name: pm.name } });
    if (!existing) {
      await repo.save(repo.create(pm));
      created++;
      continue;
    }

    if (overwrite) {
      await repo.update(existing.id, {
        account_holder_name: pm.account_holder_name,
        bank_name: pm.bank_name,
        account_number: pm.account_number,
        iban: pm.iban,
        swift_code: pm.swift_code,
        description: pm.description,
        is_active: pm.is_active,
      });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(
    `✅ Payment methods seed: ${created} created, ${updated} updated, ${skipped} skipped (${ENGLISH_PAYMENT_METHODS.length} in catalog).`,
  );
}
