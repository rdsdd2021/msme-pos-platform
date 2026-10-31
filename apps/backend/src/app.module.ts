import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { CatalogModule } from './catalog/catalog.module';
import { BillingModule } from './billing/billing.module';
import { HardwareModule } from './hardware/hardware.module';
import { SyncModule } from './sync/sync.module';
import { OperationsModule } from './operations/operations.module';
import { CommercialModule } from './commercial/commercial.module';
import { getDatabaseConfig } from './database/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    HealthModule,
    AuthModule,
    TenantsModule,
    CatalogModule,
    BillingModule,
    HardwareModule,
    SyncModule,
    OperationsModule,
    CommercialModule,
  ],
})
export class AppModule {}
