import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TenantEntity } from './entities/tenant.entity';
import { TenantMembershipEntity } from './entities/tenant-membership.entity';
import { BranchEntity } from './entities/branch.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import {
  CreateTenantDto,
  CreateBranchDto,
  UpdateBranchDto,
  AddMemberDto,
  UpdateMemberDto,
} from './dto/tenant.dto';
import { MembershipStatus, Role, TenantStatus } from '@pos/shared-types';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(TenantMembershipEntity)
    private readonly membershipRepository: Repository<TenantMembershipEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createTenant(userId: string, dto: CreateTenantDto): Promise<TenantEntity> {
    return this.dataSource.transaction(async (manager) => {
      const tenant = manager.create(TenantEntity, {
        legalName: dto.legalName,
        displayName: dto.displayName,
        businessType: dto.businessType,
        defaultTimezone: dto.defaultTimezone || 'Asia/Kolkata',
        status: TenantStatus.TRIAL,
      });
      const savedTenant = await manager.save(tenant);

      const membership = manager.create(TenantMembershipEntity, {
        tenantId: savedTenant.id,
        userId,
        status: MembershipStatus.ACTIVE,
        role: Role.OWNER,
        roles: [Role.OWNER],
        branchId: null, // Owner has tenant-wide scope
      });
      await manager.save(membership);

      const defaultBranch = manager.create(BranchEntity, {
        tenantId: savedTenant.id,
        code: 'MAIN',
        name: 'Main Branch',
        timezone: savedTenant.defaultTimezone,
        isActive: true,
      });
      await manager.save(defaultBranch);

      const auditLog = manager.create(AuditLogEntity, {
        tenantId: savedTenant.id,
        userId,
        action: 'TENANT_CREATED',
        resourceType: 'tenant',
        resourceId: savedTenant.id,
        details: { legalName: savedTenant.legalName, businessType: savedTenant.businessType },
      });
      await manager.save(auditLog);

      return savedTenant;
    });
  }

  async getTenantsForUser(userId: string): Promise<TenantEntity[]> {
    const memberships = await this.membershipRepository.find({
      where: { userId, status: MembershipStatus.ACTIVE },
      relations: ['tenant'],
    });
    return memberships.map((m) => m.tenant).filter(Boolean);
  }

  async getTenantById(tenantId: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: ['branches'],
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async getBranches(tenantId: string): Promise<BranchEntity[]> {
    return this.branchRepository.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });
  }

  async createBranch(
    tenantId: string,
    userId: string,
    dto: CreateBranchDto,
  ): Promise<BranchEntity> {
    const existing = await this.branchRepository.findOne({
      where: { tenantId, code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Branch code ${dto.code} already exists for this tenant`);
    }

    if (dto.gstin && dto.stateCode && /^[0-9]{2}$/.test(dto.stateCode)) {
      const gstinPrefix = dto.gstin.substring(0, 2);
      if (gstinPrefix !== dto.stateCode) {
        throw new BadRequestException(
          `State code prefix of GSTIN (${gstinPrefix}) must match the branch state code (${dto.stateCode})`,
        );
      }
    }

    const branch = this.branchRepository.create({
      tenantId,
      code: dto.code.toUpperCase(),
      name: dto.name,
      addressLine1: dto.addressLine1 ?? null,
      city: dto.city ?? null,
      stateCode: dto.stateCode ?? null,
      postalCode: dto.postalCode ?? null,
      gstin: dto.gstin ? dto.gstin.toUpperCase() : null,
    });
    const savedBranch = await this.branchRepository.save(branch);

    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        tenantId,
        userId,
        action: 'BRANCH_CREATED',
        resourceType: 'branch',
        resourceId: savedBranch.id,
        details: { code: savedBranch.code, name: savedBranch.name, gstin: savedBranch.gstin },
      }),
    );

    return savedBranch;
  }

  async updateBranch(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: UpdateBranchDto,
  ): Promise<BranchEntity> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId, tenantId },
    });
    if (!branch) {
      throw new NotFoundException(`Branch ${branchId} not found`);
    }

    const effectiveGstin = dto.gstin !== undefined ? dto.gstin?.toUpperCase() : branch.gstin;
    const effectiveStateCode = dto.stateCode !== undefined ? dto.stateCode : branch.stateCode;
    if (effectiveGstin && effectiveStateCode && /^[0-9]{2}$/.test(effectiveStateCode)) {
      const gstinPrefix = effectiveGstin.substring(0, 2);
      if (gstinPrefix !== effectiveStateCode) {
        throw new BadRequestException(
          `State code prefix of GSTIN (${gstinPrefix}) must match the branch state code (${effectiveStateCode})`,
        );
      }
    }

    if (dto.name !== undefined) branch.name = dto.name;
    if (dto.gstin !== undefined) branch.gstin = dto.gstin ? dto.gstin.toUpperCase() : null;
    if (dto.stateCode !== undefined) branch.stateCode = dto.stateCode ?? null;
    if (dto.addressLine1 !== undefined) branch.addressLine1 = dto.addressLine1 ?? null;
    if (dto.addressLine2 !== undefined) branch.addressLine2 = dto.addressLine2 ?? null;
    if (dto.city !== undefined) branch.city = dto.city ?? null;
    if (dto.postalCode !== undefined) branch.postalCode = dto.postalCode ?? null;
    if (dto.isActive !== undefined) branch.isActive = dto.isActive;

    const saved = await this.branchRepository.save(branch);

    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        tenantId,
        userId,
        action: 'BRANCH_UPDATED',
        resourceType: 'branch',
        resourceId: saved.id,
        details: {
          code: saved.code,
          name: saved.name,
          gstin: saved.gstin,
          stateCode: saved.stateCode,
        },
      }),
    );

    return saved;
  }

  async getMembers(tenantId: string): Promise<TenantMembershipEntity[]> {
    return this.membershipRepository.find({
      where: { tenantId },
      relations: ['user', 'branch'],
      order: { joinedAt: 'ASC' },
    });
  }

  async addMember(
    tenantId: string,
    actorUserId: string,
    dto: AddMemberDto,
  ): Promise<TenantMembershipEntity> {
    // Validate branch if provided
    if (dto.branchId) {
      const branch = await this.branchRepository.findOne({
        where: { id: dto.branchId, tenantId },
      });
      if (!branch) {
        throw new NotFoundException(`Branch '${dto.branchId}' not found in this tenant`);
      }
    }

    // Check for existing membership for this user at this scope
    const existing = await this.membershipRepository.findOne({
      where: {
        tenantId,
        userId: dto.userId,
        branchId: dto.branchId ?? undefined,
      },
    });

    if (existing) {
      throw new ConflictException('Membership already exists for this user and branch scope');
    }

    const membership = this.membershipRepository.create({
      tenantId,
      userId: dto.userId,
      branchId: dto.branchId ?? null,
      role: dto.roles[0],
      roles: dto.roles,
      status: MembershipStatus.ACTIVE,
    });

    const saved = await this.membershipRepository.save(membership);

    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        tenantId,
        userId: actorUserId,
        action: 'MEMBER_ADDED',
        resourceType: 'tenant_membership',
        resourceId: saved.id,
        details: { targetUserId: dto.userId, roles: dto.roles, branchId: dto.branchId ?? null },
      }),
    );

    return saved;
  }

  async updateMember(
    tenantId: string,
    actorUserId: string,
    memberId: string,
    dto: UpdateMemberDto,
  ): Promise<TenantMembershipEntity> {
    const membership = await this.membershipRepository.findOne({
      where: { id: memberId, tenantId },
    });

    if (!membership) {
      throw new NotFoundException(`Membership '${memberId}' not found`);
    }

    const previousState = {
      role: membership.role,
      roles: membership.roles,
      branchId: membership.branchId,
      status: membership.status,
    };

    if (dto.branchId !== undefined) {
      if (dto.branchId !== null) {
        const branch = await this.branchRepository.findOne({
          where: { id: dto.branchId, tenantId },
        });
        if (!branch) {
          throw new NotFoundException(`Branch '${dto.branchId}' not found`);
        }
      }
      membership.branchId = dto.branchId;
    }

    if (dto.roles && dto.roles.length > 0) {
      membership.roles = dto.roles;
      membership.role = dto.roles[0];
    }

    if (dto.status) {
      membership.status = dto.status;
    }

    const updated = await this.membershipRepository.save(membership);

    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        tenantId,
        userId: actorUserId,
        action: 'MEMBER_UPDATED',
        resourceType: 'tenant_membership',
        resourceId: updated.id,
        details: {
          previousState,
          newState: { roles: updated.roles, branchId: updated.branchId, status: updated.status },
        },
      }),
    );

    return updated;
  }

  async revokeMember(tenantId: string, actorUserId: string, memberId: string): Promise<void> {
    const membership = await this.membershipRepository.findOne({
      where: { id: memberId, tenantId },
    });

    if (!membership) {
      throw new NotFoundException(`Membership '${memberId}' not found`);
    }

    if (
      membership.role === Role.OWNER ||
      (membership.roles && membership.roles.includes(Role.OWNER))
    ) {
      // Prevent deleting the last owner
      const ownerCount = await this.membershipRepository.count({
        where: { tenantId, role: Role.OWNER, status: MembershipStatus.ACTIVE },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot revoke the sole active Owner of the tenant');
      }
    }

    membership.status = MembershipStatus.SUSPENDED;
    await this.membershipRepository.save(membership);

    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        tenantId,
        userId: actorUserId,
        action: 'MEMBER_REVOKED',
        resourceType: 'tenant_membership',
        resourceId: memberId,
        details: { targetUserId: membership.userId },
      }),
    );
  }
}
