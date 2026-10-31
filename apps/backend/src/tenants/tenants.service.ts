import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TenantEntity } from './entities/tenant.entity';
import { TenantMembershipEntity } from './entities/tenant-membership.entity';
import { BranchEntity } from './entities/branch.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { CreateTenantDto, CreateBranchDto } from './dto/tenant.dto';
import { MembershipStatus, TenantStatus } from '@pos/shared-types';

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
        role: 'owner',
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

    const branch = this.branchRepository.create({
      tenantId,
      code: dto.code.toUpperCase(),
      name: dto.name,
      addressLine1: dto.addressLine1 ?? null,
      city: dto.city ?? null,
      stateCode: dto.stateCode ?? null,
      postalCode: dto.postalCode ?? null,
    });
    const savedBranch = await this.branchRepository.save(branch);

    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        tenantId,
        userId,
        action: 'BRANCH_CREATED',
        resourceType: 'branch',
        resourceId: savedBranch.id,
        details: { code: savedBranch.code, name: savedBranch.name },
      }),
    );

    return savedBranch;
  }
}

