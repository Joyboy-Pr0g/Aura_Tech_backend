import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import type { Server } from 'http';
import app from './app';
import { closeDatabase, initializeDatabase } from './config/database';
import { closeRedis, getRedisClient } from './config/redis';
import { startScheduledJobs } from './jobs/scheduler';
import { getFirebaseAdmin, isFirebaseConfigured } from './config/firebase';

const PORT = parseInt(process.env.PORT || '3000');

let server: Server | undefined;
let shuttingDown = false;

const shutdown = (signal: string) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  console.log(`${signal} received. Shutting down gracefully...`);

  server?.close(async () => {
    await closeDatabase();
    await closeRedis();
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

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

  startScheduledJobs();

  if (isFirebaseConfigured()) {
    getFirebaseAdmin();
    console.log('   Firebase : push notifications enabled');
  } else {
    console.log('   Firebase : not configured (email notifications still work)');
  }

  // ─── Start HTTP Server ──────────────────────────────────────────────────
  server = app.listen(PORT, () => {
    console.log(`\n🚀 AURA TECH Backend running`);
    console.log(`   Port     : ${PORT}`);
    console.log(`   Env      : ${process.env.NODE_ENV}`);
    console.log(`   Health   : http://localhost:${PORT}/health`);
    console.log(`   Auth API : http://localhost:${PORT}/api/auth\n`);
  });

  server.requestTimeout = 30000;
  server.headersTimeout = 35000;
  server.keepAliveTimeout = 65000;

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err: Error) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
