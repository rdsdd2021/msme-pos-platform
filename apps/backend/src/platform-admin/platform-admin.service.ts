import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { UserEntity } from '../tenants/entities/user.entity';
import { TenantMembershipEntity } from '../tenants/entities/tenant-membership.entity';
import { DeviceEntity } from '../commercial/entities/device.entity';
import { TenantSubscriptionEntity } from '../commercial/entities/tenant-subscription.entity';
import { InvoiceEntity } from '../billing/entities/invoice.entity';
import { AuditLogEntity } from '../tenants/entities/audit-log.entity';
import {
  CreatePlatformTenantDto,
  UpdateTenantStatusDto,
  UpdatePlatformSubscriptionDto,
  RevokePlatformDeviceDto,
} from './dto/platform-admin.dto';
import {
  Role,
  TenantStatus,
  UserStatus,
  DeviceStatus,
  SubscriptionPlanCode,
  SubscriptionStatus,
} from '@pos/shared-types';

const SALT_ROUNDS = 12;

@Injectable()
export class PlatformAdminService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(TenantMembershipEntity)
    private readonly membershipRepository: Repository<TenantMembershipEntity>,
    @InjectRepository(DeviceEntity)
    private readonly deviceRepository: Repository<DeviceEntity>,
    @InjectRepository(TenantSubscriptionEntity)
    private readonly subscriptionRepository: Repository<TenantSubscriptionEntity>,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditRepository: Repository<AuditLogEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getMetrics() {
    const [totalTenants, activeTenants, totalBranches, totalDevices, activeDevices, totalInvoices] =
      await Promise.all([
        this.tenantRepository.count(),
        this.tenantRepository.count({ where: { status: TenantStatus.ACTIVE } }),
        this.branchRepository.count(),
        this.deviceRepository.count(),
        this.deviceRepository.count({ where: { status: DeviceStatus.ACTIVE } }),
        this.invoiceRepository.count(),
      ]);

    // Aggregate total gross sales across the platform
    const sumResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(CAST(invoice.grand_total AS NUMERIC))', 'totalSales')
      .getRawOne();

    const totalSalesAmount = sumResult?.totalSales
      ? parseFloat(sumResult.totalSales).toFixed(2)
      : '0.00';

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
        suspended: totalTenants - activeTenants,
      },
      branches: {
        total: totalBranches,
      },
      devices: {
        total: totalDevices,
        active: activeDevices,
        revoked: totalDevices - activeDevices,
      },
      transactions: {
        totalInvoices,
        totalSalesVolume: totalSalesAmount,
      },
      platformVersion: '1.2.0-superadmin',
      systemStatus: 'healthy',
    };
  }

  async getTenants() {
    const tenants = await this.tenantRepository.find({
      order: { createdAt: 'DESC' },
    });

    const tenantDetails = await Promise.all(
      tenants.map(async (t) => {
        const [branchCount, userCount, deviceCount, subscription] = await Promise.all([
          this.branchRepository.count({ where: { tenantId: t.id } }),
          this.membershipRepository.count({ where: { tenantId: t.id } }),
          this.deviceRepository.count({ where: { tenantId: t.id } }),
          this.subscriptionRepository.findOne({ where: { tenantId: t.id } }),
        ]);

        return {
          id: t.id,
          legalName: t.legalName,
          displayName: t.displayName,
          businessType: t.businessType,
          status: t.status,
          currency: t.defaultCurrency,
          timezone: t.defaultTimezone,
          createdAt: t.createdAt,
          branchCount,
          userCount,
          deviceCount,
          subscription: subscription
            ? {
                planCode: subscription.planCode,
                status: subscription.status,
                maxBranches: subscription.maxBranches,
                maxDevices: subscription.maxDevices,
                maxUsers: subscription.maxUsers,
                currentPeriodEnd: subscription.currentPeriodEnd,
              }
            : null,
        };
      }),
    );

    return tenantDetails;
  }

  async createTenant(dto: CreatePlatformTenantDto, adminUserId: string, adminIp?: string) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.ownerEmail.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException(`User with email ${dto.ownerEmail} already exists`);
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Create Tenant
      const tenant = manager.create(TenantEntity, {
        legalName: dto.legalName,
        displayName: dto.displayName,
        businessType: dto.businessType,
        status: TenantStatus.ACTIVE,
      });
      const savedTenant = await manager.save(tenant);

      // 2. Create Default Branch
      const branch = manager.create(BranchEntity, {
        tenantId: savedTenant.id,
        code: 'MAIN-01',
        name: 'Main Store',
        isActive: true,
      });
      const savedBranch = await manager.save(branch);

      // 3. Create Store Owner User
      const passwordHash = await bcrypt.hash(dto.ownerPassword, SALT_ROUNDS);
      const user = manager.create(UserEntity, {
        email: dto.ownerEmail.toLowerCase(),
        passwordHash,
        fullName: dto.ownerName,
        status: UserStatus.ACTIVE,
      });
      const savedUser = await manager.save(user);

      // 4. Create Membership as OWNER
      const membership = manager.create(TenantMembershipEntity, {
        tenantId: savedTenant.id,
        userId: savedUser.id,
        role: Role.OWNER,
        roles: [Role.OWNER],
        branchId: savedBranch.id,
      });
      await manager.save(membership);

      // 5. Create Subscription
      const planCode = dto.planCode || SubscriptionPlanCode.BASIC_KIRANA;
      const sub = manager.create(TenantSubscriptionEntity, {
        tenantId: savedTenant.id,
        planCode,
        status: SubscriptionStatus.ACTIVE,
        maxBranches:
          planCode === SubscriptionPlanCode.ENTERPRISE
            ? 999
            : planCode === SubscriptionPlanCode.PRO_RETAIL
              ? 5
              : 1,
        maxDevices:
          planCode === SubscriptionPlanCode.ENTERPRISE
            ? 999
            : planCode === SubscriptionPlanCode.PRO_RETAIL
              ? 10
              : 2,
        maxUsers:
          planCode === SubscriptionPlanCode.ENTERPRISE
            ? 999
            : planCode === SubscriptionPlanCode.PRO_RETAIL
              ? 20
              : 5,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await manager.save(sub);

      // 6. Audit Trail
      const audit = manager.create(AuditLogEntity, {
        tenantId: savedTenant.id,
        userId: adminUserId,
        action: 'platform:tenant:created',
        resourceType: 'tenant',
        resourceId: savedTenant.id,
        details: {
          legalName: dto.legalName,
          ownerEmail: dto.ownerEmail,
          planCode,
        },
        ipAddress: adminIp || null,
      });
      await manager.save(audit);

      return {
        tenant: savedTenant,
        branch: savedBranch,
        owner: { id: savedUser.id, email: savedUser.email, fullName: savedUser.fullName },
        subscription: sub,
      };
    });
  }

  async updateTenantStatus(
    tenantId: string,
    dto: UpdateTenantStatusDto,
    adminUserId: string,
    adminIp?: string,
  ) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const previousStatus = tenant.status;
    tenant.status = dto.status;
    await this.tenantRepository.save(tenant);

    const audit = this.auditRepository.create({
      tenantId: tenant.id,
      userId: adminUserId,
      action: 'platform:tenant:status_changed',
      resourceType: 'tenant',
      resourceId: tenant.id,
      details: { previousStatus, newStatus: dto.status },
      ipAddress: adminIp || null,
    });
    await this.auditRepository.save(audit);

    return tenant;
  }

  getPlans() {
    return [
      {
        planCode: SubscriptionPlanCode.BASIC_KIRANA,
        name: 'Kirana Starter',
        priceMonthly: 499,
        priceYearly: 4990,
        currency: 'INR',
        maxBranches: 1,
        maxDevices: 2,
        maxUsers: 5,
        features: [
          'High-speed touch & barcode POS billing',
          'Inventory & stock ledger management',
          'Customer Khata & credit ledgers',
          'Thermal printer integration (Bluetooth/USB)',
          'Daily sales & cash reconciliation',
        ],
      },
      {
        planCode: SubscriptionPlanCode.PRO_RETAIL,
        name: 'Retail Growth',
        priceMonthly: 1499,
        priceYearly: 14990,
        currency: 'INR',
        maxBranches: 5,
        maxDevices: 10,
        maxUsers: 20,
        features: [
          'Everything in Kirana Starter',
          'Multi-branch inventory & stock transfers',
          'Supplier purchase orders & GRN receiving',
          'GSTR-1 & GSTR-3B tax return reports',
          'Multiple cashier shifts & variance audits',
        ],
      },
      {
        planCode: SubscriptionPlanCode.ENTERPRISE,
        name: 'Supermart Enterprise',
        priceMonthly: 4999,
        priceYearly: 49990,
        currency: 'INR',
        maxBranches: 999,
        maxDevices: 999,
        maxUsers: 999,
        features: [
          'Everything in Retail Growth',
          'Unlimited branches & devices',
          'Executive revenue & profit margin analytics',
          'Dedicated account manager & 24/7 SLA',
          'Custom hardware bridge & ERP data exports',
        ],
      },
    ];
  }

  async updateSubscription(
    dto: UpdatePlatformSubscriptionDto,
    adminUserId: string,
    adminIp?: string,
  ) {
    const tenant = await this.tenantRepository.findOne({ where: { id: dto.tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${dto.tenantId} not found`);
    }

    let sub = await this.subscriptionRepository.findOne({ where: { tenantId: dto.tenantId } });
    if (!sub) {
      sub = this.subscriptionRepository.create({
        tenantId: dto.tenantId,
        planCode: dto.planCode,
        status: dto.status,
        maxBranches: dto.maxBranches,
        maxDevices: dto.maxDevices,
        maxUsers: dto.maxUsers,
      });
    } else {
      sub.planCode = dto.planCode;
      sub.status = dto.status;
      sub.maxBranches = dto.maxBranches;
      sub.maxDevices = dto.maxDevices;
      sub.maxUsers = dto.maxUsers;
    }

    const savedSub = await this.subscriptionRepository.save(sub);

    const audit = this.auditRepository.create({
      tenantId: tenant.id,
      userId: adminUserId,
      action: 'platform:subscription:updated',
      resourceType: 'tenant_subscription',
      resourceId: savedSub.id,
      details: {
        planCode: dto.planCode,
        status: dto.status,
        maxBranches: dto.maxBranches,
        maxDevices: dto.maxDevices,
      },
      ipAddress: adminIp || null,
    });
    await this.auditRepository.save(audit);

    return savedSub;
  }

  async getDevices() {
    const devices = await this.deviceRepository.find({
      order: { createdAt: 'DESC' },
    });

    const enriched = await Promise.all(
      devices.map(async (d) => {
        const [tenant, branch] = await Promise.all([
          this.tenantRepository.findOne({ where: { id: d.tenantId } }),
          this.branchRepository.findOne({ where: { id: d.branchId } }),
        ]);

        return {
          id: d.id,
          deviceIdentifier: d.deviceIdentifier,
          deviceName: d.deviceName,
          platform: d.platform,
          appVersion: d.appVersion,
          status: d.status,
          lastSeenAt: d.lastSeenAt,
          revokedAt: d.revokedAt,
          revocationReason: d.revocationReason,
          createdAt: d.createdAt,
          tenantName: tenant?.displayName || 'Unknown Store',
          tenantId: d.tenantId,
          branchName: branch?.name || 'Unknown Branch',
          branchCode: branch?.code || 'MAIN',
        };
      }),
    );

    return enriched;
  }

  async revokeDevice(
    deviceId: string,
    dto: RevokePlatformDeviceDto,
    adminUserId: string,
    adminIp?: string,
  ) {
    const device = await this.deviceRepository.findOne({ where: { id: deviceId } });
    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    device.status = DeviceStatus.REVOKED;
    device.revokedAt = new Date();
    device.revocationReason = dto.reason;
    await this.deviceRepository.save(device);

    const audit = this.auditRepository.create({
      tenantId: device.tenantId,
      userId: adminUserId,
      action: 'platform:device:revoked',
      resourceType: 'device',
      resourceId: device.id,
      details: { deviceName: device.deviceName, reason: dto.reason },
      ipAddress: adminIp || null,
    });
    await this.auditRepository.save(audit);

    return device;
  }

  async getAuditLogs(limit = 50, offset = 0) {
    const [logs, total] = await this.auditRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
      skip: offset,
    });

    return {
      total,
      limit,
      offset,
      data: logs,
    };
  }
}
