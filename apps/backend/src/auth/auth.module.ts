import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UserEntity } from '../tenants/entities/user.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { TenantMembershipEntity } from '../tenants/entities/tenant-membership.entity';
import { AuditLogEntity } from '../tenants/entities/audit-log.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { StockBalanceEntity } from '../catalog/entities/stock-balance.entity';
import { CategoryEntity } from '../catalog/entities/category.entity';

import { ModuleGuard } from './guards/module.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      TenantEntity,
      BranchEntity,
      TenantMembershipEntity,
      AuditLogEntity,
      ProductEntity,
      StockBalanceEntity,
      CategoryEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ModuleGuard],
  exports: [AuthService, JwtStrategy, PassportModule, ModuleGuard],
})
export class AuthModule {}
