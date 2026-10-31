import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { CustomerEntity } from './entities/customer.entity';
import { CustomerLedgerEntity } from './entities/customer-ledger.entity';
import { CashierShiftEntity } from './entities/cashier-shift.entity';
import { InvoiceEntity } from '../billing/entities/invoice.entity';
import { PaymentEntity } from '../billing/entities/payment.entity';
import { ShiftStatus } from '@pos/shared-types';

describe('OperationsService — Khata Ledger & Cash Reconciliation', () => {
  let service: OperationsService;
  let mockCustomerRepo: any;
  let mockCustomerLedgerRepo: any;
  let mockShiftRepo: any;
  let mockInvoiceRepo: any;
  let mockPaymentRepo: any;
  let mockDataSource: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationsService,
        { provide: getRepositoryToken(CustomerEntity), useValue: mockCustomerRepo },
        { provide: getRepositoryToken(CustomerLedgerEntity), useValue: mockCustomerLedgerRepo },
        { provide: getRepositoryToken(CashierShiftEntity), useValue: mockShiftRepo },
        { provide: getRepositoryToken(InvoiceEntity), useValue: mockInvoiceRepo },
        { provide: getRepositoryToken(PaymentEntity), useValue: mockPaymentRepo },
        { provide: DataSource, useValue: mockDataSource },
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
        findOne: jest.fn().mockResolvedValueOnce(mockCustomer),
        create: jest.fn((entity, data) => data),
        save: jest.fn(async (data) => data),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const result = await service.recordCustomerPayment('tenant-1', 'cust-1', {
        branchId: 'branch-1',
        amount: '500.00',
        idempotencyKey: 'repay-101',
      });

      expect(result.ledger.credit).toBe('500.00');
      expect(result.customer.currentBalance).toBe('1000.00'); // 1500 - 500 = 1000
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
});

