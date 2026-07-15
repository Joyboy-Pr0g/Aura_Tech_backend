import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

export function generatePassword(length = 12): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let password = '';

  for (let i = 0; i < length; i++) {
    password += chars[randomInt(chars.length)];
  }

  return password;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
