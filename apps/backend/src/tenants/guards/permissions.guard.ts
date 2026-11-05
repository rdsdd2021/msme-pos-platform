import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, TenantContext } from '@pos/shared-types';
import { PERMISSIONS_KEY, TENANT_WIDE_KEY } from './require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiresTenantWide = this.reflector.getAllAndOverride<boolean>(TENANT_WIDE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permission or scope metadata is set, allow access
    if (!requiredPermissions && !requiresTenantWide) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantContext = request.tenantContext as TenantContext | undefined;

    if (!tenantContext) {
      throw new ForbiddenException(
        'Tenant context not established. Ensure TenantGuard runs before PermissionsGuard',
      );
    }

    // Check tenant-wide requirement
    if (requiresTenantWide && tenantContext.membershipBranchId !== null) {
      throw new ForbiddenException(
        `Tenant-wide scope required: membership is restricted to branch '${tenantContext.membershipBranchId}'`,
      );
    }

    // Owner role automatically bypasses individual permission checks within their tenant
    if (tenantContext.isOwner) {
      return true;
    }

    // Check individual required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = new Set(tenantContext.permissions);
      for (const permission of requiredPermissions) {
        if (!userPermissions.has(permission)) {
          throw new ForbiddenException(`Forbidden: Missing required permission '${permission}'`);
        }
      }
    }

    return true;
  }
}
