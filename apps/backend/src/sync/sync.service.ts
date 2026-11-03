import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { SyncIngestedOperationEntity } from './entities/sync-ingested-operation.entity';
import { DeviceInvoiceRangeEntity } from './entities/device-invoice-range.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { CategoryEntity } from '../catalog/entities/category.entity';
import { DeviceEntity } from '../commercial/entities/device.entity';
import { CustomerEntity } from '../operations/entities/customer.entity';
import { BillingService } from '../billing/billing.service';
import { CreateSaleDto } from '../billing/dto/billing.dto';
import { PushSyncBatchDto, AllocateInvoiceRangeDto } from './dto/sync.dto';
import {
  SyncPushResponse,
  SyncOperationAck,
  SyncPullDeltaResponse,
  DeviceStatus,
} from '@pos/shared-types';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(SyncIngestedOperationEntity)
    private readonly ingestedRepo: Repository<SyncIngestedOperationEntity>,
    @InjectRepository(DeviceInvoiceRangeEntity)
    private readonly rangeRepo: Repository<DeviceInvoiceRangeEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(DeviceEntity)
    private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    private readonly billingService: BillingService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Ingests a push batch from an offline device.
   * Every operation is guaranteed idempotent via unique (tenantId, deviceId, operationId).
   */
  async ingestBatch(
    tenantId: string,
    userId: string,
    dto: PushSyncBatchDto,
  ): Promise<SyncPushResponse> {
    const results: SyncOperationAck[] = [];

    for (const op of dto.operations) {
      // 0. Validate Device Status and Tenancy
      const device = await this.deviceRepo.findOne({
        where: { id: op.deviceId, tenantId },
      });

      if (!device) {
        results.push({
          operationId: op.operationId,
          status: 'rejected',
          errorCode: 'DEVICE_NOT_FOUND',
          errorMessage: `Device ${op.deviceId} is not registered for this tenant`,
        });
        continue;
      }

      if (device.status === DeviceStatus.REVOKED) {
        results.push({
          operationId: op.operationId,
          status: 'rejected',
          errorCode: 'DEVICE_REVOKED',
          errorMessage: `Device ${op.deviceId} has been revoked and cannot sync`,
        });
        continue;
      }

      // Update device last seen timestamp
      await this.deviceRepo.update(device.id, { lastSeenAt: new Date() });

      // 1. Check if already ingested (Idempotency)
      const existing = await this.ingestedRepo.findOne({
        where: { tenantId, deviceId: op.deviceId, operationId: op.operationId },
      });

      if (existing) {
        results.push({
          operationId: op.operationId,
          status: 'already_processed',
          serverEntityId: existing.serverEntityId ?? undefined,
        });
        continue;
      }

      // 2. Process business operation
      try {
        let serverEntityId: string | undefined;

        if (op.operationType === 'CREATE_SALE') {
          const saleDto = op.payload as unknown as CreateSaleDto;
          const invoice = await this.billingService.createSale(tenantId, userId, saleDto);
          serverEntityId = invoice.id;
        }

        // 3. Record ingestion status
        const ingested = this.ingestedRepo.create({
          tenantId,
          deviceId: op.deviceId,
          operationId: op.operationId,
          operationType: op.operationType,
          sequence: op.sequence,
          schemaVersion: op.schemaVersion,
          status: 'accepted',
          serverEntityId: serverEntityId ?? null,
        });
        await this.ingestedRepo.save(ingested);

        results.push({
          operationId: op.operationId,
          status: 'accepted',
          serverEntityId,
        });
      } catch (err: any) {
        this.logger.error(`Error ingesting sync operation ${op.operationId}: ${err.message}`);
        const failedRecord = this.ingestedRepo.create({
          tenantId,
          deviceId: op.deviceId,
          operationId: op.operationId,
          operationType: op.operationType,
          sequence: op.sequence,
          schemaVersion: op.schemaVersion,
          status: 'rejected',
          errorCode: err.name || 'PROCESSING_ERROR',
          errorMessage: err.message,
        });
        await this.ingestedRepo.save(failedRecord);

        results.push({
          operationId: op.operationId,
          status: 'rejected',
          errorCode: err.name || 'PROCESSING_ERROR',
          errorMessage: err.message,
        });
      }
    }

    return {
      results,
      processedCount: results.length,
    };
  }

  /**
   * Pulls catalog deltas created or updated after the given ISO timestamp cursor.
   */
  async pullDeltas(
    tenantId: string,
    cursor?: string,
  ): Promise<SyncPullDeltaResponse> {
    const cursorDate = cursor ? new Date(cursor) : new Date(0);

    const [categories, products, customers] = await Promise.all([
      this.categoryRepo.find({
        where: { tenantId, updatedAt: MoreThan(cursorDate) },
        order: { updatedAt: 'ASC' },
      }),
      this.productRepo.find({
        where: { tenantId, updatedAt: MoreThan(cursorDate) },
        order: { updatedAt: 'ASC' },
      }),
      this.customerRepo.find({
        where: { tenantId, updatedAt: MoreThan(cursorDate) },
        order: { updatedAt: 'ASC' },
      }),
    ]);

    const newCursor = new Date().toISOString();

    return {
      cursor: newCursor,
      hasMore: false,
      categories: categories as any,
      products: products as any,
      customers: customers as any,
    };
  }

  /**
   * Reserves a sequential range of invoice numbers for a device so it can allocate
   * legally valid invoice numbers offline without collisions.
   */
  async allocateInvoiceRange(
    tenantId: string,
    dto: AllocateInvoiceRangeDto,
  ): Promise<DeviceInvoiceRangeEntity> {
    return this.dataSource.transaction(async (manager) => {
      // Find the highest allocated number in this branch
      const lastRange = await manager.findOne(DeviceInvoiceRangeEntity, {
        where: { tenantId, branchId: dto.branchId },
        order: { endNumber: 'DESC' },
      });

      const start = lastRange ? lastRange.endNumber + 1 : 1001;
      const end = start + dto.rangeSize - 1;

      const newRange = manager.create(DeviceInvoiceRangeEntity, {
        tenantId,
        branchId: dto.branchId,
        deviceId: dto.deviceId,
        seriesPrefix: 'INV',
        startNumber: start,
        endNumber: end,
        nextNumber: start,
        isExhausted: false,
      });

      return manager.save(newRange);
    });
  }
}

