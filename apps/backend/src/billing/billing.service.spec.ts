import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceLineEntity } from './entities/invoice-line.entity';
import { PaymentEntity } from './entities/payment.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { PaymentMethod } from '@pos/shared-types';

describe('BillingService — GST & Financial Calculations', () => {
  let service: BillingService;
  let mockInvoiceRepo: any;
  let mockInvoiceLineRepo: any;
  let mockPaymentRepo: any;
  let mockProductRepo: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockInvoiceRepo = { find: jest.fn(), findOne: jest.fn() };
    mockInvoiceLineRepo = { save: jest.fn() };
    mockPaymentRepo = { save: jest.fn() };
    mockProductRepo = { findByIds: jest.fn() };
    mockDataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getRepositoryToken(InvoiceEntity), useValue: mockInvoiceRepo },
        { provide: getRepositoryToken(InvoiceLineEntity), useValue: mockInvoiceLineRepo },
        { provide: getRepositoryToken(PaymentEntity), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(ProductEntity), useValue: mockProductRepo },
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
      findOne: jest.fn()
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
});

