import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export function getDatabaseConfig(configService: ConfigService): TypeOrmModuleOptions {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return {
    type: 'postgres',
    url: databaseUrl,
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', '..', '..', 'database', 'migrations', '*.{ts,js}')],
    migrationsRun: false,
    synchronize: false, // Never use synchronize in production
    logging: nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
    ssl: nodeEnv === 'production' ? { rejectUnauthorized: true } : false,
    extra: {
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
  };
}
