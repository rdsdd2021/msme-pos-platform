import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommercialService } from './commercial.service';
import { CommercialController } from './commercial.controller';
import { DeviceEntity } from './entities/device.entity';
import { TenantSubscriptionEntity } from './entities/tenant-subscription.entity';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceEntity, TenantSubscriptionEntity]), TenantsModule],
  controllers: [CommercialController],
  providers: [CommercialService],
  exports: [CommercialService],
})
export class CommercialModule {}
