import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminService } from './platform-admin.service';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { UserEntity } from '../tenants/entities/user.entity';
import { TenantMembershipEntity } from '../tenants/entities/tenant-membership.entity';
import { DeviceEntity } from '../commercial/entities/device.entity';
import { TenantSubscriptionEntity } from '../commercial/entities/tenant-subscription.entity';
import { InvoiceEntity } from '../billing/entities/invoice.entity';
import { AuditLogEntity } from '../tenants/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantEntity,
      BranchEntity,
      UserEntity,
      TenantMembershipEntity,
      DeviceEntity,
      TenantSubscriptionEntity,
      InvoiceEntity,
      AuditLogEntity,
    ]),
  ],
  controllers: [PlatformAdminController],
  providers: [PlatformAdminService],
  exports: [PlatformAdminService],
})
export class PlatformAdminModule {}
