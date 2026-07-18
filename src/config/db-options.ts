import type { DataSourceOptions } from 'typeorm';

interface PostgresPathOptions {
  entities: string;
  migrations: string;
  logging?: boolean | ('error' | 'warn')[];
}

export function buildPostgresDataSourceOptions({
  entities,
  migrations,
  logging = false,
}: PostgresPathOptions): DataSourceOptions {
  const poolSize = parseInt(process.env.DB_POOL_SIZE || '10', 10);
  const ssl =
    process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [entities],
      migrations: [migrations],
      synchronize: false,
      logging,
      ssl,
      extra: { max: poolSize },
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aura_tech',
    entities: [entities],
    migrations: [migrations],
    synchronize: false,
    logging,
    ssl,
    extra: { max: poolSize },
  };
}

export function hasDatabaseConfig(): boolean {
  return Boolean(
    process.env.DATABASE_URL?.trim()
      || (process.env.DB_HOST?.trim() && process.env.DB_PASSWORD),
  );
}
