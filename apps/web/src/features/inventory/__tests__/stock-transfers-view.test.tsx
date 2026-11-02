import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StockTransfersView } from '../stock-transfers-view';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => {
  const actual = jest.requireActual('@/lib/api-client');
  return {
    ...actual,
    apiClient: {
      getStockTransfers: jest.fn(),
      getStockTransfer: jest.fn(),
      createStockTransfer: jest.fn(),
      dispatchStockTransfer: jest.fn(),
      receiveStockTransfer: jest.fn(),
      cancelStockTransfer: jest.fn(),
    },
  };
});

describe('StockTransfersView & Multi-Branch Reconciliation UI', () => {
  const mockBranches = [
    { id: 'branch-1', tenantId: 'tenant-1', code: 'MAIN', name: 'Main Store - Andheri', isActive: true },
    { id: 'branch-2', tenantId: 'tenant-1', code: 'WEST', name: 'West Branch - Bandra', isActive: true },
  ] as any;

  const mockProducts = [
    {
      id: 'prod-1',
      tenantId: 'tenant-1',
      name: 'Aashirvaad Atta 10kg',
      sku: 'GROC-ATTA-10',
      sellingPrice: '450.00',
      purchaseCost: '380.00',
      gstRatePercent: '5.00',
      hsnCode: '1101',
      isActive: true,
    },
    {
      id: 'prod-2',
      tenantId: 'tenant-1',
      name: 'Tata Salt 1kg',
      sku: 'GROC-SALT-1',
      sellingPrice: '28.00',
      purchaseCost: '22.00',
      gstRatePercent: '0.00',
      hsnCode: '2501',
      isActive: true,
    },
  ] as any;

  const mockStockMap = new Map<string, string>([
    ['prod-1', '50.000'],
    ['prod-2', '120.000'],
  ]);

  const mockTransfers = [
    {
      id: 'trf-1',
      tenantId: 'tenant-1',
      transferNumber: 'TRF-20261101-001',
      sourceBranchId: 'branch-1',
      destinationBranchId: 'branch-2',
      status: 'in_transit',
      totalItemsRequested: '20.000',
      totalItemsDispatched: '20.000',
      totalItemsReceived: '0.000',
      hasDiscrepancy: false,
      notes: 'Weekend stock replenishment',
      createdAt: '2026-11-01T08:00:00Z',
      updatedAt: '2026-11-01T08:30:00Z',
      sourceBranch: { id: 'branch-1', name: 'Main Store - Andheri' },
      destinationBranch: { id: 'branch-2', name: 'West Branch - Bandra' },
      lines: [
        {
          id: 'line-1',
          transferId: 'trf-1',
          productId: 'prod-1',
          quantityRequested: '20.000',
          quantityDispatched: '20.000',
          quantityReceived: '0.000',
          unitCost: '380.00',
          hasDiscrepancy: false,
          discrepancyQuantity: '0.000',
          product: mockProducts[0],
        },
      ],
    },
    {
      id: 'trf-2',
      tenantId: 'tenant-1',
      transferNumber: 'TRF-20261101-002',
      sourceBranchId: 'branch-1',
      destinationBranchId: 'branch-2',
      status: 'draft',
      totalItemsRequested: '10.000',
      totalItemsDispatched: '0.000',
      totalItemsReceived: '0.000',
      hasDiscrepancy: false,
      createdAt: '2026-11-01T09:00:00Z',
      updatedAt: '2026-11-01T09:00:00Z',
      sourceBranch: { id: 'branch-1', name: 'Main Store - Andheri' },
      destinationBranch: { id: 'branch-2', name: 'West Branch - Bandra' },
      lines: [
        {
          id: 'line-2',
          transferId: 'trf-2',
          productId: 'prod-2',
          quantityRequested: '10.000',
          quantityDispatched: '0.000',
          quantityReceived: '0.000',
          unitCost: '22.00',
          hasDiscrepancy: false,
          discrepancyQuantity: '0.000',
          product: mockProducts[1],
        },
      ],
    },
    {
      id: 'trf-3',
      tenantId: 'tenant-1',
      transferNumber: 'TRF-20261030-001',
      sourceBranchId: 'branch-2',
      destinationBranchId: 'branch-1',
      status: 'received',
      totalItemsRequested: '15.000',
      totalItemsDispatched: '15.000',
      totalItemsReceived: '13.000',
      hasDiscrepancy: true,
      discrepancyReason: '2 packages leaking/damaged upon arrival',
      createdAt: '2026-10-30T10:00:00Z',
      updatedAt: '2026-10-30T14:00:00Z',
      sourceBranch: { id: 'branch-2', name: 'West Branch - Bandra' },
      destinationBranch: { id: 'branch-1', name: 'Main Store - Andheri' },
      lines: [
        {
          id: 'line-3',
          transferId: 'trf-3',
          productId: 'prod-1',
          quantityRequested: '15.000',
          quantityDispatched: '15.000',
          quantityReceived: '13.000',
          unitCost: '380.00',
          hasDiscrepancy: true,
          discrepancyQuantity: '2.000',
          discrepancyReason: '2 packages damaged',
          product: mockProducts[0],
        },
      ],
    },
  ] as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.getStockTransfers as jest.Mock).mockResolvedValue({
      data: mockTransfers,
      total: 3,
      page: 1,
      limit: 100,
    });
  });

  it('renders KPI summary cards and transfer orders list', async () => {
    render(
      <StockTransfersView
        tenantId="tenant-1"
        currentBranchId="branch-1"
        branches={mockBranches}
        products={mockProducts}
        stockMap={mockStockMap}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Inter-Branch Stock Transfers & Perpetual Custody')).toBeInTheDocument();
      expect(screen.getByText('TRF-20261101-001')).toBeInTheDocument();
      expect(screen.getByText('TRF-20261101-002')).toBeInTheDocument();
      expect(screen.getByText('TRF-20261030-001')).toBeInTheDocument();
    });

    // Check KPI counts: 1 In Transit, 1 Completed, 1 Discrepancy, 3 Total
    expect(screen.getByText('In Transit Transfers')).toBeInTheDocument();
    expect(screen.getByText('Completed Transfers')).toBeInTheDocument();
    expect(screen.getByText('Discrepancies Flagged')).toBeInTheDocument();
  });

  it('filters transfers by status', async () => {
    render(
      <StockTransfersView
        tenantId="tenant-1"
        currentBranchId="branch-1"
        branches={mockBranches}
        products={mockProducts}
        stockMap={mockStockMap}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('TRF-20261101-001')).toBeInTheDocument();
    });

    const filterSelect = screen.getByTestId('status-filter-select');
    fireEvent.change(filterSelect, { target: { value: 'draft' } });

    expect(screen.getByText('TRF-20261101-002')).toBeInTheDocument();
    expect(screen.queryByText('TRF-20261101-001')).not.toBeInTheDocument();
  });

  it('dispatches a draft transfer order', async () => {
    (apiClient.dispatchStockTransfer as jest.Mock).mockResolvedValue({
      ...mockTransfers[1],
      status: 'in_transit',
    });

    render(
      <StockTransfersView
        tenantId="tenant-1"
        currentBranchId="branch-1"
        branches={mockBranches}
        products={mockProducts}
        stockMap={mockStockMap}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('TRF-20261101-002')).toBeInTheDocument();
    });

    const dispatchBtn = screen.getByTestId('dispatch-transfer-btn');
    fireEvent.click(dispatchBtn);

    await waitFor(() => {
      expect(apiClient.dispatchStockTransfer).toHaveBeenCalledWith('tenant-1', 'trf-2');
    });
  });

  it('opens Receive & Reconcile modal and submits matched shipment', async () => {
    (apiClient.receiveStockTransfer as jest.Mock).mockResolvedValue({
      ...mockTransfers[0],
      status: 'received',
    });

    render(
      <StockTransfersView
        tenantId="tenant-1"
        currentBranchId="branch-1"
        branches={mockBranches}
        products={mockProducts}
        stockMap={mockStockMap}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('TRF-20261101-001')).toBeInTheDocument();
    });

    const receiveBtn = screen.getByTestId('receive-transfer-btn');
    fireEvent.click(receiveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('receive-transfer-modal')).toBeInTheDocument();
      expect(screen.getByText('Reconcile & Receive Inward Stock Transfer')).toBeInTheDocument();
    });

    // Click full shipment button
    const fullBtn = screen.getByTestId('receive-all-full-btn');
    fireEvent.click(fullBtn);

    const confirmBtn = screen.getByTestId('confirm-receive-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiClient.receiveStockTransfer).toHaveBeenCalledWith(
        'tenant-1',
        'trf-1',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ lineId: 'line-1', quantityReceived: '20.000' }),
          ]),
        }),
      );
    });
  });

  it('flags discrepancy when received quantity is adjusted below dispatched', async () => {
    (apiClient.receiveStockTransfer as jest.Mock).mockResolvedValue({
      ...mockTransfers[0],
      status: 'received',
      hasDiscrepancy: true,
    });

    render(
      <StockTransfersView
        tenantId="tenant-1"
        currentBranchId="branch-1"
        branches={mockBranches}
        products={mockProducts}
        stockMap={mockStockMap}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('TRF-20261101-001')).toBeInTheDocument();
    });

    const receiveBtn = screen.getByTestId('receive-transfer-btn');
    fireEvent.click(receiveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('receive-transfer-modal')).toBeInTheDocument();
    });

    // Change received count from 20 to 18 (2 units missing)
    const qtyInput = screen.getByTestId('qty-received-input-line-1');
    fireEvent.change(qtyInput, { target: { value: '18.000' } });

    // Warning banner should appear with mandatory explanation input
    await waitFor(() => {
      expect(
        screen.getByText('Stock Discrepancy Detected Between Dispatch and Physical Receipt'),
      ).toBeInTheDocument();
    });

    const reasonInput = screen.getByTestId('overall-discrepancy-reason');
    fireEvent.change(reasonInput, { target: { value: '2 bags burst during truck transport' } });

    const confirmBtn = screen.getByTestId('confirm-receive-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiClient.receiveStockTransfer).toHaveBeenCalledWith(
        'tenant-1',
        'trf-1',
        expect.objectContaining({
          discrepancyReason: '2 bags burst during truck transport',
          items: expect.arrayContaining([
            expect.objectContaining({ lineId: 'line-1', quantityReceived: '18.000' }),
          ]),
        }),
      );
    });
  });

  it('opens Initiate Transfer modal and creates new transfer order', async () => {
    (apiClient.createStockTransfer as jest.Mock).mockResolvedValue({
      id: 'trf-new',
      transferNumber: 'TRF-NEW-001',
      status: 'draft',
      totalItemsRequested: '5.000',
    });

    render(
      <StockTransfersView
        tenantId="tenant-1"
        currentBranchId="branch-1"
        branches={mockBranches}
        products={mockProducts}
        stockMap={mockStockMap}
      />,
    );

    const initBtn = screen.getByTestId('create-transfer-btn');
    fireEvent.click(initBtn);

    await waitFor(() => {
      expect(screen.getByTestId('create-transfer-modal')).toBeInTheDocument();
    });

    // Select destination branch
    const destSelect = screen.getByTestId('dest-branch-select');
    fireEvent.change(destSelect, { target: { value: 'branch-2' } });

    // Choose product
    const prodSelect = screen.getByTestId('transfer-product-picker');
    fireEvent.change(prodSelect, { target: { value: 'prod-1' } });

    // Enter quantity
    const qtyInput = screen.getByTestId('transfer-qty-input');
    fireEvent.change(qtyInput, { target: { value: '5.000' } });

    // Click Add
    const addBtn = screen.getByTestId('add-transfer-line-btn');
    fireEvent.click(addBtn);

    // Click Submit
    const submitBtn = screen.getByTestId('submit-create-transfer-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.createStockTransfer).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          sourceBranchId: 'branch-1',
          destinationBranchId: 'branch-2',
          lines: expect.arrayContaining([
            expect.objectContaining({ productId: 'prod-1', quantityRequested: '5.000' }),
          ]),
        }),
      );
    });
  });

  it('opens Audit Dossier modal showing full line items and timeline', async () => {
    render(
      <StockTransfersView
        tenantId="tenant-1"
        currentBranchId="branch-1"
        branches={mockBranches}
        products={mockProducts}
        stockMap={mockStockMap}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('TRF-20261030-001')).toBeInTheDocument();
    });

    const viewDetailsBtns = screen.getAllByTestId('view-transfer-details-btn');
    fireEvent.click(viewDetailsBtns[2]); // click on the discrepancy transfer

    await waitFor(() => {
      expect(screen.getByTestId('transfer-details-modal')).toBeInTheDocument();
      expect(screen.getByText('Stock Transfer Audit Dossier')).toBeInTheDocument();
      expect(screen.getByText('Discrepancy Flagged On Receipt')).toBeInTheDocument();
      expect(screen.getByText('2 packages leaking/damaged upon arrival')).toBeInTheDocument();
    });
  });
});

