import { randomBytes } from 'crypto';

export function generateDeviceApiKey(): string {
  return randomBytes(32).toString('hex');
}
