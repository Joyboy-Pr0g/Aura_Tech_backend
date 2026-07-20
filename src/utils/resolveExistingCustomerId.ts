import { AppDataSource } from '../config/database';
import { User } from '../models/User';

/** Drop stale JWT user ids that no longer exist in `users`. */
export async function resolveExistingCustomerId(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  const exists = await AppDataSource.getRepository(User).exist({ where: { id: customerId } });
  return exists ? customerId : null;
}
