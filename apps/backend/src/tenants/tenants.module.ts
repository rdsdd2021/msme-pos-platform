import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { TenantEntity } from './entities/tenant.entity';
import { TenantMembershipEntity } from './entities/tenant-membership.entity';
import { BranchEntity } from './entities/branch.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { TenantGuard } from './guards/tenant.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantEntity,
      TenantMembershipEntity,
      BranchEntity,
      AuditLogEntity,
    ]),
  ],
  controllers: [TenantsController],
  providers: [TenantsService, TenantGuard],
  exports: [TenantsService, TenantGuard],
})
export class TenantsModule {}

