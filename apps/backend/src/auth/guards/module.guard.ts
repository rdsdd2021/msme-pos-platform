import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule, BusinessType, DEFAULT_MODULES_BY_BUSINESS } from '@pos/shared-types';
import { TenantEntity } from '../../tenants/entities/tenant.entity';

export const REQUIRED_MODULE_KEY = 'required_module';
export const RequireModule = (module: AppModule) => SetMetadata(REQUIRED_MODULE_KEY, module);

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<AppModule>(REQUIRED_MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.params?.tenantId || request.headers?.['x-tenant-id'];

    if (!tenantId) {
      // If no tenant scope in path/header, cannot verify module access
      return true;
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant not found');
    }

    const businessType = tenant.businessType || BusinessType.GROCERY;
    const settings = (tenant.settings as any) || {};
    const enabledModules: AppModule[] =
      settings.enabledModules ?? (DEFAULT_MODULES_BY_BUSINESS[businessType] || []);

    if (!enabledModules.includes(requiredModule)) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: `Module '${requiredModule}' is not enabled for tenant '${tenant.displayName}'. Upgrade your store subscription plan to activate this vertical.`,
      });
    }

    return true;
  }
}
