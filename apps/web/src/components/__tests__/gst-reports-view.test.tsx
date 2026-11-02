import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GstReportsView } from '../gst-reports-view';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => {
  const actual = jest.requireActual('@/lib/api-client');
  return {
    ...actual,
    apiClient: {
      getGstr1Report: jest.fn(),
      getGstr3bReport: jest.fn(),
      getSalesRegister: jest.fn(),
      getSupplierInvoices: jest.fn(),
      recordSupplierInvoice: jest.fn(),
    },
  };
});

describe('GstReportsView Component', () => {
  const mockBranches = [
    { id: 'branch-1', tenantId: 'tenant-1', code: 'BR-001', name: 'Main Branch', gstin: '27AABCK1234F1Z5', isActive: true },
  ] as any;
  const mockSuppliers = [
    { id: 'sup-1', tenantId: 'tenant-1', name: 'Fresh Foods Wholesale', gstin: '27AABCF1234F1Z1', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  ] as any;
  const mockProducts = [
    { id: 'prod-1', tenantId: 'tenant-1', name: 'Atta 10kg', sku: 'GROC-ATTA-10', sellingPrice: '450.00', purchaseCost: '380.00', gstRatePercent: '5.00', hsnCode: '1101', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  ] as any;

  const mockGstr1 = {
    gstin: '27AABCK1234F1Z5',
    legalName: 'Kirana Store Pvt Ltd',
    branchName: 'Main Branch',
    taxPeriod: '10/2026',
    statutoryDisclaimer: 'Statutory GST Filing Notice: Generated from immutable snapshots.',
    summary: {
      totalInvoices: 2,
      totalTaxableValue: '1100.00',
      totalCgst: '45.00',
      totalSgst: '45.00',
      totalIgst: '0.00',
      totalTax: '90.00',
      totalInvoiceValue: '1190.00',
    },
    b2b: [
      {
        customerGstin: '27ABCDE1234F1Z5',
        customerName: 'Acme Traders',
        invoiceNumber: 'INV-20261015-0001',
        invoiceDate: '2026-10-15',
        invoiceValue: '1190.00',
        placeOfSupply: '27',
        reverseCharge: 'N',
        invoiceType: 'Regular B2B',
        rate: '5.00',
        taxableValue: '1000.00',
        cgstAmount: '25.00',
        sgstAmount: '25.00',
        igstAmount: '0.00',
      },
    ],
    b2cl: [],
    b2cs: [
      {
        placeOfSupply: '27',
        supplyType: 'Intra-State',
        rate: '5.00',
        taxableValue: '100.00',
        cgstAmount: '2.50',
        sgstAmount: '2.50',
        igstAmount: '0.00',
        totalTax: '5.00',
      },
    ],
    hsnSummary: [
      {
        hsnCode: '1101',
        description: 'Atta 10kg',
        uqc: 'NOS',
        totalQuantity: '2.000',
        totalValue: '1190.00',
        taxableValue: '1000.00',
        cgstAmount: '25.00',
        sgstAmount: '25.00',
        igstAmount: '0.00',
      },
    ],
    docSummary: {
      documentType: 'Invoices for outward supply',
      fromSerial: 'INV-0001',
      toSerial: 'INV-0002',
      totalIssued: 2,
      cancelled: 0,
      netIssued: 2,
    },
  };

  const mockGstr3b = {
    gstin: '27AABCK1234F1Z5',
    legalName: 'Kirana Store Pvt Ltd',
    branchName: 'Main Branch',
    taxPeriod: '10/2026',
    statutoryDisclaimer: 'Statutory GST Filing Notice.',
    table31: {
      outwardTaxableSupplies: {
        taxableValue: '1100.00',
        igst: '0.00',
        cgst: '45.00',
        sgst: '45.00',
        cess: '0.00',
      },
      outwardZeroRated: { taxableValue: '0.00', igst: '0.00', cgst: '0.00', sgst: '0.00', cess: '0.00' },
      otherOutwardNilExempt: { taxableValue: '0.00', igst: '0.00', cgst: '0.00', sgst: '0.00', cess: '0.00' },
      inwardLiableToReverseCharge: { taxableValue: '0.00', igst: '0.00', cgst: '0.00', sgst: '0.00', cess: '0.00' },
      nonGstOutwardSupplies: { taxableValue: '0.00', igst: '0.00', cgst: '0.00', sgst: '0.00', cess: '0.00' },
    },
    table32: [],
    table4: {
      itcAvailable: {
        importOfGoods: { igst: '0.00', cgst: '0.00', sgst: '0.00' },
        importOfServices: { igst: '0.00', cgst: '0.00', sgst: '0.00' },
        inwardReverseCharge: { igst: '0.00', cgst: '0.00', sgst: '0.00' },
        inwardFromISD: { igst: '0.00', cgst: '0.00', sgst: '0.00' },
        allOtherItc: { igst: '0.00', cgst: '20.00', sgst: '20.00' },
      },
      itcReversed: {
        rule42_43: { igst: '0.00', cgst: '0.00', sgst: '0.00' },
        others: { igst: '0.00', cgst: '0.00', sgst: '0.00' },
      },
      netItcAvailable: { igst: '0.00', cgst: '20.00', sgst: '20.00' },
      ineligibleItc: {
        section17_5: { igst: '0.00', cgst: '5.00', sgst: '5.00' },
        unregisteredSuppliers: { totalTax: '0.00' },
      },
    },
    taxSettlement: {
      outputTaxLiability: { igst: '0.00', cgst: '45.00', sgst: '45.00', total: '90.00' },
      netEligibleItc: { igst: '0.00', cgst: '20.00', sgst: '20.00', total: '40.00' },
      itcSetOff: { igst: '0.00', cgst: '20.00', sgst: '20.00', total: '40.00' },
      netCashPayable: { igst: '0.00', cgst: '25.00', sgst: '25.00', total: '50.00' },
    },
    auditWarnings: ['Invoice #INV-0002 has unregistered customer.'],
  };

  const mockSalesRegister = {
    period: '10/2026',
    totalCount: 1,
    records: [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-20261015-0001',
        date: '2026-10-15',
        branchName: 'Main Branch',
        customerName: 'Acme Traders',
        customerGstin: '27ABCDE1234F1Z5',
        placeOfSupply: '27',
        isInterstate: false,
        subtotal: '1000.00',
        discountTotal: '0.00',
        taxableTotal: '1000.00',
        cgstTotal: '25.00',
        sgstTotal: '25.00',
        igstTotal: '0.00',
        grandTotal: '1050.00',
        paymentStatus: 'PAID',
        itemCount: 1,
      },
    ],
  };

  const mockSupplierInvoices = [
    {
      id: 'si-1',
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      supplierId: 'sup-1',
      supplierInvoiceNumber: 'VEN-INV-99',
      supplierInvoiceDate: '2026-10-10T00:00:00.000Z',
      subtotal: '800.00',
      cgstAmount: '20.00',
      sgstAmount: '20.00',
      igstAmount: '0.00',
      totalAmount: '840.00',
      isItcEligible: true,
      isReverseCharge: false,
      supplier: mockSuppliers[0],
      createdAt: '2026-10-10T10:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.getGstr1Report as jest.Mock).mockResolvedValue(mockGstr1);
    (apiClient.getGstr3bReport as jest.Mock).mockResolvedValue(mockGstr3b);
    (apiClient.getSalesRegister as jest.Mock).mockResolvedValue(mockSalesRegister);
    (apiClient.getSupplierInvoices as jest.Mock).mockResolvedValue(mockSupplierInvoices);
  });

  it('renders GSTR-1 preparation view with summary KPIs and B2B table', async () => {
    render(
      <GstReportsView
        tenantId="tenant-1"
        branches={mockBranches}
        suppliers={mockSuppliers}
        products={mockProducts}
        activeBranchId="branch-1"
      />,
    );

    // Verify loading disappears and title appears
    await waitFor(() => {
      expect(screen.getByText('GST Statutory Reporting & Returns Preparation')).toBeInTheDocument();
      expect(screen.queryByText('Computing GST return tables from immutable transaction ledger...')).not.toBeInTheDocument();
    });

    // Check GSTR-1 KPIs
    expect(screen.getByText('Taxable Value')).toBeInTheDocument();
    expect(screen.getByText('₹1100.00')).toBeInTheDocument();
    expect(screen.getByText('Gross Invoice Value')).toBeInTheDocument();
    expect(screen.getAllByText('₹1190.00').length).toBeGreaterThan(0);

    // Check Table 4 B2B contents
    expect(screen.getByText('27ABCDE1234F1Z5')).toBeInTheDocument();
    expect(screen.getByText('Acme Traders')).toBeInTheDocument();
    expect(screen.getByText('INV-20261015-0001')).toBeInTheDocument();
  });

  it('navigates to GSTR-3B view and displays Net Cash Payable and Table 4 ITC', async () => {
    render(
      <GstReportsView
        tenantId="tenant-1"
        branches={mockBranches}
        suppliers={mockSuppliers}
        products={mockProducts}
        activeBranchId="branch-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('tab-gstr3b')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-gstr3b'));

    await waitFor(() => {
      expect(screen.getByText('Net Tax Payable in Cash')).toBeInTheDocument();
    });

    // Verify cash payable amount ₹50.00
    expect(screen.getAllByText('₹50.00').length).toBeGreaterThan(0);

    // Verify Table 4 ITC numbers
    expect(screen.getByText('4. Eligible and Ineligible Input Tax Credit (ITC)')).toBeInTheDocument();
    expect(screen.getByText('(5) All other ITC (From verified registered vendor tax invoices)')).toBeInTheDocument();
  });

  it('navigates to Supplier Invoices view and displays vendor bills', async () => {
    render(
      <GstReportsView
        tenantId="tenant-1"
        branches={mockBranches}
        suppliers={mockSuppliers}
        products={mockProducts}
        activeBranchId="branch-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('tab-supplier-invoices')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-supplier-invoices'));

    await waitFor(() => {
      expect(screen.getByText('Vendor Tax Invoices (Input Tax Credit Proof)')).toBeInTheDocument();
    });

    // Verify recorded invoice
    expect(screen.getByText('VEN-INV-99')).toBeInTheDocument();
    expect(screen.getByText('Fresh Foods Wholesale')).toBeInTheDocument();
    expect(screen.getByText('✓ Eligible')).toBeInTheDocument();
  });

  it('navigates to Sales Register view', async () => {
    render(
      <GstReportsView
        tenantId="tenant-1"
        branches={mockBranches}
        suppliers={mockSuppliers}
        products={mockProducts}
        activeBranchId="branch-1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('tab-sales-register')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-sales-register'));

    await waitFor(() => {
      expect(screen.getByText('Complete Invoice-wise Sales and Tax Register')).toBeInTheDocument();
    });

    expect(screen.getByText('INV-20261015-0001')).toBeInTheDocument();
  });
});
