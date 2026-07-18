import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import * as path from 'path';
import { buildPostgresDataSourceOptions } from './src/config/db-options';

export default new DataSource(
  buildPostgresDataSourceOptions({
    entities: path.join(__dirname, 'src/models/*.{ts,js}'),
    migrations: path.join(__dirname, 'src/database/migrations/*.{ts,js}'),
    logging: true,
  }),
);
