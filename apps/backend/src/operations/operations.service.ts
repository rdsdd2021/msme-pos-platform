import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { CustomerEntity } from './entities/customer.entity';
import { CustomerLedgerEntity } from './entities/customer-ledger.entity';
import { CashierShiftEntity } from './entities/cashier-shift.entity';
import { InvoiceEntity } from '../billing/entities/invoice.entity';
import { PaymentEntity } from '../billing/entities/payment.entity';
import { AuditService } from '../tenants/audit.service';
import {
  CreateCustomerDto,
  MergeCustomerDto,
  RecordCustomerPaymentDto,
  UpdateCustomerCreditLimitDto,
  CustomerAdjustmentDto,
  CustomerStatementQueryDto,
  OpenShiftDto,
  CloseShiftDto,
} from './dto/operations.dto';
import { CustomerLedgerEntryType, ShiftStatus, InvoiceStatus } from '@pos/shared-types';

export function normalizePhoneNumber(phone?: string | null): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (!cleaned) return null;

  if (cleaned.startsWith('0091')) {
    cleaned = '+91' + cleaned.slice(4);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '+91' + cleaned.slice(1);
  } else if (/^\d{10}$/.test(cleaned)) {
    cleaned = '+91' + cleaned;
  } else if (/^91\d{10}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

export interface CustomerStatementEntry {
  id: string;
  occurredAt: Date;
  entryType: CustomerLedgerEntryType;
  debit: string;
  credit: string;
  runningBalance: string;
  sourceType: string;
  sourceId: string | null;
  idempotencyKey: string | null;
  paymentMethod: string | null;
  branchId: string;
  createdBy: string | null;
  notes: string | null;
}

export interface CustomerStatementResult {
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    creditLimit: string;
    currentBalance: string;
    availableCredit: string;
    creditUtilizationPercent: number;
    creditStatus: 'healthy' | 'near_limit' | 'exceeded' | 'no_credit';
    ageing: {
      current: string;
      days31To60: string;
      days61To90: string;
      over90Days: string;
    };
  };
  statement: {
    from: string | null;
    to: string | null;
    branchId: string | null;
    openingBalance: string;
    closingBalance: string;
    totalDebits: string;
    totalCredits: string;
    entries: CustomerStatementEntry[];
  };
}

export interface DailySalesReport {
  date: string;
  totalSales: string;
  totalTax: string;
  invoiceCount: number;
  paymentBreakdown: Record<string, string>;
}

