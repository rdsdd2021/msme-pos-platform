import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { CustomerEntity } from './entities/customer.entity';
import { CustomerLedgerEntity } from './entities/customer-ledger.entity';
import { CashierShiftEntity } from './entities/cashier-shift.entity';
import { InvoiceEntity } from '../billing/entities/invoice.entity';
import { PaymentEntity } from '../billing/entities/payment.entity';
import {
  CreateCustomerDto,
  RecordCustomerPaymentDto,
  OpenShiftDto,
  CloseShiftDto,
} from './dto/operations.dto';
import { CustomerLedgerEntryType, ShiftStatus } from '@pos/shared-types';

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
  ) {}

  async createCustomer(tenantId: string, dto: CreateCustomerDto): Promise<CustomerEntity> {
    const customer = this.customerRepo.create({
      tenantId,
      name: dto.name,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      creditLimit: dto.creditLimit ?? '0.00',
      currentBalance: '0.00',
    });
    return this.customerRepo.save(customer);
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
   * Records a Khata repayment from a credit customer, updating customer_ledger and current_balance.
   */
  async recordCustomerPayment(
    tenantId: string,
    customerId: string,
    dto: RecordCustomerPaymentDto,
  ): Promise<{ ledger: CustomerLedgerEntity; customer: CustomerEntity }> {
    return this.dataSource.transaction(async (manager) => {
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

      const ledger = manager.create(CustomerLedgerEntity, {
        tenantId,
        customerId,
        branchId: dto.branchId,
        entryType: CustomerLedgerEntryType.PAYMENT_CREDIT,
        debit: '0.00',
        credit: dto.amount,
        sourceType: 'khata_payment',
        sourceId: dto.idempotencyKey,
        idempotencyKey: dto.idempotencyKey,
        notes: dto.notes ?? null,
      });
      const savedLedger = await manager.save(ledger);

      const currentBalanceCents = Math.round(parseFloat(customer.currentBalance) * 100);
      const newBalanceCents = currentBalanceCents - paymentCents;
      customer.currentBalance = (newBalanceCents / 100).toFixed(2);
      const savedCustomer = await manager.save(customer);

      return {
        ledger: savedLedger,
        customer: savedCustomer,
      };
    });
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

    return this.shiftRepo.save(shift);
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

