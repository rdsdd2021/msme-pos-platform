import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, FindOptionsWhere } from 'typeorm';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceLineEntity } from './entities/invoice-line.entity';
import { PaymentEntity } from './entities/payment.entity';
import { CreditNoteEntity } from './entities/credit-note.entity';
import { CreditNoteLineEntity } from './entities/credit-note-line.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { StockLedgerEntity } from '../catalog/entities/stock-ledger.entity';
import { StockBalanceEntity } from '../catalog/entities/stock-balance.entity';
import { CustomerEntity } from '../operations/entities/customer.entity';
import { CustomerLedgerEntity } from '../operations/entities/customer-ledger.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { AuditService } from '../tenants/audit.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { CreateSaleDto } from './dto/billing.dto';
import { CreateSalesReturnDto, CreditNoteQueryDto } from './dto/returns.dto';
import {
  InvoiceStatus,
  PaymentStatus,
  StockMovementType,
  PaymentMethod,
  CustomerLedgerEntryType,
} from '@pos/shared-types';

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
    @InjectRepository(CreditNoteEntity)
    private readonly creditNoteRepo: Repository<CreditNoteEntity>,
    @InjectRepository(CreditNoteLineEntity)
    private readonly creditNoteLineRepo: Repository<CreditNoteLineEntity>,
    private readonly dataSource: DataSource,
    @Optional()
    private readonly auditService?: AuditService,
    @Optional()
    private readonly realtimeService?: RealtimeEventsService,
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
    const invoice = await this.dataSource.transaction(async (manager) => {
      // 1. Idempotency Check
      const existing = await manager.findOne(InvoiceEntity, {
        where: { tenantId, idempotencyKey: dto.idempotencyKey },
        relations: ['lines'],
      });
      if (existing) {
        return existing;
      }

      // 2. Fetch tenant settings and snapshot product details
      const tenant = await manager.findOne(TenantEntity, { where: { id: tenantId } });
      const allowNegativeStock = (tenant?.settings as any)?.allowNegativeStock === true;

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

        // Stock Ceiling Validation (Rule 15: No overselling without explicit negative stock permission)
        if (product.trackInventory && !allowNegativeStock) {
          const balance = await manager.findOne(StockBalanceEntity, {
            where: { tenantId, branchId: dto.branchId, productId: product.id },
          });
          const availableStock = balance ? parseFloat(balance.quantityOnHand) : 0;
          if (qty > availableStock) {
            throw new BadRequestException(
              `Insufficient stock for "${product.name}". Available: ${availableStock.toFixed(3)}, Requested: ${qty.toFixed(3)}`,
            );
          }
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

      // 3. Verify Payment Allocation and Credit Khata validation
      let paidTotalCents = 0;
      let creditTotalCents = 0;
      for (const p of dto.payments) {
        const amtCents = Math.round(parseFloat(p.amount) * 100);
        paidTotalCents += amtCents;
        if (p.paymentMethod === PaymentMethod.CREDIT) {
          creditTotalCents += amtCents;
        }
      }

      if (paidTotalCents < roundedGrandTotalCents) {
        throw new BadRequestException(
          `Total payment ₹${(paidTotalCents / 100).toFixed(2)} is less than grand total ₹${(roundedGrandTotalCents / 100).toFixed(2)}`,
        );
      }

      let creditCustomer: CustomerEntity | null = null;
      let newCustomerBalanceCents = 0;
      if (creditTotalCents > 0) {
        if (!dto.customerId) {
          throw new BadRequestException('A registered customer is required for Khata / credit payments');
        }

        creditCustomer = await manager.findOne(CustomerEntity, {
          where: { id: dto.customerId, tenantId },
        });
        if (!creditCustomer) {
          throw new NotFoundException(`Customer ${dto.customerId} not found`);
        }

        const currentBalanceCents = Math.round(parseFloat(creditCustomer.currentBalance) * 100);
        const creditLimitCents = Math.round(parseFloat(creditCustomer.creditLimit) * 100);
        newCustomerBalanceCents = currentBalanceCents + creditTotalCents;

        if (creditLimitCents > 0 && newCustomerBalanceCents > creditLimitCents) {
          throw new BadRequestException(
            `Credit limit exceeded. Current balance ₹${creditCustomer.currentBalance}, Credit limit ₹${creditCustomer.creditLimit}, Sale credit ₹${(creditTotalCents / 100).toFixed(2)}`,
          );
        }
      }

      // 4. Generate sequential invoice number (e.g. INV-YYYYMMDD-UUID)
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-${datePrefix}-${uniqueSuffix}`;

      // Resolve GSTIN and POS snapshots
      let resolvedCustomerGstin = dto.customerGstin?.trim() || null;
      if (!resolvedCustomerGstin && dto.customerId) {
        const cust = creditCustomer ?? await manager.findOne(CustomerEntity, {
          where: { id: dto.customerId, tenantId },
        });
        if (cust?.gstin) {
          resolvedCustomerGstin = cust.gstin.trim();
        }
      }

      const branch = await manager.findOne(BranchEntity, {
        where: { id: dto.branchId, tenantId },
      });
      const branchPos = branch?.stateCode || (branch?.gstin ? branch.gstin.slice(0, 2) : '27');
      const resolvedPos = dto.placeOfSupply?.trim() || (dto.isInterstate && resolvedCustomerGstin ? resolvedCustomerGstin.slice(0, 2) : branchPos);

      // 5. Persist Invoice
      const invoice = manager.create(InvoiceEntity, {
        tenantId,
        branchId: dto.branchId,
        invoiceNumber,
        idempotencyKey: dto.idempotencyKey,
        status: InvoiceStatus.POSTED,
        customerId: dto.customerId ?? null,
        customerGstinSnapshot: resolvedCustomerGstin,
        placeOfSupply: resolvedPos,
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

      // 8. Record Khata Receivable Ledger Entry if Credit tendered
      if (creditCustomer && creditTotalCents > 0) {
        const customerLedger = manager.create(CustomerLedgerEntity, {
          tenantId,
          customerId: (creditCustomer as CustomerEntity).id,
          branchId: dto.branchId,
          entryType: CustomerLedgerEntryType.INVOICE_DEBIT,
          debit: (creditTotalCents / 100).toFixed(2),
          credit: '0.00',
          sourceType: 'invoice',
          sourceId: savedInvoice.id,
          idempotencyKey: `inv-credit-${savedInvoice.id}`,
          paymentMethod: 'credit',
          createdBy: cashierUserId,
          notes: `Credit sale invoice ${savedInvoice.invoiceNumber}`,
        });
        await manager.save(customerLedger);

        (creditCustomer as CustomerEntity).currentBalance = (newCustomerBalanceCents / 100).toFixed(2);
        await manager.save(creditCustomer);
      }

      // 9. Atomic Stock Deduction via Ledger
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

    if (this.realtimeService) {
      this.realtimeService.emit(
        tenantId,
        'ORDER_CREATED',
        {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.grandTotal,
          branchId: invoice.branchId,
        },
        invoice.branchId,
      );
      this.realtimeService.emit(
        tenantId,
        'STOCK_CHANGED',
        {
          reason: 'SALE',
          invoiceId: invoice.id,
          branchId: invoice.branchId,
        },
        invoice.branchId,
      );
    }

    return invoice;
  }

  async getInvoices(tenantId: string, branchId?: string): Promise<InvoiceEntity[]> {
    const where: any = { tenantId };
    if (branchId) {
      where.branchId = branchId;
    }
    return this.invoiceRepo.find({
      where,
      relations: ['lines', 'payments'],
      order: { postedAt: 'DESC' },
      take: 50,
    });
  }

  async getInvoiceById(tenantId: string, invoiceId: string): Promise<InvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, tenantId },
      relations: ['lines', 'payments', 'creditNotes', 'creditNotes.lines'],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }
    return invoice;
  }

  /**
   * Processes a sales return / credit note against a posted invoice.
   * Enforces original invoice linkage, maximum returnable quantity ceilings per line,
   * server-authoritative GST & price calculations, resellable vs damaged stock sorting,
   * multi-tender refund processing, customer Khata debt credit, and immutable audit logs.
   */
  async createReturn(
    tenantId: string,
    issuedByUserId: string,
    dto: CreateSalesReturnDto,
  ): Promise<CreditNoteEntity> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Idempotency Check
      const existing = await manager.findOne(CreditNoteEntity, {
        where: { tenantId, idempotencyKey: dto.idempotencyKey },
        relations: ['lines'],
      });
      if (existing) {
        return existing;
      }

      // 2. Fetch original invoice with lines and payments
      const invoice = await manager.findOne(InvoiceEntity, {
        where: { id: dto.originalInvoiceId, tenantId },
        relations: ['lines', 'payments'],
      });
      if (!invoice) {
        throw new NotFoundException(`Invoice ${dto.originalInvoiceId} not found in this tenant`);
      }
      if (invoice.status === InvoiceStatus.VOIDED) {
        throw new BadRequestException(`Cannot process return for voided invoice ${invoice.invoiceNumber}`);
      }

      // 3. Fetch existing credit notes for this invoice to enforce quantity ceiling
      const priorCreditNotes = await manager.find(CreditNoteEntity, {
        where: { tenantId, originalInvoiceId: invoice.id },
        relations: ['lines'],
      });

      const alreadyReturnedByLineId = new Map<string, number>();
      priorCreditNotes.forEach((cn) => {
        cn.lines?.forEach((line) => {
          if (line.originalInvoiceLineId) {
            const current = alreadyReturnedByLineId.get(line.originalInvoiceLineId) || 0;
            alreadyReturnedByLineId.set(
              line.originalInvoiceLineId,
              current + parseFloat(line.quantityReturned),
            );
          }
        });
      });

      const invoiceLineMap = new Map(invoice.lines.map((l) => [l.id, l]));

      let subtotalCents = 0;
      let taxableTotalCents = 0;
      let cgstTotalCents = 0;
      let sgstTotalCents = 0;
      let igstTotalCents = 0;

      const calculatedReturnLines: Array<{
        originalInvoiceLine: InvoiceLineEntity;
        product: ProductEntity;
        resellableQty: number;
        damagedQty: number;
        totalQty: number;
        unitPrice: string;
        taxableValue: string;
        gstRatePercent: string;
        cgstAmount: string;
        sgstAmount: string;
        igstAmount: string;
        lineTotal: string;
        reason?: string;
      }> = [];

      for (const item of dto.items) {
        const invLine = invoiceLineMap.get(item.invoiceLineId);
        if (!invLine) {
          throw new BadRequestException(
            `Invoice line ${item.invoiceLineId} does not belong to invoice ${invoice.invoiceNumber}`,
          );
        }

        const resellableQty = parseFloat(item.resellableQuantity || '0');
        const damagedQty = parseFloat(item.damagedQuantity || '0');

        if (isNaN(resellableQty) || resellableQty < 0 || isNaN(damagedQty) || damagedQty < 0) {
          throw new BadRequestException('Return quantities cannot be negative');
        }

        const totalQty = resellableQty + damagedQty;
        if (totalQty <= 0) {
          throw new BadRequestException(
            `Total return quantity must be greater than zero for item ${invLine.productNameSnapshot}`,
          );
        }

        const alreadyReturned = alreadyReturnedByLineId.get(invLine.id) || 0;
        const origQty = parseFloat(invLine.quantity);

        if (alreadyReturned + totalQty > origQty + 0.0001) {
          throw new BadRequestException(
            `Return quantity ${totalQty} exceeds eligible remaining quantity ${(origQty - alreadyReturned).toFixed(3)} for item ${invLine.productNameSnapshot}`,
          );
        }

        // Product check
        if (!invLine.productId) {
          throw new BadRequestException(
            `Invoice line ${invLine.id} does not have an associated product for inventory return`,
          );
        }
        const product = await manager.findOne(ProductEntity, {
          where: { id: invLine.productId, tenantId },
        });
        if (!product) {
          throw new NotFoundException(`Product ${invLine.productId} not found`);
        }

        // Financial calculations based on original line snapshot
        const origUnitPriceNum = parseFloat(invLine.unitPrice);
        const origDiscountNum = parseFloat(invLine.discountAmount || '0');
        const gstRate = parseFloat(invLine.gstRatePercent || '0');

        // Proportion of line returned
        const fraction = totalQty / origQty;

        const lineGrossCents = Math.round(origUnitPriceNum * totalQty * 100);
        const lineDiscountCents = Math.round(origDiscountNum * fraction * 100);
        const lineTaxableCents = lineGrossCents - lineDiscountCents;

        let lineCgstCents = 0;
        let lineSgstCents = 0;
        let lineIgstCents = 0;

        if (invoice.isInterstate) {
          lineIgstCents = Math.round((lineTaxableCents * gstRate) / 100);
        } else {
          lineCgstCents = Math.round((lineTaxableCents * (gstRate / 2)) / 100);
          lineSgstCents = Math.round((lineTaxableCents * (gstRate / 2)) / 100);
        }

        const lineTotalCents = lineTaxableCents + lineCgstCents + lineSgstCents + lineIgstCents;

        subtotalCents += lineGrossCents;
        taxableTotalCents += lineTaxableCents;
        cgstTotalCents += lineCgstCents;
        sgstTotalCents += lineSgstCents;
        igstTotalCents += lineIgstCents;

        calculatedReturnLines.push({
          originalInvoiceLine: invLine,
          product,
          resellableQty,
          damagedQty,
          totalQty,
          unitPrice: invLine.unitPrice,
          taxableValue: (lineTaxableCents / 100).toFixed(2),
          gstRatePercent: invLine.gstRatePercent,
          cgstAmount: (lineCgstCents / 100).toFixed(2),
          sgstAmount: (lineSgstCents / 100).toFixed(2),
          igstAmount: (lineIgstCents / 100).toFixed(2),
          lineTotal: (lineTotalCents / 100).toFixed(2),
          reason: item.reason,
        });

        // Record for ceiling check across multiple items in same request
        alreadyReturnedByLineId.set(invLine.id, alreadyReturned + totalQty);
      }

      const totalBeforeRounding = taxableTotalCents + cgstTotalCents + sgstTotalCents + igstTotalCents;
      const roundedGrandTotalCents = Math.round(totalBeforeRounding / 100) * 100;
      const roundingDiffCents = roundedGrandTotalCents - totalBeforeRounding;

      // 4. Generate sequential Credit Note Number (CN-YYYYMMDD-XXXX)
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      const creditNoteNumber = `CN-${datePrefix}-${uniqueSuffix}`;

      // 5. Persist CreditNoteEntity
      const creditNote = manager.create(CreditNoteEntity, {
        tenantId,
        branchId: invoice.branchId,
        creditNoteNumber,
        idempotencyKey: dto.idempotencyKey,
        originalInvoiceId: invoice.id,
        originalInvoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerGstinSnapshot: invoice.customerGstinSnapshot,
        placeOfSupply: invoice.placeOfSupply,
        isInterstate: invoice.isInterstate,
        issuedByUserId,
        reason: dto.reason,
        subtotal: (subtotalCents / 100).toFixed(2),
        taxableTotal: (taxableTotalCents / 100).toFixed(2),
        cgstTotal: (cgstTotalCents / 100).toFixed(2),
        sgstTotal: (sgstTotalCents / 100).toFixed(2),
        igstTotal: (igstTotalCents / 100).toFixed(2),
        grandTotal: (roundedGrandTotalCents / 100).toFixed(2),
        roundingAdjustment: (roundingDiffCents / 100).toFixed(2),
        refundPaymentMethod: dto.refundPaymentMethod,
        refundReference: dto.refundReference || null,
        status: 'issued',
      });

      const savedCreditNote = await manager.save(creditNote);

      // 6. Persist CreditNoteLines
      for (const line of calculatedReturnLines) {
        const cnLine = manager.create(CreditNoteLineEntity, {
          tenantId,
          creditNoteId: savedCreditNote.id,
          originalInvoiceLineId: line.originalInvoiceLine.id,
          productId: line.product.id,
          productNameSnapshot: line.originalInvoiceLine.productNameSnapshot,
          skuSnapshot: line.originalInvoiceLine.skuSnapshot,
          hsnSnapshot: line.originalInvoiceLine.hsnSnapshot,
          quantityReturned: line.totalQty.toFixed(3),
          resellableQuantity: line.resellableQty.toFixed(3),
          damagedQuantity: line.damagedQty.toFixed(3),
          unitPrice: line.unitPrice,
          taxableValue: line.taxableValue,
          gstRatePercent: line.gstRatePercent,
          cgstAmount: line.cgstAmount,
          sgstAmount: line.sgstAmount,
          igstAmount: line.igstAmount,
          lineTotal: line.lineTotal,
          returnReason: line.reason || null,
        });
        await manager.save(cnLine);
      }

      // 7. Inventory Stock Movement
      for (const line of calculatedReturnLines) {
        // Resellable items -> returned to stock on hand
        if (line.resellableQty > 0) {
          const resellableMovement = manager.create(StockLedgerEntity, {
            tenantId,
            branchId: invoice.branchId,
            productId: line.product.id,
            movementType: StockMovementType.SALE_RETURN,
            quantityDelta: line.resellableQty.toFixed(3),
            unitCost: line.unitPrice,
            sourceType: 'credit_note',
            sourceId: savedCreditNote.id,
            idempotencyKey: `cn-resell-${savedCreditNote.id}-${line.product.id}`,
            createdBy: issuedByUserId,
            reason: `Sales return ${savedCreditNote.creditNoteNumber} (resellable) for inv ${invoice.invoiceNumber}`,
          });
          await manager.save(resellableMovement);

          // Update stock balance
          let balance = await manager.findOne(StockBalanceEntity, {
            where: { tenantId, branchId: invoice.branchId, productId: line.product.id },
          });
          if (balance) {
            const current = parseFloat(balance.quantityOnHand);
            balance.quantityOnHand = (current + line.resellableQty).toFixed(3);
            await manager.save(balance);
          }
        }

        // Damaged items -> logged to stock ledger as damage, does not inflate salable balance
        if (line.damagedQty > 0) {
          const damageMovement = manager.create(StockLedgerEntity, {
            tenantId,
            branchId: invoice.branchId,
            productId: line.product.id,
            movementType: StockMovementType.DAMAGE,
            quantityDelta: '0.000',
            unitCost: line.unitPrice,
            sourceType: 'credit_note',
            sourceId: savedCreditNote.id,
            idempotencyKey: `cn-damage-${savedCreditNote.id}-${line.product.id}`,
            createdBy: issuedByUserId,
            reason: `Sales return ${savedCreditNote.creditNoteNumber} (damaged: ${line.damagedQty}) for inv ${invoice.invoiceNumber}`,
          });
          await manager.save(damageMovement);
        }
      }

      // 8. Handle Customer Khata Store Credit Refund if tender is CREDIT
      if (dto.refundPaymentMethod === PaymentMethod.CREDIT) {
        if (!invoice.customerId) {
          throw new BadRequestException('Cannot refund via customer Khata credit for walk-in customer without profile');
        }

        const customer = await manager.findOne(CustomerEntity, {
          where: { id: invoice.customerId, tenantId },
        });
        if (customer) {
          const currentBalCents = Math.round(parseFloat(customer.currentBalance) * 100);
          const newBalCents = currentBalCents - roundedGrandTotalCents;
          customer.currentBalance = (newBalCents / 100).toFixed(2);
          await manager.save(customer);

          const ledgerEntry = manager.create(CustomerLedgerEntity, {
            tenantId,
            customerId: customer.id,
            branchId: invoice.branchId,
            entryType: CustomerLedgerEntryType.REFUND,
            debit: '0.00',
            credit: (roundedGrandTotalCents / 100).toFixed(2),
            sourceType: 'credit_note',
            sourceId: savedCreditNote.id,
            idempotencyKey: `cn-cust-${savedCreditNote.id}`,
            paymentMethod: 'credit',
            createdBy: issuedByUserId,
            notes: `Sales return credit note ${savedCreditNote.creditNoteNumber} refund for invoice ${invoice.invoiceNumber}`,
          });
          await manager.save(ledgerEntry);
        }
      }

      // 9. Check if invoice is 100% returned
      let allLinesFullyReturned = true;
      for (const invLine of invoice.lines) {
        const returnedSoFar = alreadyReturnedByLineId.get(invLine.id) || 0;
        const lineQty = parseFloat(invLine.quantity);
        if (returnedSoFar < lineQty - 0.0001) {
          allLinesFullyReturned = false;
          break;
        }
      }

      if (allLinesFullyReturned) {
        invoice.status = InvoiceStatus.RETURNED;
        await manager.save(invoice);
      }

      // 10. Audit log
      if (this.auditService) {
        await this.auditService.log({
          tenantId,
          userId: issuedByUserId,
          action: 'CREDIT_NOTE_CREATED',
          resourceType: 'credit_note',
          resourceId: savedCreditNote.id,
          details: {
            creditNoteNumber: savedCreditNote.creditNoteNumber,
            originalInvoiceNumber: invoice.invoiceNumber,
            grandTotal: savedCreditNote.grandTotal,
            refundPaymentMethod: savedCreditNote.refundPaymentMethod,
            reason: savedCreditNote.reason,
          },
        });
      }

      return manager.findOne(CreditNoteEntity, {
        where: { id: savedCreditNote.id },
        relations: ['lines'],
      }) as Promise<CreditNoteEntity>;
    });
  }

  async getCreditNotes(
    tenantId: string,
    query?: CreditNoteQueryDto,
  ): Promise<{ creditNotes: CreditNoteEntity[]; total: number }> {
    const where: FindOptionsWhere<CreditNoteEntity> = { tenantId };

    if (query?.branchId) {
      where.branchId = query.branchId;
    }
    if (query?.originalInvoiceId) {
      where.originalInvoiceId = query.originalInvoiceId;
    }
    if (query?.startDate && query?.endDate) {
      where.createdAt = Between(
        new Date(`${query.startDate}T00:00:00.000Z`),
        new Date(`${query.endDate}T23:59:59.999Z`),
      );
    }

    const page = query?.page || 1;
    const limit = query?.limit || 50;

    const [creditNotes, total] = await this.creditNoteRepo.findAndCount({
      where,
      relations: ['lines'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { creditNotes, total };
  }

  async getCreditNoteById(tenantId: string, creditNoteId: string): Promise<CreditNoteEntity> {
    const cn = await this.creditNoteRepo.findOne({
      where: { id: creditNoteId, tenantId },
      relations: ['lines', 'originalInvoice'],
    });
    if (!cn) {
      throw new NotFoundException(`Credit note ${creditNoteId} not found`);
    }
    return cn;
  }
}