@Injectable()
export class OperationsService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(CustomerLedgerEntity)
    private readonly customerLedgerRepo: Repository<CustomerLedgerEntity>,
    @InjectRepository(CashierShiftEntity)
    private readonly shiftRepo: Repository<CashierShiftEntity>,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    private readonly dataSource: DataSource,
    @Optional()
    private readonly auditService?: AuditService,
  ) {}

  async createCustomer(tenantId: string, dto: CreateCustomerDto): Promise<CustomerEntity> {
    const normalizedPhone = normalizePhoneNumber(dto.phone);

    if (normalizedPhone) {
      const existing = await this.customerRepo.findOne({
        where: [
          { tenantId, phone: normalizedPhone, isActive: true },
          { tenantId, phone: dto.phone, isActive: true },
        ],
      });

      if (existing && !dto.confirmDuplicate) {
        throw new ConflictException({
          message: `A customer with phone number ${normalizedPhone} already exists: "${existing.name}". Please link to existing customer or explicitly confirm separate profile creation.`,
          duplicateCode: 'CUSTOMER_PHONE_EXISTS',
          existingCustomer: existing,
        });
      }
    }

    const customer = this.customerRepo.create({
      tenantId,
      name: dto.name.trim(),
      phone: normalizedPhone ?? dto.phone?.trim() ?? null,
      email: dto.email?.trim().toLowerCase() ?? null,
      gstin: dto.gstin?.trim().toUpperCase() ?? null,
      creditLimit: dto.creditLimit ?? '0.00',
      currentBalance: '0.00',
      isActive: true,
    });
    return this.customerRepo.save(customer);
  }

  async searchCustomers(tenantId: string, query: string): Promise<CustomerEntity[]> {
    const q = (query || '').trim();
    if (!q) {
      return this.customerRepo.find({
        where: { tenantId, isActive: true },
        order: { name: 'ASC' },
        take: 20,
      });
    }

    const normalizedPhone = normalizePhoneNumber(q);
    const digitsOnly = q.replace(/\D/g, '');

    const qb = this.customerRepo
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.is_active = :isActive', { isActive: true });

    qb.andWhere(
      '(LOWER(c.name) LIKE LOWER(:term) OR c.phone LIKE :term OR (:normPhone IS NOT NULL AND c.phone = :normPhone) OR (:digits != \'\' AND c.phone LIKE :digitsLike) OR CAST(c.id AS text) LIKE :term)',
      {
        term: `%${q}%`,
        normPhone: normalizedPhone,
        digits: digitsOnly,
        digitsLike: `%${digitsOnly}%`,
      },
    );

    qb.orderBy('c.name', 'ASC').take(25);
    return qb.getMany();
  }

  async getCustomerHistory(tenantId: string, customerId: string) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, tenantId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }

    const invoices = await this.invoiceRepo.find({
      where: { tenantId, customerId },
      order: { createdAt: 'DESC' },
    });

    const ledgerEntries = await this.customerLedgerRepo.find({
      where: { tenantId, customerId },
      order: { occurredAt: 'DESC' },
    });

    let totalPurchasesCents = 0;
    let totalRepaymentsCents = 0;

    for (const inv of invoices) {
      if (inv.status !== InvoiceStatus.VOIDED) {
        totalPurchasesCents += Math.round(parseFloat(inv.grandTotal) * 100);
      }
    }

    for (const entry of ledgerEntries) {
      if (entry.entryType === CustomerLedgerEntryType.PAYMENT_CREDIT) {
        totalRepaymentsCents += Math.round(parseFloat(entry.credit) * 100);
      }
    }

    return {
      customer,
      lifetimeStats: {
        totalInvoicesCount: invoices.length,
        totalPurchasesValue: (totalPurchasesCents / 100).toFixed(2),
        totalRepaymentsValue: (totalRepaymentsCents / 100).toFixed(2),
        currentOutstandingBalance: customer.currentBalance,
        creditLimit: customer.creditLimit,
      },
      invoices: invoices.map((i) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        createdAt: i.createdAt,
        grandTotal: i.grandTotal,
        status: i.status,
        paymentStatus: i.paymentStatus,
      })),
      ledgerEntries: ledgerEntries.map((l) => ({
        id: l.id,
        occurredAt: l.occurredAt,
        entryType: l.entryType,
        debit: l.debit,
        credit: l.credit,
        sourceType: l.sourceType,
        sourceId: l.sourceId,
        paymentMethod: l.paymentMethod,
        notes: l.notes,
      })),
    };
  }

  async mergeCustomers(
    tenantId: string,
    actorUserId: string | null,
    sourceCustomerId: string,
    dto: MergeCustomerDto,
  ) {
    if (sourceCustomerId === dto.targetCustomerId) {
      throw new BadRequestException('Cannot merge a customer into itself');
    }

    const sourceCustomer = await this.customerRepo.findOne({
      where: { id: sourceCustomerId, tenantId },
    });
    if (!sourceCustomer) {
      throw new NotFoundException(`Source customer ${sourceCustomerId} not found`);
    }

    const targetCustomer = await this.customerRepo.findOne({
      where: { id: dto.targetCustomerId, tenantId },
    });
    if (!targetCustomer) {
      throw new NotFoundException(`Target customer ${dto.targetCustomerId} not found`);
    }

    if (!sourceCustomer.isActive) {
      throw new BadRequestException('Source customer is already inactive or merged');
    }
    if (!targetCustomer.isActive) {
      throw new BadRequestException('Target customer is inactive');
    }

    return this.dataSource.transaction(async (em) => {
      // 1. Reassign all invoices from source to target customer
      const reassignedInvoices = await em.update(
        InvoiceEntity,
        { tenantId, customerId: sourceCustomerId },
        { customerId: targetCustomer.id },
      );

      // 2. Reassign all ledger entries from source to target customer
      const reassignedLedger = await em.update(
        CustomerLedgerEntity,
        { tenantId, customerId: sourceCustomerId },
        { customerId: targetCustomer.id },
      );

      // 3. Recalculate target customer balance from chronological ledger
      const allTargetLedger = await em.find(CustomerLedgerEntity, {
        where: { tenantId, customerId: targetCustomer.id },
        order: { occurredAt: 'ASC' },
      });

      let netDebitCents = 0;
      for (const entry of allTargetLedger) {
        const debitCents = Math.round(parseFloat(entry.debit || '0') * 100);
        const creditCents = Math.round(parseFloat(entry.credit || '0') * 100);
        netDebitCents += (debitCents - creditCents);
      }

      targetCustomer.currentBalance = (netDebitCents / 100).toFixed(2);
      const savedTarget = await em.save(CustomerEntity, targetCustomer);

      // 4. Soft-deactivate source customer (Preserves immutability, Rule 9)
      sourceCustomer.isActive = false;
      sourceCustomer.currentBalance = '0.00';
      sourceCustomer.name = `${sourceCustomer.name} [MERGED into ${targetCustomer.name}]`;
      await em.save(CustomerEntity, sourceCustomer);

      // 5. Audit log
      if (this.auditService) {
        await this.auditService.log({
          tenantId,
          userId: actorUserId,
          action: 'CUSTOMER_MERGED',
          resourceType: 'customer',
          resourceId: targetCustomer.id,
          details: {
            sourceCustomerId,
            targetCustomerId: targetCustomer.id,
            reason: dto.reason,
            invoicesReassigned: reassignedInvoices.affected || 0,
            ledgerReassigned: reassignedLedger.affected || 0,
            recalculatedBalance: savedTarget.currentBalance,
          },
        });
      }

      return {
        success: true,
        message: `Customer ${sourceCustomer.name} successfully merged into ${targetCustomer.name}. All invoices and ledger entries preserved.`,
        targetCustomer: savedTarget,
        reassignedInvoicesCount: reassignedInvoices.affected || 0,
        reassignedLedgerCount: reassignedLedger.affected || 0,
      };
    });
  }

  async cleanupDevTestCustomers(tenantId: string, actorUserId: string | null) {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Dev test customer cleanup is strictly prohibited in production environment');
    }

    const allCustomers = await this.customerRepo.find({
      where: { tenantId },
    });

    const testRegex = /(^Ramesh Patel \d{4}$|^Test Khata Buyer$|^DevTest)/i;
    let cleanedCount = 0;
    const skippedWithFinancialRecords: string[] = [];

    for (const c of allCustomers) {
      if (testRegex.test(c.name)) {
        const invCount = await this.invoiceRepo.count({ where: { tenantId, customerId: c.id } });
        const ledgCount = await this.customerLedgerRepo.count({ where: { tenantId, customerId: c.id } });

        if (invCount > 0 || ledgCount > 0) {
          skippedWithFinancialRecords.push(
            `${c.name} (${c.id}) has ${invCount} invoices and ${ledgCount} ledger entries. Financial records cannot be deleted.`,
          );
        } else {
          await this.customerRepo.delete(c.id);
          cleanedCount++;
        }
      }
    }

    if (this.auditService && cleanedCount > 0) {
      await this.auditService.log({
        tenantId,
        userId: actorUserId,
        action: 'DEV_TEST_CUSTOMERS_CLEANED',
        resourceType: 'customer',
        resourceId: tenantId,
        details: { cleanedCount, skippedWithFinancialRecords },
      });
    }

    return {
      cleanedCount,
      skippedWithFinancialRecords,
      message: `Cleaned ${cleanedCount} non-financial dev test customer records. ${skippedWithFinancialRecords.length} records preserved due to existing financial history.`,
    };
  }

  async getCustomers(tenantId: string): Promise<CustomerEntity[]> {
    return this.customerRepo.find({
      where: { tenantId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getCustomerLedger(tenantId: string, customerId: string): Promise<CustomerLedgerEntity[]> {
    return this.customerLedgerRepo.find({
      where: { tenantId, customerId },
      order: { occurredAt: 'ASC' },
    });
  }

  /**
   * Sets or updates customer credit limit with mandatory audit logging.
   */
  async updateCustomerCreditLimit(
    tenantId: string,
    userId: string | null,
    customerId: string,
    dto: UpdateCustomerCreditLimitDto,
  ): Promise<CustomerEntity> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, tenantId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }

    const newLimit = parseFloat(dto.creditLimit);
    if (isNaN(newLimit) || newLimit < 0) {
      throw new BadRequestException('Credit limit must be a non-negative number');
    }

    const oldLimit = customer.creditLimit;
    customer.creditLimit = newLimit.toFixed(2);
    const saved = await this.customerRepo.save(customer);

    if (this.auditService) {
      await this.auditService.log({
        tenantId,
        userId,
        action: 'CUSTOMER_CREDIT_LIMIT_UPDATED',
        resourceType: 'customer',
        resourceId: customer.id,
        details: {
          oldCreditLimit: oldLimit,
          newCreditLimit: customer.creditLimit,
          reason: dto.reason ?? null,
        },
      });
    }

    return saved;
  }

  /**
   * Records a Khata repayment from a credit customer, updating customer_ledger and current_balance atomically.
   * Enforces idempotency and prevents repayments exceeding current outstanding balance.
   */
  async recordCustomerPayment(
    tenantId: string,
    userId: string | null,
    customerId: string,
    dto: RecordCustomerPaymentDto,
  ): Promise<{ ledger: CustomerLedgerEntity; customer: CustomerEntity }> {
    return this.dataSource.transaction(async (manager) => {
      // Idempotency check: if already processed, return existing record
      const existingLedger = await manager.findOne(CustomerLedgerEntity, {
        where: { tenantId, idempotencyKey: dto.idempotencyKey },
      });
      if (existingLedger) {
        const existingCustomer = await manager.findOne(CustomerEntity, {
          where: { id: customerId, tenantId },
        });
        return { ledger: existingLedger, customer: existingCustomer! };
      }

      const customer = await manager.findOne(CustomerEntity, {
        where: { id: customerId, tenantId },
      });
      if (!customer) {
        throw new NotFoundException(`Customer ${customerId} not found`);
      }

      const paymentCents = Math.round(parseFloat(dto.amount) * 100);
      if (paymentCents <= 0) {
        throw new BadRequestException('Payment amount must be greater than zero');
      }

      const currentBalanceCents = Math.round(parseFloat(customer.currentBalance) * 100);
      if (paymentCents > currentBalanceCents) {
        throw new BadRequestException(
          `Repayment amount ₹${dto.amount} cannot exceed outstanding balance ₹${customer.currentBalance}`,
        );
      }

      const ledger = manager.create(CustomerLedgerEntity, {
        tenantId,
        customerId,
        branchId: dto.branchId,
        entryType: CustomerLedgerEntryType.PAYMENT_CREDIT,
        debit: '0.00',
        credit: (paymentCents / 100).toFixed(2),
        sourceType: 'khata_repayment',
        sourceId: dto.idempotencyKey,
        idempotencyKey: dto.idempotencyKey,
        paymentMethod: dto.paymentMethod ?? 'cash',
        createdBy: userId,
        notes: dto.notes ?? null,
      });
      const savedLedger = await manager.save(ledger);

      const newBalanceCents = currentBalanceCents - paymentCents;
      customer.currentBalance = (newBalanceCents / 100).toFixed(2);
      const savedCustomer = await manager.save(customer);

      if (this.auditService) {
        await this.auditService.log({
          tenantId,
          userId,
          action: 'KHATA_PAYMENT_RECORDED',
          resourceType: 'customer_ledger',
          resourceId: savedLedger.id,
          details: {
            customerId,
            amount: dto.amount,
            paymentMethod: dto.paymentMethod ?? 'cash',
            newBalance: savedCustomer.currentBalance,
            idempotencyKey: dto.idempotencyKey,
          },
        });
      }

      return {
        ledger: savedLedger,
        customer: savedCustomer,
      };
    });
  }

  /**
   * Records a manual debit or credit adjustment to customer Khata with mandatory reason.
   */
  async recordCustomerAdjustment(
    tenantId: string,
    userId: string | null,
    customerId: string,
    dto: CustomerAdjustmentDto,
  ): Promise<{ ledger: CustomerLedgerEntity; customer: CustomerEntity }> {
    return this.dataSource.transaction(async (manager) => {
      const existingLedger = await manager.findOne(CustomerLedgerEntity, {
        where: { tenantId, idempotencyKey: dto.idempotencyKey },
      });
      if (existingLedger) {
        const existingCustomer = await manager.findOne(CustomerEntity, {
          where: { id: customerId, tenantId },
        });
        return { ledger: existingLedger, customer: existingCustomer! };
      }

      const customer = await manager.findOne(CustomerEntity, {
        where: { id: customerId, tenantId },
      });
      if (!customer) {
        throw new NotFoundException(`Customer ${customerId} not found`);
      }

      const adjCents = Math.round(parseFloat(dto.amount) * 100);
      if (adjCents <= 0) {
        throw new BadRequestException('Adjustment amount must be greater than zero');
      }

      const currentBalanceCents = Math.round(parseFloat(customer.currentBalance) * 100);
      let newBalanceCents = currentBalanceCents;
      let debitStr = '0.00';
      let creditStr = '0.00';

      if (dto.type === 'debit') {
        debitStr = (adjCents / 100).toFixed(2);
        newBalanceCents = currentBalanceCents + adjCents;
      } else {
        creditStr = (adjCents / 100).toFixed(2);
        newBalanceCents = currentBalanceCents - adjCents;
      }

      const ledger = manager.create(CustomerLedgerEntity, {
        tenantId,
        customerId,
        branchId: dto.branchId,
        entryType: CustomerLedgerEntryType.ADJUSTMENT,
        debit: debitStr,
        credit: creditStr,
        sourceType: 'manual_adjustment',
        sourceId: dto.idempotencyKey,
        idempotencyKey: dto.idempotencyKey,
        notes: dto.reason,
        createdBy: userId,
      });
      const savedLedger = await manager.save(ledger);

      customer.currentBalance = (newBalanceCents / 100).toFixed(2);
      const savedCustomer = await manager.save(customer);

      if (this.auditService) {
        await this.auditService.log({
          tenantId,
          userId,
          action: 'CUSTOMER_KHATA_ADJUSTED',
          resourceType: 'customer_ledger',
          resourceId: savedLedger.id,
          details: {
            customerId,
            type: dto.type,
            amount: dto.amount,
            reason: dto.reason,
            newBalance: savedCustomer.currentBalance,
            idempotencyKey: dto.idempotencyKey,
          },
        });
      }

      return {
        ledger: savedLedger,
        customer: savedCustomer,
      };
    });
  }

  /**
   * Generates a complete chronological customer Khata statement with opening balance,
   * running balance, credit metrics, and FIFO ageing analysis.
   */
  async getCustomerStatement(
    tenantId: string,
    customerId: string,
    query: CustomerStatementQueryDto,
  ): Promise<CustomerStatementResult> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, tenantId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }

    let openingBalanceCents = 0;
    if (query.from) {
      const fromDate = new Date(query.from);
      const preEntries = await this.customerLedgerRepo
        .createQueryBuilder('cl')
        .where('cl.tenant_id = :tenantId', { tenantId })
        .andWhere('cl.customer_id = :customerId', { customerId })
        .andWhere('cl.occurred_at < :fromDate', { fromDate })
        .getMany();

      for (const e of preEntries) {
        openingBalanceCents += Math.round(parseFloat(e.debit) * 100) - Math.round(parseFloat(e.credit) * 100);
      }
    }

    const qb = this.customerLedgerRepo
      .createQueryBuilder('cl')
      .where('cl.tenant_id = :tenantId', { tenantId })
      .andWhere('cl.customer_id = :customerId', { customerId });

    if (query.from) {
      qb.andWhere('cl.occurred_at >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('cl.occurred_at <= :to', { to: new Date(query.to) });
    }
    if (query.branchId) {
      qb.andWhere('cl.branch_id = :branchId', { branchId: query.branchId });
    }
    qb.orderBy('cl.occurred_at', 'ASC');

    const entries = await qb.getMany();

    let runningCents = openingBalanceCents;
    let totalDebitsCents = 0;
    let totalCreditsCents = 0;

    const statementEntries: CustomerStatementEntry[] = entries.map((e) => {
      const dCents = Math.round(parseFloat(e.debit) * 100);
      const cCents = Math.round(parseFloat(e.credit) * 100);
      totalDebitsCents += dCents;
      totalCreditsCents += cCents;
      runningCents += dCents - cCents;

      return {
        id: e.id,
        occurredAt: e.occurredAt,
        entryType: e.entryType,
        debit: e.debit,
        credit: e.credit,
        runningBalance: (runningCents / 100).toFixed(2),
        sourceType: e.sourceType,
        sourceId: e.sourceId,
        idempotencyKey: e.idempotencyKey,
        paymentMethod: e.paymentMethod,
        branchId: e.branchId,
        createdBy: e.createdBy,
        notes: e.notes,
      };
    });

    const creditLimitCents = Math.round(parseFloat(customer.creditLimit) * 100);
    const currentBalanceCents = Math.round(parseFloat(customer.currentBalance) * 100);
    const availableCreditCents = creditLimitCents > 0 ? Math.max(0, creditLimitCents - currentBalanceCents) : 0;
    const creditUtilizationPercent = creditLimitCents > 0
      ? Math.min(100, Math.round((currentBalanceCents / creditLimitCents) * 100))
      : 0;

    let creditStatus: 'healthy' | 'near_limit' | 'exceeded' | 'no_credit' = 'healthy';
    if (creditLimitCents === 0) {
      creditStatus = 'no_credit';
    } else if (currentBalanceCents > creditLimitCents) {
      creditStatus = 'exceeded';
    } else if (creditUtilizationPercent >= 90) {
      creditStatus = 'near_limit';
    }

    const ageing = await this.calculateCustomerAgeing(tenantId, customerId);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        creditLimit: customer.creditLimit,
        currentBalance: customer.currentBalance,
        availableCredit: (availableCreditCents / 100).toFixed(2),
        creditUtilizationPercent,
        creditStatus,
        ageing,
      },
      statement: {
        from: query.from ?? null,
        to: query.to ?? null,
        branchId: query.branchId ?? null,
        openingBalance: (openingBalanceCents / 100).toFixed(2),
        closingBalance: (runningCents / 100).toFixed(2),
        totalDebits: (totalDebitsCents / 100).toFixed(2),
        totalCredits: (totalCreditsCents / 100).toFixed(2),
        entries: statementEntries,
      },
    };
  }

  /**
   * Calculates FIFO debt ageing for the customer's outstanding balance.
   */
  private async calculateCustomerAgeing(tenantId: string, customerId: string): Promise<{
    current: string;
    days31To60: string;
    days61To90: string;
    over90Days: string;
  }> {
    const allEntries = await this.customerLedgerRepo.find({
      where: { tenantId, customerId },
      order: { occurredAt: 'ASC' },
    });

    let totalCreditsCents = 0;
    for (const e of allEntries) {
      totalCreditsCents += Math.round(parseFloat(e.credit) * 100);
    }

    let currentCents = 0;
    let days31To60Cents = 0;
    let days61To90Cents = 0;
    let over90Cents = 0;

    const now = Date.now();
    const MS_IN_DAY = 24 * 60 * 60 * 1000;

    for (const e of allEntries) {
      const debitCents = Math.round(parseFloat(e.debit) * 100);
      if (debitCents <= 0) continue;

      let unpaidCents = debitCents;
      if (totalCreditsCents > 0) {
        const covered = Math.min(unpaidCents, totalCreditsCents);
        unpaidCents -= covered;
        totalCreditsCents -= covered;
      }

      if (unpaidCents > 0) {
        const ageDays = Math.floor((now - new Date(e.occurredAt).getTime()) / MS_IN_DAY);
        if (ageDays <= 30) {
          currentCents += unpaidCents;
        } else if (ageDays <= 60) {
          days31To60Cents += unpaidCents;
        } else if (ageDays <= 90) {
          days61To90Cents += unpaidCents;
        } else {
          over90Cents += unpaidCents;
        }
      }
    }

    return {
      current: (currentCents / 100).toFixed(2),
      days31To60: (days31To60Cents / 100).toFixed(2),
      days61To90: (days61To90Cents / 100).toFixed(2),
      over90Days: (over90Cents / 100).toFixed(2),
    };
  }

  // --- Cashier Shift Lifecycle ---

  async openShift(tenantId: string, cashierUserId: string, dto: OpenShiftDto): Promise<CashierShiftEntity> {
    const existing = await this.shiftRepo.findOne({
      where: { tenantId, branchId: dto.branchId, cashierUserId, status: ShiftStatus.OPEN },
    });
    if (existing) {
      throw new BadRequestException('You already have an open shift for this branch');
    }

    const shift = this.shiftRepo.create({
      tenantId,
      branchId: dto.branchId,
      cashierUserId,
      openingCash: dto.openingCash,
      status: ShiftStatus.OPEN,
    });
    return this.shiftRepo.save(shift);
  }

  async closeShift(
    tenantId: string,
    shiftId: string,
    dto: CloseShiftDto,
  ): Promise<CashierShiftEntity> {
    const shift = await this.shiftRepo.findOne({
      where: { id: shiftId, tenantId, status: ShiftStatus.OPEN },
    });
    if (!shift) {
      throw new NotFoundException('Open shift not found');
    }

    // Sum cash payments collected during the shift
    const cashPayments = await this.paymentRepo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.branch_id = :branchId', { branchId: shift.branchId })
      .andWhere('p.payment_method = :cashMethod', { cashMethod: 'cash' })
      .andWhere('p.received_at >= :openedAt', { openedAt: shift.openedAt })
      .getMany();

    let totalCashSalesCents = 0;
    for (const p of cashPayments) {
      totalCashSalesCents += Math.round(parseFloat(p.amount) * 100);
    }

    const openingCents = Math.round(parseFloat(shift.openingCash) * 100);
    const expectedCents = openingCents + totalCashSalesCents;
    const closingCents = Math.round(parseFloat(dto.closingCash) * 100);
    const varianceCents = closingCents - expectedCents;

    shift.status = ShiftStatus.CLOSED;
    shift.closedAt = new Date();
    shift.closingCash = dto.closingCash;
    shift.expectedCash = (expectedCents / 100).toFixed(2);
    shift.variance = (varianceCents / 100).toFixed(2);

    const saved = await this.shiftRepo.save(shift);

    if (this.auditService) {
      await this.auditService.log({
        tenantId,
        userId: shift.cashierUserId,
        action: 'SHIFT_CLOSED',
        resourceType: 'cashier_shift',
        resourceId: shift.id,
        details: {
          closingCash: dto.closingCash,
          expectedCash: shift.expectedCash,
          variance: shift.variance,
        },
      });
    }

    return saved;
  }

  async getShifts(tenantId: string, branchId?: string): Promise<CashierShiftEntity[]> {
    const where: any = { tenantId };
    if (branchId) {
      where.branchId = branchId;
    }
    return this.shiftRepo.find({
      where,
      order: { openedAt: 'DESC' },
      take: 50,
    });
  }

  async getCurrentShift(tenantId: string, cashierUserId: string, branchId?: string): Promise<CashierShiftEntity | null> {
    const where: any = { tenantId, cashierUserId, status: ShiftStatus.OPEN };
    if (branchId) {
      where.branchId = branchId;
    }
    return this.shiftRepo.findOne({
      where,
      order: { openedAt: 'DESC' },
    });
  }

  // --- Daily Sales Reporting ---

  async getDailySalesReport(
    tenantId: string,
    branchId: string,
    dateString: string,
  ): Promise<DailySalesReport> {
    const startOfDay = new Date(`${dateString}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateString}T23:59:59.999Z`);

    const invoices = await this.invoiceRepo.find({
      where: {
        tenantId,
        branchId,
        postedAt: Between(startOfDay, endOfDay),
      },
    });

    const payments = await this.paymentRepo.find({
      where: {
        tenantId,
        branchId,
        receivedAt: Between(startOfDay, endOfDay),
      },
    });

    let totalSalesCents = 0;
    let totalTaxCents = 0;

    for (const inv of invoices) {
      totalSalesCents += Math.round(parseFloat(inv.grandTotal) * 100);
      const cgst = Math.round(parseFloat(inv.cgstTotal) * 100);
      const sgst = Math.round(parseFloat(inv.sgstTotal) * 100);
      const igst = Math.round(parseFloat(inv.igstTotal) * 100);
      totalTaxCents += cgst + sgst + igst;
    }

    const paymentBreakdown: Record<string, string> = {};
    for (const p of payments) {
      const current = paymentBreakdown[p.paymentMethod] ? parseFloat(paymentBreakdown[p.paymentMethod]) : 0;
      paymentBreakdown[p.paymentMethod] = (current + parseFloat(p.amount)).toFixed(2);
    }

    return {
      date: dateString,
      totalSales: (totalSalesCents / 100).toFixed(2),
      totalTax: (totalTaxCents / 100).toFixed(2),
      invoiceCount: invoices.length,
      paymentBreakdown,
    };
  }
}

