import { SetMetadata } from '@nestjs/common';
import { Permission } from '@pos/shared-types';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to declare required permissions on a route handler or controller class.
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const TENANT_WIDE_KEY = 'tenant_wide_required';

/**
 * Decorator to require that the caller's membership is tenant-wide (not restricted to a specific branch).
 */
export const RequireTenantWide = () => SetMetadata(TENANT_WIDE_KEY, true);

