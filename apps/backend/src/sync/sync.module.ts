import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { SyncIngestedOperationEntity } from './entities/sync-ingested-operation.entity';
import { DeviceInvoiceRangeEntity } from './entities/device-invoice-range.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { CategoryEntity } from '../catalog/entities/category.entity';
import { DeviceEntity } from '../commercial/entities/device.entity';
import { BillingModule } from '../billing/billing.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SyncIngestedOperationEntity,
      DeviceInvoiceRangeEntity,
      ProductEntity,
      CategoryEntity,
      DeviceEntity,
    ]),
    BillingModule,
    TenantsModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}

