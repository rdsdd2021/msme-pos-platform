import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GstReportingService, getB2clInvoiceThreshold } from './gst-reporting.service';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceLineEntity } from './entities/invoice-line.entity';
import { BranchEntity } from '../tenants/entities/branch.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { CustomerEntity } from '../operations/entities/customer.entity';
import { SupplierEntity } from '../catalog/entities/supplier.entity';
import { SupplierInvoiceEntity } from '../catalog/entities/supplier-invoice.entity';
import { SupplierInvoiceLineEntity } from '../catalog/entities/supplier-invoice-line.entity';
import { InvoiceStatus } from '@pos/shared-types';

describe('GstReportingService', () => {
  let service: GstReportingService;

  const mockTenant = {
    id: 'tenant-123',
    legalName: 'Kirana Store Pvt Ltd',
    displayName: 'Kirana Store',
  };
  const mockBranch = {
    id: 'branch-123',
    name: 'Main Branch',
    gstin: '27AABCK1234F1Z5',
    stateCode: '27',
  };
  const mockCustomerB2B = { id: 'cust-b2b', name: 'Acme Retailers', gstin: '27ABCDE1234F1Z5' };

  const mockInvoiceRepo = {
    createQueryBuilder: jest.fn(),
  };
  const mockInvoiceLineRepo = {};
  const mockBranchRepo = {
    findOne: jest.fn().mockResolvedValue(mockBranch),
    findBy: jest.fn().mockResolvedValue([mockBranch]),
  };
  const mockTenantRepo = {
    findOne: jest.fn().mockResolvedValue(mockTenant),
  };
  const mockCustomerRepo = {
    findBy: jest.fn().mockResolvedValue([mockCustomerB2B]),
  };
  const mockSupplierRepo = {
    findOne: jest.fn(),
  };
  const mockSupplierInvoiceRepo = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto) => ({ id: 'si-1', ...dto })),
    save: jest.fn().mockImplementation((inv) => Promise.resolve({ id: 'si-1', ...inv })),
  };
  const mockSupplierInvoiceLineRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GstReportingService,
        { provide: getRepositoryToken(InvoiceEntity), useValue: mockInvoiceRepo },
        { provide: getRepositoryToken(InvoiceLineEntity), useValue: mockInvoiceLineRepo },
        { provide: getRepositoryToken(BranchEntity), useValue: mockBranchRepo },
        { provide: getRepositoryToken(TenantEntity), useValue: mockTenantRepo },
        { provide: getRepositoryToken(CustomerEntity), useValue: mockCustomerRepo },
        { provide: getRepositoryToken(SupplierEntity), useValue: mockSupplierRepo },
        { provide: getRepositoryToken(SupplierInvoiceEntity), useValue: mockSupplierInvoiceRepo },
        {
          provide: getRepositoryToken(SupplierInvoiceLineEntity),
          useValue: mockSupplierInvoiceLineRepo,
        },
      ],
    }).compile();

    service = module.get<GstReportingService>(GstReportingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGstr1Report', () => {
    it('correctly partitions B2B, B2CL, and B2CS supplies and generates HSN summary', async () => {
      const mockInvoices: any[] = [
        // 1. B2B Invoice
        {
          id: 'inv-1',
          invoiceNumber: 'INV-20261015-0001',
          tenantId: 'tenant-123',
          branchId: 'branch-123',
          status: InvoiceStatus.POSTED,
          customerId: 'cust-b2b',
          customerGstinSnapshot: '27ABCDE1234F1Z5',
          placeOfSupply: '27',
          isInterstate: false,
          grandTotal: '1180.00',
          createdAt: new Date('2026-10-15T10:00:00Z'),
          lines: [
            {
              productNameSnapshot: 'Atta 10kg',
              hsnSnapshot: '1101',
              quantity: '2.000',
              taxableValue: '1000.00',
              gstRatePercent: '18.00',
              cgstAmount: '90.00',
              sgstAmount: '90.00',
              igstAmount: '0.00',
              lineTotal: '1180.00',
            },
          ],
        },
        // 2. B2C Small Invoice (Intra-state)
        {
          id: 'inv-2',
          invoiceNumber: 'INV-20261016-0002',
          tenantId: 'tenant-123',
          branchId: 'branch-123',
          status: InvoiceStatus.POSTED,
          customerId: null,
          customerGstinSnapshot: null,
          placeOfSupply: '27',
          isInterstate: false,
          grandTotal: '105.00',
          createdAt: new Date('2026-10-16T12:00:00Z'),
          lines: [
            {
              productNameSnapshot: 'Sugar 1kg',
              hsnSnapshot: '1701',
              quantity: '1.000',
              taxableValue: '100.00',
              gstRatePercent: '5.00',
              cgstAmount: '2.50',
              sgstAmount: '2.50',
              igstAmount: '0.00',
              lineTotal: '105.00',
            },
          ],
        },
        // 3. B2C Large Invoice (Inter-state unregistered > ₹2,50,000)
        {
          id: 'inv-3',
          invoiceNumber: 'INV-20261017-0003',
          tenantId: 'tenant-123',
          branchId: 'branch-123',
          status: InvoiceStatus.POSTED,
          customerId: null,
          customerGstinSnapshot: null,
          placeOfSupply: '29', // Karnataka
          isInterstate: true,
          grandTotal: '300000.00',
          createdAt: new Date('2026-10-17T15:00:00Z'),
          lines: [
            {
              productNameSnapshot: 'Bulk Basmati Rice',
              hsnSnapshot: '1006',
              quantity: '50.000',
              taxableValue: '285714.28',
              gstRatePercent: '5.00',
              cgstAmount: '0.00',
              sgstAmount: '0.00',
              igstAmount: '14285.72',
              lineTotal: '300000.00',
            },
          ],
        },
      ];

      const qbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockInvoices),
      };
      mockInvoiceRepo.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.getGstr1Report('tenant-123', {
        from: '2026-10-01',
        to: '2026-10-31',
      });

      expect(result).toBeDefined();
      expect(result.summary.totalInvoices).toBe(3);

      // B2B Table 4 validation
      expect(result.b2b.length).toBe(1);
      expect(result.b2b[0].customerGstin).toBe('27ABCDE1234F1Z5');
      expect(result.b2b[0].taxableValue).toBe('1000.00');
      expect(result.b2b[0].cgstAmount).toBe('90.00');
      expect(result.b2b[0].sgstAmount).toBe('90.00');

      // B2C Large Table 5 validation
      expect(result.b2cl.length).toBe(1);
      expect(result.b2cl[0].invoiceNumber).toBe('INV-20261017-0003');
      expect(result.b2cl[0].placeOfSupply).toBe('29');
      expect(result.b2cl[0].igstAmount).toBe('14285.72');

      // B2C Small Table 7 validation
      expect(result.b2cs.length).toBe(1);
      expect(result.b2cs[0].placeOfSupply).toBe('27');
      expect(result.b2cs[0].rate).toBe('5.00');
      expect(result.b2cs[0].taxableValue).toBe('100.00');

      // HSN Summary Table 12 validation
      expect(result.hsnSummary.length).toBe(3);
      const hsnCodes = result.hsnSummary.map((h: any) => h.hsnCode);
      expect(hsnCodes).toContain('1101');
      expect(hsnCodes).toContain('1701');
      expect(hsnCodes).toContain('1006');

      // Statutory disclaimer included
      expect(result.statutoryDisclaimer).toContain('GST Common Portal');
    });

    it('applies Notification No. 12/2024-Central Tax threshold correctly based on invoice return period', async () => {
      const preAugDate = new Date('2024-05-15T10:00:00+05:30');
      expect(getB2clInvoiceThreshold(preAugDate)).toBe(250000);

      const postAugDate = new Date('2024-08-15T10:00:00+05:30');
      expect(getB2clInvoiceThreshold(postAugDate)).toBe(100000);

      const mockInvoices: any[] = [
        {
          id: 'inv-pre',
          invoiceNumber: 'INV-PRE-AUG',
          tenantId: 'tenant-123',
          branchId: 'branch-123',
          status: InvoiceStatus.POSTED,
          customerId: null,
          customerGstinSnapshot: null,
          placeOfSupply: '29',
          isInterstate: true,
          grandTotal: '150000.00',
          createdAt: preAugDate,
          lines: [
            {
              productNameSnapshot: 'Commercial Flour',
              hsnSnapshot: '1101',
              quantity: '50.000',
              taxableValue: '142857.14',
              gstRatePercent: '5.00',
              cgstAmount: '0.00',
              sgstAmount: '0.00',
              igstAmount: '7142.86',
              lineTotal: '150000.00',
            },
          ],
        },
        {
          id: 'inv-post',
          invoiceNumber: 'INV-POST-AUG',
          tenantId: 'tenant-123',
          branchId: 'branch-123',
          status: InvoiceStatus.POSTED,
          customerId: null,
          customerGstinSnapshot: null,
          placeOfSupply: '29',
          isInterstate: true,
          grandTotal: '150000.00',
          createdAt: postAugDate,
          lines: [
            {
              productNameSnapshot: 'Commercial Flour',
              hsnSnapshot: '1101',
              quantity: '50.000',
              taxableValue: '142857.14',
              gstRatePercent: '5.00',
              cgstAmount: '0.00',
              sgstAmount: '0.00',
              igstAmount: '7142.86',
              lineTotal: '150000.00',
            },
          ],
        },
        {
          id: 'inv-intra',
          invoiceNumber: 'INV-INTRA-LARGE',
          tenantId: 'tenant-123',
          branchId: 'branch-123',
          status: InvoiceStatus.POSTED,
          customerId: null,
          customerGstinSnapshot: null,
          placeOfSupply: '27',
          isInterstate: false,
          grandTotal: '500000.00',
          createdAt: postAugDate,
          lines: [
            {
              productNameSnapshot: 'Store Supplies',
              hsnSnapshot: '1905',
              quantity: '100.000',
              taxableValue: '476190.48',
              gstRatePercent: '5.00',
              cgstAmount: '11904.76',
              sgstAmount: '11904.76',
              igstAmount: '0.00',
              lineTotal: '500000.00',
            },
          ],
        },
      ];

      const qbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockInvoices),
      };
      mockInvoiceRepo.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.getGstr1Report('tenant-123', {
        from: '2024-05-01',
        to: '2024-09-01',
      });

      // B2CL Table 5 should ONLY contain the post-August invoice
      expect(result.b2cl.length).toBe(1);
      expect(result.b2cl[0].invoiceNumber).toBe('INV-POST-AUG');
      expect(result.b2cl[0].notification).toBe('Notification No. 12/2024-Central Tax');

      // Table 7 B2CS should contain the pre-August invoice and the large intra-state invoice
      expect(result.b2cs.length).toBe(2);
      const pos29Entry = result.b2cs.find((e: any) => e.placeOfSupply === '29');
      expect(pos29Entry).toBeDefined();
      expect(pos29Entry?.taxableValue).toBe('142857.14');

      const pos27Entry = result.b2cs.find((e: any) => e.placeOfSupply === '27');
      expect(pos27Entry).toBeDefined();
      expect(pos27Entry?.taxableValue).toBe('476190.48');
    });

    it('returns UNREGISTERED and warning when branch GSTIN is not configured', async () => {
      mockBranchRepo.findOne.mockResolvedValueOnce({
        id: 'branch-unreg',
        name: 'Unregistered Branch',
        gstin: null,
        stateCode: '27',
      });

      const qbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockInvoiceRepo.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.getGstr1Report('tenant-123', {
        month: 10,
        year: 2026,
        branchId: 'branch-unreg',
      });

      expect(result.gstin).toBe('UNREGISTERED');
      expect(result.isGstinConfigured).toBe(false);
      expect(result.gstinWarning).toBeDefined();
      expect(result.gstinWarning).toContain('Branch GSTIN is not configured');
    });
  });

  describe('getGstr3bReport', () => {
    it('calculates Table 3.1 outward liabilities, Table 4 eligible ITC and net cash payable', async () => {
      const mockOutwardInvoices: any[] = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-1',
          tenantId: 'tenant-123',
          branchId: 'branch-123',
          status: InvoiceStatus.POSTED,
          isInterstate: false,
          createdAt: new Date('2026-10-10'),
          lines: [
            {
              productNameSnapshot: 'Soap',
              hsnSnapshot: '3401',
              taxableValue: '10000.00',
              gstRatePercent: '18.00',
              cgstAmount: '900.00',
              sgstAmount: '900.00',
              igstAmount: '0.00',
            },
          ],
        },
      ];

      const mockSupplierInvoices: any[] = [
        {
          id: 'si-1',
          supplierInvoiceNumber: 'VEN-001',
          subtotal: '5000.00',
          cgstAmount: '450.00',
          sgstAmount: '450.00',
          igstAmount: '0.00',
          totalAmount: '5900.00',
          isItcEligible: true,
          isReverseCharge: false,
          supplier: {
            id: 'sup-1',
            name: 'Wholesale Distributor',
            gstin: '27AABCS1234F1Z1',
          },
        },
        {
          id: 'si-2',
          supplierInvoiceNumber: 'VEN-002-BLOCKED',
          subtotal: '2000.00',
          cgstAmount: '180.00',
          sgstAmount: '180.00',
          igstAmount: '0.00',
          totalAmount: '2360.00',
          isItcEligible: false,
          ineligibilityReason: 'Section 17(5) food & beverages',
          isReverseCharge: false,
          supplier: {
            id: 'sup-2',
            name: 'Office Pantry Supplies',
            gstin: '27AABCP9999F1Z2',
          },
        },
      ];

      const invQbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOutwardInvoices),
      };
      mockInvoiceRepo.createQueryBuilder.mockReturnValue(invQbMock);

      const supQbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockSupplierInvoices),
      };
      mockSupplierInvoiceRepo.createQueryBuilder.mockReturnValue(supQbMock);

      const result = await service.getGstr3bReport('tenant-123', {
        month: 10,
        year: 2026,
      });

      expect(result).toBeDefined();

      // Table 3.1 Outward Liability
      expect(result.table31.outwardTaxableSupplies.taxableValue).toBe('10000.00');
      expect(result.table31.outwardTaxableSupplies.cgst).toBe('900.00');
      expect(result.table31.outwardTaxableSupplies.sgst).toBe('900.00');

      // Table 4 Eligible ITC
      expect(result.table4.itcAvailable.allOtherItc.cgst).toBe('450.00');
      expect(result.table4.itcAvailable.allOtherItc.sgst).toBe('450.00');

      // Table 4 Ineligible ITC (Section 17(5))
      expect(result.table4.ineligibleItc.section17_5.cgst).toBe('180.00');
      expect(result.table4.ineligibleItc.section17_5.sgst).toBe('180.00');

      // Net Cash Payable: 900 CGST liability - 450 ITC = 450 cash payable
      expect(result.taxSettlement.netCashPayable.cgst).toBe('450.00');
      expect(result.taxSettlement.netCashPayable.sgst).toBe('450.00');
      expect(result.taxSettlement.netCashPayable.total).toBe('900.00');
    });
  });
});
