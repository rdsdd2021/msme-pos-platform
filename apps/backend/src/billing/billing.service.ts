import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceLineEntity } from './entities/invoice-line.entity';
import { PaymentEntity } from './entities/payment.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { StockLedgerEntity } from '../catalog/entities/stock-ledger.entity';
import { StockBalanceEntity } from '../catalog/entities/stock-balance.entity';
import { CreateSaleDto } from './dto/billing.dto';
import { InvoiceStatus, PaymentStatus, StockMovementType } from '@pos/shared-types';

export interface CalculatedLine {
  productId: string;
  name: string;
  sku: string;
  hsn: string | null;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  taxableValue: string;
  gstRatePercent: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  lineTotal: string;
}

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(InvoiceLineEntity)
    private readonly invoiceLineRepo: Repository<InvoiceLineEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Recalculates invoice totals on the server. Never trust client-supplied totals,
   * taxes, or prices. Performs atomic invoice, payment, and stock deduction.
   */
  async createSale(
    tenantId: string,
    cashierUserId: string,
    dto: CreateSaleDto,
  ): Promise<InvoiceEntity> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Idempotency Check
      const existing = await manager.findOne(InvoiceEntity, {
        where: { tenantId, idempotencyKey: dto.idempotencyKey },
        relations: ['lines'],
      });
      if (existing) {
        return existing;
      }

      // 2. Fetch and snapshot product details
      const productIds = dto.items.map((i) => i.productId);
      const products = await manager.findByIds(ProductEntity, productIds);
      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotalCents = 0;
      let discountTotalCents = 0;
      let taxableTotalCents = 0;
      let cgstTotalCents = 0;
      let sgstTotalCents = 0;
      let igstTotalCents = 0;

      const calculatedLines: CalculatedLine[] = [];

      for (const item of dto.items) {
        const product = productMap.get(item.productId);
        if (!product || product.tenantId !== tenantId) {
          throw new NotFoundException(`Product ${item.productId} not found in this tenant`);
        }

        const qty = parseFloat(item.quantity);
        if (qty <= 0) {
          throw new BadRequestException(`Quantity must be greater than zero for product ${product.name}`);
        }

        // Server authoritative unit price
        const unitPriceNum = parseFloat(product.sellingPrice);
        const itemGrossCents = Math.round(unitPriceNum * qty * 100);
        const discountCents = Math.round(parseFloat(item.discountAmount ?? '0') * 100);

        if (discountCents > itemGrossCents) {
          throw new BadRequestException(`Discount cannot exceed gross total for product ${product.name}`);
        }

        const taxableCents = itemGrossCents - discountCents;
        const gstRate = parseFloat(item.gstRatePercent);

        let lineCgstCents = 0;
        let lineSgstCents = 0;
        let lineIgstCents = 0;

        if (dto.isInterstate) {
          lineIgstCents = Math.round((taxableCents * gstRate) / 100);
        } else {
          // Half to CGST, half to SGST
          lineCgstCents = Math.round((taxableCents * (gstRate / 2)) / 100);
          lineSgstCents = Math.round((taxableCents * (gstRate / 2)) / 100);
        }

        const lineTotalCents = taxableCents + lineCgstCents + lineSgstCents + lineIgstCents;

        subtotalCents += itemGrossCents;
        discountTotalCents += discountCents;
        taxableTotalCents += taxableCents;
        cgstTotalCents += lineCgstCents;
        sgstTotalCents += lineSgstCents;
        igstTotalCents += lineIgstCents;

        calculatedLines.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          hsn: product.hsnCode,
          quantity: item.quantity,
          unitPrice: product.sellingPrice,
          discountAmount: (discountCents / 100).toFixed(2),
          taxableValue: (taxableCents / 100).toFixed(2),
          gstRatePercent: item.gstRatePercent,
          cgstAmount: (lineCgstCents / 100).toFixed(2),
          sgstAmount: (lineSgstCents / 100).toFixed(2),
          igstAmount: (lineIgstCents / 100).toFixed(2),
          lineTotal: (lineTotalCents / 100).toFixed(2),
        });
      }

      const totalBeforeRounding = taxableTotalCents + cgstTotalCents + sgstTotalCents + igstTotalCents;
      const roundedGrandTotalCents = Math.round(totalBeforeRounding / 100) * 100; // Nearest rupee
      const roundingDiffCents = roundedGrandTotalCents - totalBeforeRounding;

      // 3. Verify Payment Allocation
      let paidTotalCents = 0;
      for (const p of dto.payments) {
        paidTotalCents += Math.round(parseFloat(p.amount) * 100);
      }

      if (paidTotalCents < roundedGrandTotalCents) {
        throw new BadRequestException(
          `Total payment ₹${(paidTotalCents / 100).toFixed(2)} is less than grand total ₹${(roundedGrandTotalCents / 100).toFixed(2)}`,
        );
      }

      // 4. Generate sequential invoice number (e.g. INV-YYYYMMDD-UUID)
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-${datePrefix}-${uniqueSuffix}`;

      // 5. Persist Invoice
      const invoice = manager.create(InvoiceEntity, {
        tenantId,
        branchId: dto.branchId,
        invoiceNumber,
        idempotencyKey: dto.idempotencyKey,
        status: InvoiceStatus.POSTED,
        customerId: dto.customerId ?? null,
        cashierUserId,
        currency: 'INR',
        subtotal: (subtotalCents / 100).toFixed(2),
        discountTotal: (discountTotalCents / 100).toFixed(2),
        taxableTotal: (taxableTotalCents / 100).toFixed(2),
        cgstTotal: (cgstTotalCents / 100).toFixed(2),
        sgstTotal: (sgstTotalCents / 100).toFixed(2),
        igstTotal: (igstTotalCents / 100).toFixed(2),
        grandTotal: (roundedGrandTotalCents / 100).toFixed(2),
        roundingAdjustment: (roundingDiffCents / 100).toFixed(2),
        paymentStatus: PaymentStatus.PAID,
        isInterstate: dto.isInterstate ?? false,
      });

      const savedInvoice = await manager.save(invoice);

      // 6. Persist Invoice Lines
      for (const line of calculatedLines) {
        const invoiceLine = manager.create(InvoiceLineEntity, {
          tenantId,
          invoiceId: savedInvoice.id,
          productId: line.productId,
          productNameSnapshot: line.name,
          skuSnapshot: line.sku,
          hsnSnapshot: line.hsn,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountAmount: line.discountAmount,
          taxableValue: line.taxableValue,
          gstRatePercent: line.gstRatePercent,
          cgstAmount: line.cgstAmount,
          sgstAmount: line.sgstAmount,
          igstAmount: line.igstAmount,
          lineTotal: line.lineTotal,
        });
        await manager.save(invoiceLine);
      }

      // 7. Persist Payments
      for (const payment of dto.payments) {
        const pEntity = manager.create(PaymentEntity, {
          tenantId,
          branchId: dto.branchId,
          invoiceId: savedInvoice.id,
          paymentMethod: payment.paymentMethod,
          amount: payment.amount,
          externalReference: payment.externalReference ?? null,
        });
        await manager.save(pEntity);
      }

      // 8. Atomic Stock Deduction via Ledger
      for (const line of calculatedLines) {
        const qtyNum = parseFloat(line.quantity);
        const deductionMovement = manager.create(StockLedgerEntity, {
          tenantId,
          branchId: dto.branchId,
          productId: line.productId,
          movementType: StockMovementType.SALE,
          quantityDelta: (-qtyNum).toFixed(3),
          unitCost: line.unitPrice,
          sourceType: 'invoice',
          sourceId: savedInvoice.id,
          idempotencyKey: `sale-${savedInvoice.id}-${line.productId}`,
          createdBy: cashierUserId,
          reason: `Sale ${savedInvoice.invoiceNumber}`,
        });
        await manager.save(deductionMovement);

        // Update projected stock balance
        let balance = await manager.findOne(StockBalanceEntity, {
          where: { tenantId, branchId: dto.branchId, productId: line.productId },
        });

        if (!balance) {
          balance = manager.create(StockBalanceEntity, {
            tenantId,
            branchId: dto.branchId,
            productId: line.productId,
            quantityOnHand: (-qtyNum).toFixed(3),
            lowStockThreshold: '5.000',
          });
        } else {
          const currentOnHand = parseFloat(balance.quantityOnHand);
          balance.quantityOnHand = (currentOnHand - qtyNum).toFixed(3);
        }
        await manager.save(balance);
      }

      return savedInvoice;
    });
  }

  async getInvoices(tenantId: string, branchId?: string): Promise<InvoiceEntity[]> {
    const where: any = { tenantId };
    if (branchId) {
      where.branchId = branchId;
    }
    return this.invoiceRepo.find({
      where,
      relations: ['lines'],
      order: { postedAt: 'DESC' },
      take: 50,
    });
  }

  async getInvoiceById(tenantId: string, invoiceId: string): Promise<InvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, tenantId },
      relations: ['lines'],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }
    return invoice;
  }
}

