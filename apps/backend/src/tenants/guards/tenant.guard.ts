import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantMembershipEntity } from '../entities/tenant-membership.entity';
import { MembershipStatus } from '@pos/shared-types';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  tenantId?: string;
  role?: string;
}

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
    const membership = await membershipRepo.findOne({
      where: {
        tenantId,
        userId: user.userId,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied: user does not have an active membership in this tenant');
    }

    request.tenantContext = {
      tenantId: membership.tenantId,
      userId: user.userId,
      role: membership.role,
    };

    return true;
  }
}

