import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceEntity } from './entities/device.entity';
import { TenantSubscriptionEntity } from './entities/tenant-subscription.entity';
import { RegisterDeviceDto, RevokeDeviceDto } from './dto/commercial.dto';
import { DeviceStatus, SubscriptionPlanCode, SubscriptionStatus } from '@pos/shared-types';

@Injectable()
export class CommercialService {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(TenantSubscriptionEntity)
    private readonly subscriptionRepo: Repository<TenantSubscriptionEntity>,
  ) {}

  /**
   * Registers an Android / Web POS hardware terminal and checks subscription device limits.
   */
  async registerDevice(tenantId: string, dto: RegisterDeviceDto): Promise<DeviceEntity> {
    const existing = await this.deviceRepo.findOne({
      where: { tenantId, deviceIdentifier: dto.deviceIdentifier },
    });
    if (existing) {
      if (existing.status === DeviceStatus.REVOKED) {
        throw new ForbiddenException('This device has been permanently revoked');
      }
      return existing;
    }

    // Check device entitlement limit
    const subscription = await this.getOrCreateSubscription(tenantId);
    const activeDeviceCount = await this.deviceRepo.count({
      where: { tenantId, status: DeviceStatus.ACTIVE },
    });

    if (activeDeviceCount >= subscription.maxDevices) {
      throw new ForbiddenException(
        `Subscription device limit reached (${subscription.maxDevices} devices max). Please upgrade your plan.`,
      );
    }

    const device = this.deviceRepo.create({
      tenantId,
      branchId: dto.branchId,
      deviceIdentifier: dto.deviceIdentifier,
      deviceName: dto.deviceName,
      platform: dto.platform,
      appVersion: dto.appVersion ?? null,
      status: DeviceStatus.ACTIVE,
      lastSeenAt: new Date(),
    });

    return this.deviceRepo.save(device);
  }

  async revokeDevice(tenantId: string, deviceId: string, dto: RevokeDeviceDto): Promise<DeviceEntity> {
    const device = await this.deviceRepo.findOne({
      where: { id: deviceId, tenantId },
    });
    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    device.status = DeviceStatus.REVOKED;
    device.revokedAt = new Date();
    device.revocationReason = dto.reason;

    return this.deviceRepo.save(device);
  }

  async getDevices(tenantId: string): Promise<DeviceEntity[]> {
    return this.deviceRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async getOrCreateSubscription(tenantId: string): Promise<TenantSubscriptionEntity> {
    let sub = await this.subscriptionRepo.findOne({ where: { tenantId } });
    if (!sub) {
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 30); // 30-day trial

      sub = this.subscriptionRepo.create({
        tenantId,
        planCode: SubscriptionPlanCode.BASIC_KIRANA,
        status: SubscriptionStatus.TRIAL,
        maxBranches: 1,
        maxDevices: 2,
        maxUsers: 5,
        trialEndsAt: trialEnds,
      });
      sub = await this.subscriptionRepo.save(sub);
    }
    return sub;
  }
}

