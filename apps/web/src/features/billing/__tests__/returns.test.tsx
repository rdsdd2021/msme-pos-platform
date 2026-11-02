import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReturnItemsModal } from '../return-items-modal';
import { CreditNoteReceiptModal } from '../credit-note-receipt-modal';
import { apiClient, Invoice, CreditNote } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    createSalesReturn: jest.fn(),
  },
}));

describe('Sales Returns & Credit Notes UI Modals', () => {
  const mockInvoice: Invoice = {
    id: 'inv-test-1',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    invoiceNumber: 'INV-20261101-0001',
    idempotencyKey: 'idem-sale-1',
    status: 'posted',
    customerId: 'cust-1',
    customerGstinSnapshot: null,
    subtotal: '280.00',
    discountTotal: '0.00',
    taxableTotal: '280.00',
    cgstTotal: '7.00',
    sgstTotal: '7.00',
    igstTotal: '0.00',
    grandTotal: '294.00',
    roundingAdjustment: '0.00',
    paymentStatus: 'paid',
    postedAt: '2026-11-01T10:00:00Z',
    lines: [
      {
        id: 'line-oil-1',
        productId: 'prod-oil-1',
        productNameSnapshot: 'Fortune Sunflower Oil 1L',
        skuSnapshot: 'FORT-SUN-1L',
        hsnSnapshot: '15121910',
        quantity: '2.000',
        unitPrice: '140.00',
        discountAmount: '0.00',
        taxableValue: '280.00',
        gstRatePercent: '5.00',
        cgstAmount: '7.00',
        sgstAmount: '7.00',
        igstAmount: '0.00',
        lineTotal: '294.00',
      },
    ],
  };

  const mockCreditNote: CreditNote = {
    id: 'cn-test-1',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    creditNoteNumber: 'CN-20261101-1234',
    idempotencyKey: 'idem-ret-1',
    originalInvoiceId: 'inv-test-1',
    originalInvoiceNumber: 'INV-20261101-0001',
    customerId: 'cust-1',
    customerGstinSnapshot: null,
    placeOfSupply: '27',
    isInterstate: false,
    issuedByUserId: 'user-1',
    reason: 'Customer return / exchange',
    subtotal: '140.00',
    taxableTotal: '140.00',
    cgstTotal: '3.50',
    sgstTotal: '3.50',
    igstTotal: '0.00',
    grandTotal: '147.00',
    roundingAdjustment: '0.00',
    refundPaymentMethod: 'cash',
    refundReference: null,
    status: 'issued',
    createdAt: '2026-11-01T11:00:00Z',
    lines: [
      {
        id: 'cn-line-1',
        creditNoteId: 'cn-test-1',
        originalInvoiceLineId: 'line-oil-1',
        productId: 'prod-oil-1',
        productNameSnapshot: 'Fortune Sunflower Oil 1L',
        skuSnapshot: 'FORT-SUN-1L',
        hsnSnapshot: '15121910',
        quantityReturned: '1.000',
        resellableQuantity: '1.000',
        damagedQuantity: '0.000',
        unitPrice: '140.00',
        taxableValue: '140.00',
        gstRatePercent: '5.00',
        cgstAmount: '3.50',
        sgstAmount: '3.50',
        igstAmount: '0.00',
        lineTotal: '147.00',
        returnReason: 'Customer return / exchange',
      },
    ],
  };

  it('renders ReturnItemsModal with invoice line items and calculates refund', async () => {
    const handleSuccess = jest.fn();
    render(
      <ReturnItemsModal
        open={true}
        onOpenChange={jest.fn()}
        invoice={mockInvoice}
        tenantId="tenant-1"
        onSuccess={handleSuccess}
      />,
    );

    expect(screen.getByTestId('return-items-modal')).toBeInTheDocument();
    expect(screen.getByText('Fortune Sunflower Oil 1L')).toBeInTheDocument();
    expect(screen.getByText('Max returnable: 2.000')).toBeInTheDocument();

    // Click "Return All" button
    fireEvent.click(screen.getByText('Return All'));

    // Check calculated refund amount for 2 bottles: ₹294.00
    expect(screen.getByText('Confirm & Issue Credit Note (₹294.00)')).toBeInTheDocument();
  });

  it('submits return payload to backend and calls onSuccess', async () => {
    (apiClient.createSalesReturn as jest.Mock).mockResolvedValueOnce(mockCreditNote);
    const handleSuccess = jest.fn();
    const handleOpenChange = jest.fn();

    render(
      <ReturnItemsModal
        open={true}
        onOpenChange={handleOpenChange}
        invoice={mockInvoice}
        tenantId="tenant-1"
        onSuccess={handleSuccess}
      />,
    );

    // Click Return All
    fireEvent.click(screen.getByText('Return All'));

    // Submit return
    fireEvent.click(screen.getByText('Confirm & Issue Credit Note (₹294.00)'));

    await waitFor(() => {
      expect(apiClient.createSalesReturn).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          originalInvoiceId: 'inv-test-1',
          refundPaymentMethod: 'cash',
          items: [
            expect.objectContaining({
              invoiceLineId: 'line-oil-1',
              resellableQuantity: '2.000',
              damagedQuantity: '0.000',
            }),
          ],
        }),
      );
      expect(handleSuccess).toHaveBeenCalledWith(mockCreditNote);
    });
  });

  it('renders CreditNoteReceiptModal voucher accurately with statutory details', () => {
    render(
      <CreditNoteReceiptModal
        open={true}
        onOpenChange={jest.fn()}
        creditNote={mockCreditNote}
        tenantName="Kirana Supermart"
      />,
    );

    expect(screen.getByTestId('credit-note-receipt-modal')).toBeInTheDocument();
    expect(screen.getAllByText('CN-20261101-1234').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('INV-20261101-0001')).toBeInTheDocument();
    expect(screen.getAllByText('₹147.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Refunded via cash')).toBeInTheDocument();
  });
});
