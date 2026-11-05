import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { OperationsService, normalizePhoneNumber } from './operations.service';
import { CustomerEntity } from './entities/customer.entity';
import { CustomerLedgerEntity } from './entities/customer-ledger.entity';
import { CashierShiftEntity } from './entities/cashier-shift.entity';
import { InvoiceEntity } from '../billing/entities/invoice.entity';
import { PaymentEntity } from '../billing/entities/payment.entity';
import { AuditService } from '../tenants/audit.service';
import { CustomerLedgerEntryType, ShiftStatus } from '@pos/shared-types';

describe('OperationsService — Khata Ledger & Cash Reconciliation', () => {
  let service: OperationsService;
  let mockCustomerRepo: any;
  let mockCustomerLedgerRepo: any;
  let mockShiftRepo: any;
  let mockInvoiceRepo: any;
  let mockPaymentRepo: any;
  let mockDataSource: any;
  let mockAuditService: any;

  beforeEach(async () => {
    mockCustomerRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(async (d) => d),
      create: jest.fn((d) => d),
    };
    mockCustomerLedgerRepo = {
      find: jest.fn(),
      save: jest.fn(async (d) => d),
      create: jest.fn((d) => d),
      createQueryBuilder: jest.fn(),
    };
    mockShiftRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (d) => d),
      create: jest.fn((d) => d),
    };
    mockInvoiceRepo = { find: jest.fn().mockResolvedValue([]) };
    mockPaymentRepo = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(),
    };
    mockDataSource = { transaction: jest.fn() };
    mockAuditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationsService,
        { provide: getRepositoryToken(CustomerEntity), useValue: mockCustomerRepo },
        { provide: getRepositoryToken(CustomerLedgerEntity), useValue: mockCustomerLedgerRepo },
        { provide: getRepositoryToken(CashierShiftEntity), useValue: mockShiftRepo },
        { provide: getRepositoryToken(InvoiceEntity), useValue: mockInvoiceRepo },
        { provide: getRepositoryToken(PaymentEntity), useValue: mockPaymentRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<OperationsService>(OperationsService);
  });

  describe('Khata Credit Ledger', () => {
    it('records customer debt repayment and reduces outstanding balance', async () => {
      const mockCustomer = {
        id: 'cust-1',
        tenantId: 'tenant-1',
        name: 'Ramesh Patel',
        currentBalance: '1500.00',
      };

      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // idempotency check
          .mockResolvedValueOnce(mockCustomer), // customer lookup
        create: jest.fn((entity, data) => data),
        save: jest.fn(async (data) => data),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const result = await service.recordCustomerPayment('tenant-1', 'user-1', 'cust-1', {
        branchId: 'branch-1',
        amount: '500.00',
        paymentMethod: 'upi',
        idempotencyKey: 'repay-101',
      });

      expect(result.ledger.credit).toBe('500.00');
      expect(result.ledger.paymentMethod).toBe('upi');
      expect(result.customer.currentBalance).toBe('1000.00'); // 1500 - 500 = 1000
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'KHATA_PAYMENT_RECORDED' }),
      );
    });

    it('rejects repayment when amount exceeds current outstanding balance', async () => {
      const mockCustomer = {
        id: 'cust-1',
        tenantId: 'tenant-1',
        name: 'Ramesh Patel',
        currentBalance: '400.00',
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(mockCustomer),
        create: jest.fn((entity, data) => data),
        save: jest.fn(async (data) => data),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(
        service.recordCustomerPayment('tenant-1', 'user-1', 'cust-1', {
          branchId: 'branch-1',
          amount: '500.00',
          idempotencyKey: 'repay-over',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns existing record when idempotencyKey is re-submitted', async () => {
      const existingLedger = {
        id: 'ledger-existing',
        credit: '300.00',
        idempotencyKey: 'repay-existing',
      };
      const existingCustomer = {
        id: 'cust-1',
        currentBalance: '700.00',
      };

      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(existingLedger)
          .mockResolvedValueOnce(existingCustomer),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const result = await service.recordCustomerPayment('tenant-1', 'user-1', 'cust-1', {
        branchId: 'branch-1',
        amount: '300.00',
        idempotencyKey: 'repay-existing',
      });

      expect(result.ledger.id).toBe('ledger-existing');
      expect(result.customer.currentBalance).toBe('700.00');
    });

    it('updates customer credit limit and logs immutable audit record', async () => {
      const mockCustomer = {
        id: 'cust-1',
        tenantId: 'tenant-1',
        name: 'Ramesh Patel',
        creditLimit: '5000.00',
        currentBalance: '1000.00',
      };
      mockCustomerRepo.findOne.mockResolvedValueOnce(mockCustomer);

      const updated = await service.updateCustomerCreditLimit('tenant-1', 'user-1', 'cust-1', {
        creditLimit: '10000.00',
        reason: 'Good payment history',
      });

      expect(updated.creditLimit).toBe('10000.00');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CUSTOMER_CREDIT_LIMIT_UPDATED',
          details: expect.objectContaining({
            oldCreditLimit: '5000.00',
            newCreditLimit: '10000.00',
            reason: 'Good payment history',
          }),
        }),
      );
    });

    it('records manual customer adjustment', async () => {
      const mockCustomer = {
        id: 'cust-1',
        tenantId: 'tenant-1',
        name: 'Ramesh Patel',
        currentBalance: '1000.00',
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(mockCustomer),
        create: jest.fn((entity, data) => data),
        save: jest.fn(async (data) => data),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const result = await service.recordCustomerAdjustment('tenant-1', 'user-1', 'cust-1', {
        branchId: 'branch-1',
        type: 'credit',
        amount: '100.00',
        reason: 'Waiver for damaged items',
        idempotencyKey: 'adj-101',
      });

      expect(result.customer.currentBalance).toBe('900.00');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CUSTOMER_KHATA_ADJUSTED' }),
      );
    });

    it('computes chronological customer statement with opening balance and running balance', async () => {
      const mockCustomer = {
        id: 'cust-1',
        tenantId: 'tenant-1',
        name: 'Ramesh Patel',
        creditLimit: '5000.00',
        currentBalance: '600.00',
      };
      mockCustomerRepo.findOne.mockResolvedValueOnce(mockCustomer);

      // Prior entries before 'from' date
      const priorEntries = [
        { debit: '1000.00', credit: '0.00' },
        { debit: '0.00', credit: '300.00' },
      ]; // opening = 1000 - 300 = 700.00

      // Period entries
      const periodEntries = [
        {
          id: 'e-1',
          occurredAt: new Date('2026-10-15T10:00:00Z'),
          entryType: CustomerLedgerEntryType.INVOICE_DEBIT,
          debit: '500.00',
          credit: '0.00',
          sourceType: 'invoice',
          sourceId: 'inv-1',
          branchId: 'branch-1',
        },
        {
          id: 'e-2',
          occurredAt: new Date('2026-10-20T10:00:00Z'),
          entryType: CustomerLedgerEntryType.PAYMENT_CREDIT,
          debit: '0.00',
          credit: '600.00',
          sourceType: 'khata_repayment',
          sourceId: 'repay-1',
          branchId: 'branch-1',
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValueOnce(priorEntries) // preEntries
          .mockResolvedValueOnce(periodEntries), // statement entries
      };

      mockCustomerLedgerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockCustomerLedgerRepo.find.mockResolvedValueOnce([
        { occurredAt: new Date(), debit: '1000.00', credit: '0.00' },
        { occurredAt: new Date(), debit: '500.00', credit: '0.00' },
        { occurredAt: new Date(), debit: '0.00', credit: '900.00' },
      ]);

      const statement = await service.getCustomerStatement('tenant-1', 'cust-1', {
        from: '2026-10-01T00:00:00Z',
        to: '2026-10-31T23:59:59Z',
      });

      expect(statement.statement.openingBalance).toBe('700.00');
      // e-1: 700 + 500 = 1200.00
      expect(statement.statement.entries[0].runningBalance).toBe('1200.00');
      // e-2: 1200 - 600 = 600.00
      expect(statement.statement.entries[1].runningBalance).toBe('600.00');
      expect(statement.statement.closingBalance).toBe('600.00');
      expect(statement.customer.creditStatus).toBe('healthy');
      expect(statement.customer.availableCredit).toBe('4400.00'); // 5000 - 600 = 4400
    });
  });

  describe('Cashier Shift Reconciliation', () => {
    it('opens shift with opening cash float', async () => {
      mockShiftRepo.findOne.mockResolvedValueOnce(null);

      const shift = await service.openShift('tenant-1', 'cashier-1', {
        branchId: 'branch-1',
        openingCash: '1000.00',
      });

      expect(shift.status).toBe(ShiftStatus.OPEN);
      expect(shift.openingCash).toBe('1000.00');
    });

    it('reconciles closing cash against cash sales and detects zero variance', async () => {
      const mockShift = {
        id: 'shift-1',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        status: ShiftStatus.OPEN,
        openingCash: '1000.00',
        openedAt: new Date('2026-10-31T09:00:00Z'),
      };

      mockShiftRepo.findOne.mockResolvedValueOnce(mockShift);

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { amount: '450.00', paymentMethod: 'cash' },
          { amount: '550.00', paymentMethod: 'cash' },
        ]), // Total cash sales = 1000.00
      };
      mockPaymentRepo.createQueryBuilder.mockReturnValue(mockQb);

      // Expected cash = 1000 (opening) + 1000 (sales) = 2000.00
      const closed = await service.closeShift('tenant-1', 'shift-1', {
        closingCash: '2000.00',
      });

      expect(closed.status).toBe(ShiftStatus.CLOSED);
      expect(closed.expectedCash).toBe('2000.00');
      expect(closed.variance).toBe('0.00');
    });
  });

  describe('Daily Sales Reporting', () => {
    it('aggregates daily gross sales, GST totals and payment breakdowns', async () => {
      mockInvoiceRepo.find.mockResolvedValueOnce([
        {
          grandTotal: '294.00',
          cgstTotal: '7.00',
          sgstTotal: '7.00',
          igstTotal: '0.00',
        },
        {
          grandTotal: '1062.00',
          cgstTotal: '0.00',
          sgstTotal: '0.00',
          igstTotal: '162.00',
        },
      ]);

      mockPaymentRepo.find.mockResolvedValueOnce([
        { paymentMethod: 'cash', amount: '294.00' },
        { paymentMethod: 'upi', amount: '1062.00' },
      ]);

      const report = await service.getDailySalesReport('tenant-1', 'branch-1', '2026-10-31');

      expect(report.totalSales).toBe('1356.00'); // 294 + 1062
      expect(report.totalTax).toBe('176.00'); // 14 + 162
      expect(report.invoiceCount).toBe(2);
      expect(report.paymentBreakdown['cash']).toBe('294.00');
      expect(report.paymentBreakdown['upi']).toBe('1062.00');
    });
  });

  describe('Customer Data Quality, Normalization & Controlled Merging', () => {
    it('normalizes Indian phone numbers across multiple input formats', () => {
      expect(normalizePhoneNumber('9876543210')).toBe('+919876543210');
      expect(normalizePhoneNumber('+919876543210')).toBe('+919876543210');
      expect(normalizePhoneNumber('09876543210')).toBe('+919876543210');
      expect(normalizePhoneNumber('00919876543210')).toBe('+919876543210');
      expect(normalizePhoneNumber('+91 98765-43210')).toBe('+919876543210');
      expect(normalizePhoneNumber('')).toBeNull();
      expect(normalizePhoneNumber(null)).toBeNull();
    });

    it('warns with 409 Conflict when creating a customer with an existing phone number unless confirmed', async () => {
      mockCustomerRepo.findOne.mockResolvedValueOnce({
        id: 'cust-existing',
        name: 'Ramesh Patel',
        phone: '+919876543210',
        isActive: true,
      });

      await expect(
        service.createCustomer('tenant-1', {
          name: 'Ramesh Patel Duplicate',
          phone: '9876543210',
        }),
      ).rejects.toThrow(ConflictException);

      // Force creation with confirmDuplicate
      mockCustomerRepo.save.mockImplementationOnce(async (d: any) => ({ id: 'cust-new', ...d }));
      const created = await service.createCustomer('tenant-1', {
        name: 'Ramesh Patel 2',
        phone: '9876543210',
        confirmDuplicate: true,
      });

      expect(created.phone).toBe('+919876543210');
    });

    it('merges duplicate customer into target account atomically preserving all invoices and ledger entries', async () => {
      const sourceCust = {
        id: 'cust-source',
        tenantId: 'tenant-1',
        name: 'Ramesh Patel (Old)',
        currentBalance: '500.00',
        isActive: true,
      };
      const targetCust = {
        id: 'cust-target',
        tenantId: 'tenant-1',
        name: 'Ramesh Patel (Primary)',
        currentBalance: '1000.00',
        isActive: true,
      };

      mockCustomerRepo.findOne.mockResolvedValueOnce(sourceCust).mockResolvedValueOnce(targetCust);

      const mockEm = {
        update: jest
          .fn()
          .mockResolvedValueOnce({ affected: 3 }) // 3 invoices reassigned
          .mockResolvedValueOnce({ affected: 2 }), // 2 ledger entries reassigned
        find: jest.fn().mockResolvedValueOnce([
          { debit: '1500.00', credit: '0.00' },
          { debit: '0.00', credit: '500.00' },
        ]),
        save: jest.fn(async (entity, obj) => obj || entity),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockEm));

      const result = await service.mergeCustomers('tenant-1', 'user-admin', 'cust-source', {
        targetCustomerId: 'cust-target',
        reason: 'Consolidating duplicate profile created with different phone formatting',
      });

      expect(result.success).toBe(true);
      expect(result.reassignedInvoicesCount).toBe(3);
      expect(result.reassignedLedgerCount).toBe(2);
      expect(result.targetCustomer.currentBalance).toBe('1000.00'); // 1500 debit - 500 credit = 1000
      expect(sourceCust.isActive).toBe(false);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CUSTOMER_MERGED' }),
      );
    });

    it('getCustomerHistory retrieves all invoices, ledger repayments and lifetime totals', async () => {
      mockCustomerRepo.findOne.mockResolvedValueOnce({
        id: 'cust-1',
        tenantId: 'tenant-1',
        name: 'Sunita Sharma',
        creditLimit: '10000.00',
        currentBalance: '1200.00',
      });

      mockInvoiceRepo.find.mockResolvedValueOnce([
        {
          id: 'inv-1',
          invoiceNumber: 'INV-101',
          grandTotal: '2000.00',
          status: 'posted',
          paymentStatus: 'partial',
          createdAt: new Date('2026-10-01'),
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-102',
          grandTotal: '1500.00',
          status: 'posted',
          paymentStatus: 'paid',
          createdAt: new Date('2026-10-15'),
        },
      ]);

      mockCustomerLedgerRepo.find.mockResolvedValueOnce([
        {
          id: 'ledg-1',
          occurredAt: new Date('2026-10-02'),
          entryType: CustomerLedgerEntryType.PAYMENT_CREDIT,
          debit: '0.00',
          credit: '800.00',
          sourceType: 'payment',
          sourceId: 'pay-1',
          paymentMethod: 'upi',
          notes: 'Partial settlement',
        },
      ]);

      const history = await service.getCustomerHistory('tenant-1', 'cust-1');

      expect(history.lifetimeStats.totalInvoicesCount).toBe(2);
      expect(history.lifetimeStats.totalPurchasesValue).toBe('3500.00'); // 2000 + 1500
      expect(history.lifetimeStats.totalRepaymentsValue).toBe('800.00');
      expect(history.invoices.length).toBe(2);
      expect(history.ledgerEntries.length).toBe(1);
    });
  });
});
