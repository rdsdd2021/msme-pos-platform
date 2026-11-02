import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export function getDatabaseConfig(configService: ConfigService): TypeOrmModuleOptions {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  let resolvedUrl = databaseUrl;
  if (!resolvedUrl) {
    const host = configService.get<string>('POSTGRES_HOST', 'localhost');
    const port = configService.get<number>('POSTGRES_PORT', 5432);
    const user = configService.get<string>('POSTGRES_USER', 'pos_admin');
    const password = configService.get<string>('POSTGRES_PASSWORD', '');
    const database = configService.get<string>('POSTGRES_DB', 'pos_platform');
    resolvedUrl = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  const sslRequired = configService.get<string>('DB_SSL') === 'true';
  const isProd = nodeEnv === 'production';

  return {
    type: 'postgres',
    url: resolvedUrl,
    entities: isProd
      ? [join(__dirname, '..', '**', '*.entity.js')]
      : [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [],
    migrationsRun: false,
    synchronize: false, // Never use synchronize in production
    logging: nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
    ssl: sslRequired ? { rejectUnauthorized: false } : false,
    extra: {
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
  };
}
