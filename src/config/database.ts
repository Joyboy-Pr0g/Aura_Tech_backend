import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';
import { buildPostgresDataSourceOptions } from './db-options';

export const AppDataSource = new DataSource(
  buildPostgresDataSourceOptions({
    entities: path.join(__dirname, '../models/*.{ts,js}'),
    migrations: path.join(__dirname, '../database/migrations/*.{ts,js}'),
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
  }),
);

export async function initializeDatabase(): Promise<void> {
  await AppDataSource.initialize();
  console.log('✅ PostgreSQL connected');
  await AppDataSource.runMigrations();
  console.log('✅ Migrations applied');
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('PostgreSQL connection closed');
  }
}
