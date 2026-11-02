import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantMembershipEntity } from '../entities/tenant-membership.entity';
import { MembershipStatus, Role, TenantContext, getPermissionsForRoles } from '@pos/shared-types';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId?: string; email?: string } | undefined;

    if (!user || !user.userId) {
      throw new ForbiddenException('User is not authenticated');
    }

    const tenantId =
      request.params?.tenantId ||
      request.headers?.['x-tenant-id'] ||
      request.body?.tenantId;

    if (!tenantId) {
      throw new BadRequestException('tenant_id is required in route params or X-Tenant-ID header');
    }

    const membershipRepo = this.dataSource.getRepository(TenantMembershipEntity);
    const memberships = await membershipRepo.find({
      where: {
        tenantId,
        userId: user.userId,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!memberships || memberships.length === 0) {
      throw new ForbiddenException('Access denied: user does not have an active membership in this tenant');
    }

    // Resolve requested branch context if provided in path, header, query or body
    const requestedBranchId: string | null =
      request.params?.branchId ||
      request.headers?.['x-branch-id'] ||
      request.query?.branchId ||
      request.body?.branchId ||
      null;

    // Prioritize tenant-wide membership (branchId is null) or matching branch membership
    let activeMembership = memberships.find((m) => m.branchId === null);
    if (!activeMembership && requestedBranchId) {
      activeMembership = memberships.find((m) => m.branchId === requestedBranchId);
    }
    if (!activeMembership) {
      // Fallback to the first available active membership
      activeMembership = memberships[0];
    }

    // Enforce branch-level boundary isolation for branch-scoped members
    if (activeMembership.branchId && requestedBranchId && activeMembership.branchId !== requestedBranchId) {
      throw new ForbiddenException(
        `Cross-branch access denied: membership is restricted to branch '${activeMembership.branchId}'`,
      );
    }

    // Calculate normalized roles & effective permissions
    const rawRoles = activeMembership.roles && activeMembership.roles.length > 0
      ? activeMembership.roles
      : [activeMembership.role as Role];

    const roles: Role[] = rawRoles.map((r) => r as Role);
    const isOwner = roles.includes(Role.OWNER) || activeMembership.role === Role.OWNER;
    const permissions = getPermissionsForRoles(roles);

    const tenantContext: TenantContext = {
      tenantId: activeMembership.tenantId,
      userId: user.userId,
      branchId: activeMembership.branchId || requestedBranchId || null,
      membershipBranchId: activeMembership.branchId || null,
      role: activeMembership.role,
      roles,
      permissions,
      isOwner,
    };

    request.tenantContext = tenantContext;
    request.tenantMembership = activeMembership;

    return true;
  }
}
