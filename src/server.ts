import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initializeDatabase } from './config/database';
import { getRedisClient } from './config/redis';

const PORT = parseInt(process.env.PORT || '3000');

async function bootstrap(): Promise<void> {
  // ─── Boot Validation ────────────────────────────────────────────────────
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  if (!process.env.DB_PASSWORD) {
    throw new Error('DB_PASSWORD is required');
  }

  // ─── Connect Database ───────────────────────────────────────────────────
  await initializeDatabase();

  // ─── Connect Redis ──────────────────────────────────────────────────────
  getRedisClient();

  // ─── Start HTTP Server ──────────────────────────────────────────────────
  app.listen(PORT, () => {
    console.log(`\n🚀 AURA TECH Backend running`);
    console.log(`   Port     : ${PORT}`);
    console.log(`   Env      : ${process.env.NODE_ENV}`);
    console.log(`   Health   : http://localhost:${PORT}/health`);
    console.log(`   Auth API : http://localhost:${PORT}/api/auth\n`);
  });
}

bootstrap().catch((err: Error) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
