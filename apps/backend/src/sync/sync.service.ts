import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { SyncIngestedOperationEntity } from './entities/sync-ingested-operation.entity';
import { DeviceInvoiceRangeEntity } from './entities/device-invoice-range.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { CategoryEntity } from '../catalog/entities/category.entity';
import { DeviceEntity } from '../commercial/entities/device.entity';
import { CustomerEntity } from '../operations/entities/customer.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { BillingService } from '../billing/billing.service';
import { CreateSaleDto } from '../billing/dto/billing.dto';
import { PushSyncBatchDto, AllocateInvoiceRangeDto } from './dto/sync.dto';
import {
  SyncPushResponse,
  SyncOperationAck,
  SyncPullDeltaResponse,
  DeviceStatus,
  Platform,
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
    @InjectRepository(BranchEntity)
    private readonly branchRepo: Repository<BranchEntity>,
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
      // 0. Validate Device Status and Tenancy (lookup by primary UUID or hardware device identifier)
      let device = await this.deviceRepo.findOne({
        where: [
          { id: op.deviceId, tenantId },
          { deviceIdentifier: op.deviceId, tenantId },
        ],
      });

      if (!device) {
        // Auto-provision mobile terminal for authenticated tenant
        try {
          const payloadBranchId = (op.payload as any)?.branchId;
          let branchId = payloadBranchId;
          const isUuid =
            typeof branchId === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              branchId,
            );
          if (!branchId || !isUuid) {
            const defaultBranch = await this.branchRepo.findOne({ where: { tenantId } });
            branchId = defaultBranch?.id;
          }

          if (branchId) {
            const newDevice = this.deviceRepo.create({
              tenantId,
              branchId,
              deviceIdentifier: op.deviceId,
              deviceName: 'Mobile POS Terminal',
              platform: Platform.ANDROID,
              status: DeviceStatus.ACTIVE,
              lastSeenAt: new Date(),
            });
            device = await this.deviceRepo.save(newDevice);
          }
        } catch (err: any) {
          this.logger.warn(`Device auto-provisioning failed for ${op.deviceId}: ${err.message}`);
        }
      }

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

        if (op.operationType === 'CREATE_PRODUCT') {
          const raw = op.payload as any;
          const sku = String(raw.sku || '')
            .trim()
            .toUpperCase();
          const name = String(raw.name || '').trim();
          if (sku && name) {
            const categoryName = String(raw.category || 'General').trim();
            let category = await this.categoryRepo.findOne({
              where: { tenantId, name: categoryName },
            });
            if (!category) {
              category = await this.categoryRepo.save(
                this.categoryRepo.create({
                  tenantId,
                  name: categoryName,
                }),
              );
            }

            const existingProd = await this.productRepo.findOne({ where: { tenantId, sku } });
            const sellingPrice = raw.sellingPrice ? String(raw.sellingPrice) : '0.00';
            const costPrice = raw.costPrice ? String(raw.costPrice) : '0.00';
            const taxRate =
              raw.taxRate || raw.gstRatePercent
                ? String(raw.taxRate || raw.gstRatePercent)
                : '0.00';
            const barcode = raw.barcode ? String(raw.barcode).trim() : null;
            const hsnCode = raw.hsnCode ? String(raw.hsnCode).trim() : null;
            const imageUrl = raw.imageUrl ? String(raw.imageUrl) : null;

            if (existingProd) {
              existingProd.name = name;
              existingProd.sellingPrice = sellingPrice;
              existingProd.purchaseCost = costPrice;
              existingProd.gstRatePercent = taxRate;
              if (barcode) existingProd.barcodePrimary = barcode;
              if (hsnCode) existingProd.hsnCode = hsnCode;
              if (imageUrl) existingProd.imageUrl = imageUrl;
              existingProd.categoryId = category.id;
              const saved = await this.productRepo.save(existingProd);
              serverEntityId = saved.id;
            } else {
              const newProd = this.productRepo.create({
                tenantId,
                categoryId: category.id,
                name,
                sku,
                barcodePrimary: barcode,
                sellingPrice,
                purchaseCost: costPrice,
                gstRatePercent: taxRate,
                hsnCode,
                imageUrl,
                isActive: true,
              });
              const saved = await this.productRepo.save(newProd);
              serverEntityId = (saved as ProductEntity).id;
            }
          }
        } else if (op.operationType === 'UPDATE_PRODUCT') {
          const raw = op.payload as any;
          const sku = raw.sku ? String(raw.sku).trim().toUpperCase() : undefined;
          const prodId = raw.id ? String(raw.id).trim() : undefined;
          const product = prodId
            ? await this.productRepo.findOne({ where: { tenantId, id: prodId } })
            : sku
              ? await this.productRepo.findOne({ where: { tenantId, sku } })
              : null;

          if (product) {
            if (raw.name) product.name = String(raw.name).trim();
            if (raw.sellingPrice) product.sellingPrice = String(raw.sellingPrice);
            if (raw.costPrice) product.purchaseCost = String(raw.costPrice);
            if (raw.taxRate || raw.gstRatePercent) {
              product.gstRatePercent = String(raw.taxRate || raw.gstRatePercent);
            }
            if (raw.barcode) product.barcodePrimary = String(raw.barcode).trim();
            if (raw.hsnCode) product.hsnCode = String(raw.hsnCode).trim();
            if (raw.imageUrl) product.imageUrl = String(raw.imageUrl);
            const saved = await this.productRepo.save(product);
            serverEntityId = (saved as ProductEntity).id;
          }
        } else if (op.operationType === 'CREATE_SALE') {
          const raw = op.payload as any;

          // Resilient branchId fallback
          let saleBranchId = raw.branchId;
          const isUuid =
            typeof saleBranchId === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              saleBranchId,
            );
          if (!saleBranchId || !isUuid) {
            const defaultBranch = await this.branchRepo.findOne({ where: { tenantId } });
            saleBranchId = defaultBranch?.id;
          }

          // Map lines to items if necessary
          const rawItems = raw.items || raw.lines || [];
          const items = rawItems.map((item: any) => ({
            productId: item.productId,
            quantity: String(item.quantity || '1'),
            discountAmount: item.discountAmount ? String(item.discountAmount) : '0.00',
            gstRatePercent: String(item.gstRatePercent || item.gstRate || '0.00'),
          }));

          // Map payments if necessary
          const rawPayments = raw.payments || [];
          const payments = rawPayments.map((p: any) => ({
            paymentMethod: p.paymentMethod || p.method || 'cash',
            amount: String(p.amount || '0.00'),
            externalReference: p.externalReference,
          }));

          const saleDto: CreateSaleDto = {
            branchId: saleBranchId,
            idempotencyKey: raw.idempotencyKey || raw.invoiceNumber || op.operationId,
            isInterstate: Boolean(raw.isInterstate),
            customerId:
              raw.customerId &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                raw.customerId,
              )
                ? raw.customerId
                : undefined,
            customerGstin: raw.customerGstin,
            placeOfSupply: raw.placeOfSupply,
            items,
            payments,
          };

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
  async pullDeltas(tenantId: string, cursor?: string): Promise<SyncPullDeltaResponse> {
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
