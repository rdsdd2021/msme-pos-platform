import { DataSource } from 'typeorm';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required for migrations');
}

const rootDir = process.cwd();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [
    resolve(rootDir, 'src/**/*.entity.{ts,js}'),
    resolve(rootDir, 'apps/backend/src/**/*.entity.{ts,js}'),
  ],
  migrations: [
    resolve(rootDir, '../../database/migrations/*.{ts,js}'),
    resolve(rootDir, 'database/migrations/*.{ts,js}'),
  ],
  synchronize: false,
  logging: true,
});
