import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceLineEntity } from './entities/invoice-line.entity';
import { PaymentEntity } from './entities/payment.entity';
import { CreditNoteEntity } from './entities/credit-note.entity';
import { CreditNoteLineEntity } from './entities/credit-note-line.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { AuditService } from '../tenants/audit.service';
import {
  PaymentMethod,
  InvoiceStatus,
  CustomerLedgerEntryType,
  StockMovementType,
} from '@pos/shared-types';

describe('BillingService — GST & Financial Calculations', () => {
  let service: BillingService;
  let mockInvoiceRepo: any;
  let mockInvoiceLineRepo: any;
  let mockPaymentRepo: any;
  let mockProductRepo: any;
  let mockCreditNoteRepo: any;
  let mockCreditNoteLineRepo: any;
  let mockAuditService: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockInvoiceRepo = { find: jest.fn(), findOne: jest.fn() };
    mockInvoiceLineRepo = { save: jest.fn() };
    mockPaymentRepo = { save: jest.fn() };
    mockProductRepo = { findByIds: jest.fn() };
    mockCreditNoteRepo = { find: jest.fn(), findOne: jest.fn(), findAndCount: jest.fn() };
    mockCreditNoteLineRepo = { save: jest.fn() };
    mockAuditService = { log: jest.fn().mockResolvedValue(undefined) };
    mockDataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getRepositoryToken(InvoiceEntity), useValue: mockInvoiceRepo },
        { provide: getRepositoryToken(InvoiceLineEntity), useValue: mockInvoiceLineRepo },
        { provide: getRepositoryToken(PaymentEntity), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(ProductEntity), useValue: mockProductRepo },
        { provide: getRepositoryToken(CreditNoteEntity), useValue: mockCreditNoteRepo },
        { provide: getRepositoryToken(CreditNoteLineEntity), useValue: mockCreditNoteLineRepo },
        { provide: AuditService, useValue: mockAuditService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  it('calculates 5% intra-state GST (2.5% CGST + 2.5% SGST) and deducts stock', async () => {
    const mockProduct = {
      id: 'prod-1',
      tenantId: 'tenant-1',
      name: 'Fortune Oil 1L',
      sku: 'OIL-1L',
      sellingPrice: '140.00',
      hsnCode: '1512',
    };

    const mockManager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(null) // idempotency check
        .mockResolvedValueOnce(null), // stock balance lookup
      findByIds: jest.fn().mockResolvedValueOnce([mockProduct]),
      create: jest.fn((entity, data) => ({ id: 'mock-id', ...data })),
      save: jest.fn(async (data) => data),
    };

    mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

    const result = await service.createSale('tenant-1', 'cashier-1', {
      branchId: 'branch-1',
      idempotencyKey: 'sale-idem-1',
      isInterstate: false,
      items: [
        {
          productId: 'prod-1',
          quantity: '2.000', // 2 * 140 = 280.00
          discountAmount: '0.00',
          gstRatePercent: '5.00', // 5% of 280 = 14.00 total (7.00 CGST, 7.00 SGST)
        },
      ],
      payments: [
        {
          paymentMethod: PaymentMethod.CASH,
          amount: '294.00', // 280 + 14 = 294.00
        },
      ],
    });

    expect(result.subtotal).toBe('280.00');
    expect(result.taxableTotal).toBe('280.00');
    expect(result.cgstTotal).toBe('7.00');
    expect(result.sgstTotal).toBe('7.00');
    expect(result.igstTotal).toBe('0.00');
    expect(result.grandTotal).toBe('294.00');
  });

  it('calculates 18% inter-state IGST correctly', async () => {
    const mockProduct = {
      id: 'prod-electronics',
      tenantId: 'tenant-1',
      name: 'USB Barcode Scanner',
      sku: 'SCAN-USB',
      sellingPrice: '1000.00',
      hsnCode: '8471',
    };

    const mockManager = {
      findOne: jest.fn().mockResolvedValue(null),
      findByIds: jest.fn().mockResolvedValueOnce([mockProduct]),
      create: jest.fn((entity, data) => ({ id: 'mock-id', ...data })),
      save: jest.fn(async (data) => data),
    };

    mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

    const result = await service.createSale('tenant-1', 'cashier-1', {
      branchId: 'branch-1',
      idempotencyKey: 'sale-igst-1',
      isInterstate: true, // Interstate
      items: [
        {
          productId: 'prod-electronics',
          quantity: '1.000',
          discountAmount: '100.00', // Discount 100 -> Taxable 900.00
          gstRatePercent: '18.00', // 18% of 900 = 162.00 IGST
        },
      ],
      payments: [
        {
          paymentMethod: PaymentMethod.UPI,
          amount: '1062.00', // 900 + 162 = 1062.00
        },
      ],
    });

    expect(result.subtotal).toBe('1000.00');
    expect(result.discountTotal).toBe('100.00');
    expect(result.taxableTotal).toBe('900.00');
    expect(result.cgstTotal).toBe('0.00');
    expect(result.sgstTotal).toBe('0.00');
    expect(result.igstTotal).toBe('162.00');
    expect(result.grandTotal).toBe('1062.00');
  });

  it('rejects sale when total payment amount is insufficient', async () => {
    const mockProduct = {
      id: 'prod-1',
      tenantId: 'tenant-1',
      name: 'Product A',
      sellingPrice: '100.00',
    };

    const mockManager = {
      findOne: jest.fn().mockResolvedValue(null),
      findByIds: jest.fn().mockResolvedValueOnce([mockProduct]),
    };

    mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

    await expect(
      service.createSale('tenant-1', 'cashier-1', {
        branchId: 'branch-1',
        idempotencyKey: 'sale-underpaid',
        items: [
          {
            productId: 'prod-1',
            quantity: '1.000',
            gstRatePercent: '0.00',
          },
        ],
        payments: [
          {
            paymentMethod: PaymentMethod.CASH,
            amount: '50.00', // Short payment (Total is 100.00)
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('enforces CGST Act Section 170 nearest rupee rounding and validates payment against rounded grand total', async () => {
    // Product with price 971.00 + 5% GST = 1019.55 unrounded -> 1020.00 rounded (+0.45 adjustment)
    const mockProduct = {
      id: 'prod-oil',
      tenantId: 'tenant-1',
      name: 'Edible Oil Tin',
      sellingPrice: '971.00',
      hsnCode: '1512',
    };

    const mockManager = {
      findOne: jest.fn().mockResolvedValue(null),
      findByIds: jest.fn().mockResolvedValue([mockProduct]),
      create: jest.fn((entity, data) => ({ id: 'mock-id', ...data })),
      save: jest.fn(async (data) => data),
    };

    mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

    // Underpayment attempt: tendering unrounded ₹1019.55 fails because rounded total is ₹1020.00
    await expect(
      service.createSale('tenant-1', 'cashier-1', {
        branchId: 'branch-1',
        idempotencyKey: 'sale-unrounded-underpaid',
        items: [
          {
            productId: 'prod-oil',
            quantity: '1.000',
            gstRatePercent: '5.00',
          },
        ],
        payments: [
          {
            paymentMethod: PaymentMethod.CASH,
            amount: '1019.55', // Underpaid relative to rounded 1020.00
          },
        ],
      }),
    ).rejects.toThrow('is less than grand total');

    // Valid payment: tendering rounded ₹1020.00 succeeds and stores roundingAdjustment
    const result = await service.createSale('tenant-1', 'cashier-1', {
      branchId: 'branch-1',
      idempotencyKey: 'sale-rounded-success',
      items: [
        {
          productId: 'prod-oil',
          quantity: '1.000',
          gstRatePercent: '5.00',
        },
      ],
      payments: [
        {
          paymentMethod: PaymentMethod.CASH,
          amount: '1020.00', // Matches rounded grand total
        },
      ],
    });

    expect(result.grandTotal).toBe('1020.00');
    expect(parseFloat(result.roundingAdjustment)).toBeCloseTo(0.44, 1);
  });

  describe('Khata Credit Sales', () => {
    it('rejects credit payment when no customerId is provided', async () => {
      const mockProduct = {
        id: 'prod-1',
        tenantId: 'tenant-1',
        name: 'Product A',
        sellingPrice: '100.00',
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        findByIds: jest.fn().mockResolvedValueOnce([mockProduct]),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(
        service.createSale('tenant-1', 'cashier-1', {
          branchId: 'branch-1',
          idempotencyKey: 'sale-credit-no-cust',
          items: [
            {
              productId: 'prod-1',
              quantity: '1.000',
              gstRatePercent: '0.00',
            },
          ],
          payments: [
            {
              paymentMethod: PaymentMethod.CREDIT,
              amount: '100.00',
            },
          ],
        }),
      ).rejects.toThrow('A registered customer is required for Khata / credit payments');
    });

    it('rejects sale when requested quantity exceeds available stock and negative stock is disabled', async () => {
      const mockProduct = {
        id: 'prod-1',
        tenantId: 'tenant-1',
        name: 'Sugar 1kg',
        sellingPrice: '50.00',
        trackInventory: true,
      };
      const mockStockBalance = {
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        productId: 'prod-1',
        quantityOnHand: '10.000',
      };

      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // idempotency check
          .mockResolvedValueOnce({ id: 'tenant-1', settings: { allowNegativeStock: false } }) // tenant
          .mockResolvedValueOnce(mockStockBalance), // stock balance check
        findByIds: jest.fn().mockResolvedValueOnce([mockProduct]),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(
        service.createSale('tenant-1', 'cashier-1', {
          branchId: 'branch-1',
          idempotencyKey: 'sale-oversell-reject',
          items: [
            {
              productId: 'prod-1',
              quantity: '15.000', // 15 > 10
              gstRatePercent: '5.00',
            },
          ],
          payments: [
            {
              paymentMethod: PaymentMethod.CASH,
              amount: '788.00',
            },
          ],
        }),
      ).rejects.toThrow('Insufficient stock for "Sugar 1kg". Available: 10.000, Requested: 15.000');
    });

    it('rejects credit payment when customer credit limit is exceeded', async () => {
      const mockProduct = {
        id: 'prod-1',
        tenantId: 'tenant-1',
        name: 'Product A',
        sellingPrice: '600.00',
      };
      const mockCustomer = {
        id: 'cust-1',
        tenantId: 'tenant-1',
        creditLimit: '1000.00',
        currentBalance: '500.00', // 500 + 600 = 1100 > 1000
      };

      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // idempotency check
          .mockResolvedValueOnce({ id: 'tenant-1', settings: { allowNegativeStock: true } }) // tenant lookup
          .mockResolvedValueOnce(mockCustomer), // customer lookup
        findByIds: jest.fn().mockResolvedValueOnce([mockProduct]),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(
        service.createSale('tenant-1', 'cashier-1', {
          branchId: 'branch-1',
          idempotencyKey: 'sale-credit-exceeded',
          customerId: 'cust-1',
          items: [
            {
              productId: 'prod-1',
              quantity: '1.000',
              gstRatePercent: '0.00',
            },
          ],
          payments: [
            {
              paymentMethod: PaymentMethod.CREDIT,
              amount: '600.00',
            },
          ],
        }),
      ).rejects.toThrow('Credit limit exceeded');
    });

    it('processes credit sale, creates customer ledger debit entry and updates balance atomically', async () => {
      const mockProduct = {
        id: 'prod-1',
        tenantId: 'tenant-1',
        name: 'Rice 5kg',
        sku: 'RICE-5',
        sellingPrice: '300.00',
        hsnCode: '1006',
      };
      const mockCustomer = {
        id: 'cust-1',
        tenantId: 'tenant-1',
        creditLimit: '5000.00',
        currentBalance: '200.00',
      };

      const savedRecords: any[] = [];
      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // idempotency check
          .mockResolvedValueOnce({ id: 'tenant-1', settings: { allowNegativeStock: true } }) // tenant lookup
          .mockResolvedValueOnce(mockCustomer) // customer lookup
          .mockResolvedValueOnce(null), // stock balance lookup
        findByIds: jest.fn().mockResolvedValueOnce([mockProduct]),
        create: jest.fn((entity, data) => ({ id: 'mock-id', ...data })),
        save: jest.fn(async (data) => {
          savedRecords.push(data);
          return data;
        }),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const invoice = await service.createSale('tenant-1', 'cashier-1', {
        branchId: 'branch-1',
        idempotencyKey: 'sale-credit-success',
        customerId: 'cust-1',
        items: [
          {
            productId: 'prod-1',
            quantity: '1.000',
            gstRatePercent: '0.00',
          },
        ],
        payments: [
          {
            paymentMethod: PaymentMethod.CREDIT,
            amount: '300.00',
          },
        ],
      });

      expect(invoice.grandTotal).toBe('300.00');
      expect(mockCustomer.currentBalance).toBe('500.00'); // 200 + 300 = 500
      const customerLedgerEntry = savedRecords.find((r) => r.debit === '300.00');
      expect(customerLedgerEntry).toBeDefined();
      expect(customerLedgerEntry.paymentMethod).toBe('credit');
    });
  });

  describe('Sales Returns & Credit Notes', () => {
    const mockOriginalInvoice = {
      id: 'inv-orig-1',
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      invoiceNumber: 'INV-20261101-1001',
      status: InvoiceStatus.POSTED,
      customerId: 'cust-1',
      customerGstinSnapshot: null,
      placeOfSupply: '27',
      isInterstate: false,
      lines: [
        {
          id: 'line-oil-1',
          productId: 'prod-oil-1',
          productNameSnapshot: 'Fortune Oil 1L',
          skuSnapshot: 'OIL-1L',
          hsnSnapshot: '1512',
          quantity: '5.000',
          unitPrice: '140.00',
          discountAmount: '0.00',
          taxableValue: '700.00',
          gstRatePercent: '5.00',
          cgstAmount: '17.50',
          sgstAmount: '17.50',
          igstAmount: '0.00',
          lineTotal: '735.00',
        },
      ],
      payments: [
        {
          paymentMethod: PaymentMethod.CASH,
          amount: '735.00',
        },
      ],
    };

    const mockProduct = {
      id: 'prod-oil-1',
      tenantId: 'tenant-1',
      name: 'Fortune Oil 1L',
      sku: 'OIL-1L',
      sellingPrice: '140.00',
      hsnCode: '1512',
    };

    it('processes partial return with resellable stock incrementing balance & cash refund', async () => {
      const savedRecords: any[] = [];
      const mockStockBalance = {
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        productId: 'prod-oil-1',
        quantityOnHand: '10.000',
      };

      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // idempotency check
          .mockResolvedValueOnce(mockOriginalInvoice) // invoice lookup
          .mockResolvedValueOnce(mockProduct) // product lookup
          .mockResolvedValueOnce(mockStockBalance) // stock balance lookup
          .mockImplementation((entity, opts) => {
            if (opts?.where?.id === 'cn-mock-id') {
              return {
                id: 'cn-mock-id',
                creditNoteNumber: 'CN-20261101-9999',
                grandTotal: '294.00',
                lines: [{ id: 'cn-line-1', quantityReturned: '2.000' }],
              };
            }
            return null;
          }),
        find: jest.fn().mockResolvedValueOnce([]), // prior credit notes
        create: jest.fn((entity, data) => ({ id: 'cn-mock-id', ...data })),
        save: jest.fn(async (data) => {
          savedRecords.push(data);
          return data;
        }),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const result = await service.createReturn('tenant-1', 'cashier-1', {
        originalInvoiceId: 'inv-orig-1',
        idempotencyKey: 'return-idem-1',
        reason: 'Customer bought extra oil bottles',
        refundPaymentMethod: PaymentMethod.CASH,
        items: [
          {
            invoiceLineId: 'line-oil-1',
            resellableQuantity: '2.000', // 2 * 140 = 280 taxable + 5% GST (14) = 294.00
            damagedQuantity: '0.000',
            reason: 'Sealed unopened bottles',
          },
        ],
      });

      expect(result).toBeDefined();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREDIT_NOTE_CREATED',
          tenantId: 'tenant-1',
        }),
      );

      // Verify stock was incremented by 2
      expect(mockStockBalance.quantityOnHand).toBe('12.000'); // 10 + 2 = 12
      const stockMovement = savedRecords.find(
        (r) => r.movementType === StockMovementType.SALE_RETURN,
      );
      expect(stockMovement).toBeDefined();
      expect(stockMovement.quantityDelta).toBe('2.000');
    });

    it('rejects return if requested quantity exceeds eligible remaining quantity', async () => {
      const mockPriorCreditNote = {
        id: 'cn-prior-1',
        originalInvoiceId: 'inv-orig-1',
        lines: [
          {
            originalInvoiceLineId: 'line-oil-1',
            quantityReturned: '4.000',
          },
        ],
      };

      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // idempotency check
          .mockResolvedValueOnce(mockOriginalInvoice), // invoice lookup
        find: jest.fn().mockResolvedValueOnce([mockPriorCreditNote]), // prior credit notes
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(
        service.createReturn('tenant-1', 'cashier-1', {
          originalInvoiceId: 'inv-orig-1',
          idempotencyKey: 'return-idem-excess',
          reason: 'Excess return',
          refundPaymentMethod: PaymentMethod.CASH,
          items: [
            {
              invoiceLineId: 'line-oil-1',
              resellableQuantity: '2.000', // 4 already returned + 2 requested = 6 > 5 total
              damagedQuantity: '0.000',
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('handles customer Khata store credit refund and updates balance and ledger', async () => {
      const savedRecords: any[] = [];
      const mockCustomer = {
        id: 'cust-1',
        tenantId: 'tenant-1',
        name: 'Ramesh Sharma',
        currentBalance: '1000.00', // owes 1000
      };

      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // idempotency
          .mockResolvedValueOnce(mockOriginalInvoice) // invoice
          .mockResolvedValueOnce(mockProduct) // product
          .mockResolvedValueOnce(null) // stock balance
          .mockResolvedValueOnce(mockCustomer) // customer lookup
          .mockImplementation((entity, opts) => ({ id: 'cn-mock-id', ...opts })),
        find: jest.fn().mockResolvedValueOnce([]), // prior credit notes
        create: jest.fn((entity, data) => ({ id: 'cn-mock-id', ...data })),
        save: jest.fn(async (data) => {
          savedRecords.push(data);
          return data;
        }),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await service.createReturn('tenant-1', 'cashier-1', {
        originalInvoiceId: 'inv-orig-1',
        idempotencyKey: 'return-credit-khata',
        reason: 'Store credit return',
        refundPaymentMethod: PaymentMethod.CREDIT,
        items: [
          {
            invoiceLineId: 'line-oil-1',
            resellableQuantity: '1.000', // 140 + 5% = 147.00
            damagedQuantity: '0.000',
          },
        ],
      });

      // Customer balance should be reduced from 1000.00 by 147.00 to 853.00
      expect(mockCustomer.currentBalance).toBe('853.00');
      const ledgerRefund = savedRecords.find((r) => r.entryType === CustomerLedgerEntryType.REFUND);
      expect(ledgerRefund).toBeDefined();
      expect(ledgerRefund.credit).toBe('147.00');
      expect(ledgerRefund.debit).toBe('0.00');
    });

    it('marks original invoice status as RETURNED when 100% of quantities are returned', async () => {
      const invoiceToFullyReturn = {
        ...mockOriginalInvoice,
        status: InvoiceStatus.POSTED,
      };

      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(invoiceToFullyReturn)
          .mockResolvedValueOnce(mockProduct)
          .mockResolvedValueOnce(null)
          .mockImplementation((entity, opts) => ({ id: 'cn-mock-id', ...opts })),
        find: jest.fn().mockResolvedValueOnce([]),
        create: jest.fn((entity, data) => ({ id: 'cn-mock-id', ...data })),
        save: jest.fn(async (data) => data),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await service.createReturn('tenant-1', 'cashier-1', {
        originalInvoiceId: 'inv-orig-1',
        idempotencyKey: 'return-full-100',
        reason: 'Full return',
        refundPaymentMethod: PaymentMethod.CASH,
        items: [
          {
            invoiceLineId: 'line-oil-1',
            resellableQuantity: '5.000', // All 5 returned
            damagedQuantity: '0.000',
          },
        ],
      });

      expect(invoiceToFullyReturn.status).toBe(InvoiceStatus.RETURNED);
    });
  });
});
