import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReceiptDesignerModal } from '../receipt-designer-modal';
import {
  DEFAULT_RECEIPT_CONFIG,
  getReceiptConfig,
  saveReceiptConfig,
} from '@/lib/receipt-template';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ReceiptDesignerModal & Receipt Template', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders receipt designer modal when open', () => {
    render(
      <ReceiptDesignerModal
        open={true}
        onClose={jest.fn()}
        tenantId="tenant-123"
        branchId="branch-456"
        tenantName="Shree Ganesh Kirana"
        branchName="Main Market"
      />
    );

    expect(screen.getByText('Bill & Receipt Design Customizer')).toBeInTheDocument();
    expect(screen.getByText(/1\. Store Header/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Paper & Style/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Tax & Items/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. UPI & Footer/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Thermal Bill Preview/i)).toBeInTheDocument();
  });

  it('allows switching between tabs', () => {
    render(
      <ReceiptDesignerModal
        open={true}
        onClose={jest.fn()}
        tenantId="tenant-123"
        branchId="branch-456"
      />
    );

    // Switch to Paper & Style
    fireEvent.click(screen.getByText(/2\. Paper & Style/i));
    expect(screen.getByText(/58 mm \(2-inch Roll\)/i)).toBeInTheDocument();
    expect(screen.getByText(/80 mm \(3-inch Roll\)/i)).toBeInTheDocument();

    // Switch to Tax & Items
    fireEvent.click(screen.getByText(/3\. Tax & Items/i));
    expect(screen.getByText(/Show HSN Commodity Code/i)).toBeInTheDocument();
    expect(screen.getByText(/Detailed GST Tax Breakdown/i)).toBeInTheDocument();

    // Switch to UPI & Footer
    fireEvent.click(screen.getByText(/4\. UPI & Footer/i));
    expect(screen.getByText(/Dynamic UPI QR Code/i)).toBeInTheDocument();
    expect(screen.getByText(/Store UPI VPA Address/i)).toBeInTheDocument();
  });

  it('updates live receipt preview when editing business name and phone', () => {
    render(
      <ReceiptDesignerModal
        open={true}
        onClose={jest.fn()}
        tenantId="tenant-123"
        branchId="branch-456"
      />
    );

    const nameInput = screen.getByTestId('business-name-input');
    fireEvent.change(nameInput, { target: { value: 'New Age Supermarket' } });

    // The live preview should update
    const previewContainer = screen.getByTestId('receipt-live-preview');
    expect(previewContainer).toHaveTextContent('New Age Supermarket');
  });

  it('switches paper roll size to 80mm and updates preview layout', () => {
    render(
      <ReceiptDesignerModal
        open={true}
        onClose={jest.fn()}
        tenantId="tenant-123"
        branchId="branch-456"
      />
    );

    fireEvent.click(screen.getByText(/2\. Paper & Style/i));
    const btn80mm = screen.getByText(/80 mm \(3-inch Roll\)/i);
    fireEvent.click(btn80mm);

    const preview = screen.getByTestId('receipt-live-preview');
    expect(preview.style.maxWidth).toBe('380px');
  });

  it('saves customized configuration to localStorage', () => {
    const onClose = jest.fn();
    render(
      <ReceiptDesignerModal
        open={true}
        onClose={onClose}
        tenantId="tenant-123"
        branchId="branch-456"
      />
    );

    const nameInput = screen.getByTestId('business-name-input');
    fireEvent.change(nameInput, { target: { value: 'Custom Store Name' } });

    const saveBtn = screen.getByTestId('save-receipt-design-btn');
    fireEvent.click(saveBtn);

    const saved = getReceiptConfig('tenant-123', 'branch-456');
    expect(saved.businessName).toBe('Custom Store Name');
  });

  it('resets to default receipt template configuration', () => {
    render(
      <ReceiptDesignerModal
        open={true}
        onClose={jest.fn()}
        tenantId="tenant-123"
        branchId="branch-456"
      />
    );

    const nameInput = screen.getByTestId('business-name-input');
    fireEvent.change(nameInput, { target: { value: 'Modified Name' } });

    const resetBtn = screen.getByText('Reset');
    fireEvent.click(resetBtn);

    const previewContainer = screen.getByTestId('receipt-live-preview');
    expect(previewContainer).toHaveTextContent(DEFAULT_RECEIPT_CONFIG.businessName);
  });

  it('triggers window.open print popup when Test Print Bill is clicked', () => {
    const mockPrintWindow = {
      document: {
        write: jest.fn(),
        close: jest.fn(),
      },
      focus: jest.fn(),
      print: jest.fn(),
      close: jest.fn(),
    };
    const openSpy = jest.spyOn(window, 'open').mockReturnValue(mockPrintWindow as any);

    render(
      <ReceiptDesignerModal
        open={true}
        onClose={jest.fn()}
        tenantId="tenant-123"
        branchId="branch-456"
      />
    );

    const printBtn = screen.getByText('Test Print Bill');
    fireEvent.click(printBtn);

    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
