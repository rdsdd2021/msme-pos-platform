import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RestaurantFloorplanView } from '../restaurant-floorplan-view';
import { SplitBillModal } from '../split-bill-modal';
import { KitchenDisplayView } from '../kitchen-display-view';
import {
  apiClient,
  RestaurantTable,
  RestaurantOrder,
  RestaurantKot,
} from '@/lib/api-client';
import {
  TableStatus,
  RestaurantOrderType,
  RestaurantOrderStatus,
  KotStatus,
  KitchenStation,
  PaymentMethod,
} from '@pos/shared-types';

// Mock auth store
jest.mock('@/store/auth.store', () => ({
  useAuthStore: () => ({
    activeTenant: { tenantId: 'tenant-123', tenantName: 'Spice Bistro' },
    activeBranch: { id: 'branch-456', name: 'Main Dining Hall', code: 'BR-01' },
    isOwner: () => true,
    isBranchManager: () => true,
    isCashier: () => true,
  }),
}));

// Mock apiClient
jest.mock('@/lib/api-client', () => {
  const actual = jest.requireActual('@/lib/api-client');
  return {
    ...actual,
    apiClient: {
      getRestaurantTables: jest.fn(),
      createRestaurantTable: jest.fn(),
      seedDefaultRestaurantTables: jest.fn(),
      updateRestaurantTable: jest.fn(),
      getRestaurantOrder: jest.fn(),
      createRestaurantOrder: jest.fn(),
      dispatchRestaurantKot: jest.fn(),
      getRestaurantKdsQueue: jest.fn(),
      updateRestaurantKotStatus: jest.fn(),
      transferRestaurantTable: jest.fn(),
      settleRestaurantOrder: jest.fn(),
      getProducts: jest.fn().mockResolvedValue([]),
    },
  };
});

describe('Restaurant & Cafe Module UI Tests', () => {
  const mockTables: RestaurantTable[] = [
    {
      id: 'table-1',
      tenantId: 'tenant-123',
      branchId: 'branch-456',
      tableNumber: 'T-01',
      tableName: 'Window Booth',
      section: 'Main Dining',
      seatingCapacity: 4,
      status: TableStatus.VACANT,
      currentGuestCount: 0,
      occupiedAt: null,
      sortOrder: 1,
      isActive: true,
      createdAt: '2026-11-03T12:00:00Z',
      updatedAt: '2026-11-03T12:00:00Z',
      activeOrder: null,
    },
    {
      id: 'table-2',
      tenantId: 'tenant-123',
      branchId: 'branch-456',
      tableNumber: 'T-02',
      tableName: 'Family Table',
      section: 'AC Hall',
      seatingCapacity: 6,
      status: TableStatus.ORDERED,
      currentGuestCount: 4,
      occupiedAt: '2026-11-03T12:15:00Z',
      sortOrder: 2,
      isActive: true,
      createdAt: '2026-11-03T12:00:00Z',
      updatedAt: '2026-11-03T12:15:00Z',
      activeOrder: {
        id: 'order-101',
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        orderNumber: 'ORD-20261103-0001',
        orderType: RestaurantOrderType.DINE_IN,
        tableId: 'table-2',
        tableNumberSnapshot: 'T-02',
        sectionSnapshot: 'AC Hall',
        guestCount: 4,
        customerId: null,
        customerNameSnapshot: null,
        customerPhoneSnapshot: null,
        status: RestaurantOrderStatus.OPEN,
        captainUserId: 'user-1',
        captainNameSnapshot: 'Rahul Sharma',
        notes: null,
        subtotal: '1000.00',
        taxTotal: '50.00',
        discountTotal: '0.00',
        grandTotal: '1050.00',
        invoiceId: null,
        openedAt: '2026-11-03T12:15:00Z',
        closedAt: null,
        createdAt: '2026-11-03T12:15:00Z',
        updatedAt: '2026-11-03T12:15:00Z',
        kots: [
          {
            id: 'kot-1',
            tenantId: 'tenant-123',
            branchId: 'branch-456',
            orderId: 'order-101',
            kotNumber: 'KOT-01',
            tableNumber: 'T-02',
            kitchenStation: KitchenStation.MAIN_KITCHEN,
            status: KotStatus.PREPARING,
            captainName: 'Rahul Sharma',
            dispatchedAt: '2026-11-03T12:16:00Z',
            readyAt: null,
            servedAt: null,
            createdAt: '2026-11-03T12:16:00Z',
            updatedAt: '2026-11-03T12:16:00Z',
            lines: [],
          },
        ],
        lines: [
          {
            id: 'line-1',
            tenantId: 'tenant-123',
            kotId: 'kot-1',
            orderId: 'order-101',
            productId: 'p-1',
            productNameSnapshot: 'Butter Chicken Masala',
            quantity: '2.000',
            unitPrice: '350.00',
            lineTotal: '700.00',
            kitchenStation: KitchenStation.MAIN_KITCHEN,
            specialInstructions: 'Medium spicy',
            status: KotStatus.PREPARING,
            createdAt: '2026-11-03T12:16:00Z',
          },
          {
            id: 'line-2',
            tenantId: 'tenant-123',
            kotId: 'kot-1',
            orderId: 'order-101',
            productId: 'p-2',
            productNameSnapshot: 'Garlic Naan',
            quantity: '5.000',
            unitPrice: '60.00',
            lineTotal: '300.00',
            kitchenStation: KitchenStation.TANDOOR,
            specialInstructions: 'Crispy',
            status: KotStatus.PREPARING,
            createdAt: '2026-11-03T12:16:00Z',
          },
        ],
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RestaurantFloorplanView', () => {
    it('renders floor summary metrics, sections, and table cards correctly', async () => {
      (apiClient.getRestaurantTables as jest.Mock).mockResolvedValue(mockTables);

      render(<RestaurantFloorplanView />);

      // Verify title & brand
      expect(screen.getByText('Restaurant & Dining Floor')).toBeInTheDocument();

      // Wait for table cards to load
      await waitFor(() => {
        expect(screen.getByText('T-01')).toBeInTheDocument();
        expect(screen.getByText('T-02')).toBeInTheDocument();
      });

      // Verify summary KPI strip
      expect(screen.getByText('Window Booth')).toBeInTheDocument();
      expect(screen.getByText('Family Table')).toBeInTheDocument();
      expect(screen.getByText('4 Pax')).toBeInTheDocument();
      expect(screen.getByText(/₹1,050\.00/i)).toBeInTheDocument();

      // Verify table status badges
      expect(screen.getByText('vacant')).toBeInTheDocument();
      expect(screen.getByText('ordered')).toBeInTheDocument();
    });

    it('filters tables when a section button is clicked', async () => {
      (apiClient.getRestaurantTables as jest.Mock).mockResolvedValue(mockTables);

      render(<RestaurantFloorplanView />);

      await waitFor(() => {
        expect(screen.getByText('T-01')).toBeInTheDocument();
      });

      // Click AC Hall filter
      const acHallButton = screen.getByRole('button', { name: /AC Hall/i });
      fireEvent.click(acHallButton);

      // T-02 is in AC Hall, T-01 is in Main Dining
      expect(screen.getByText('T-02')).toBeInTheDocument();
      expect(screen.queryByText('T-01')).not.toBeInTheDocument();
    });
  });

  describe('SplitBillModal', () => {
    const mockActiveOrder = mockTables[1].activeOrder!;

    it('renders bill breakdown with 5% restaurant GST and grand total', () => {
      render(
        <SplitBillModal
          order={mockActiveOrder}
          open={true}
          onOpenChange={jest.fn()}
          onSettlementSuccess={jest.fn()}
        />,
      );

      // Verify title and table snapshot
      expect(screen.getByText('Table Settlement & Checkout')).toBeInTheDocument();
      expect(screen.getByText('T-02')).toBeInTheDocument();
      expect(screen.getByText(/Payable Amount/i)).toBeInTheDocument();

      // Check amount
      expect(screen.getByText('₹1,050.00')).toBeInTheDocument();
      expect(screen.getByText(/Subtotal: ₹1000\.00 \+ GST \(5%\): ₹50\.00/i)).toBeInTheDocument();
    });

    it('calculates cash change due accurately', () => {
      render(
        <SplitBillModal
          order={mockActiveOrder}
          open={true}
          onOpenChange={jest.fn()}
          onSettlementSuccess={jest.fn()}
        />,
      );

      // Cash tendered input
      const tenderInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(tenderInput, { target: { value: '2000.00' } });

      // Change due: 2000 - 1050 = 950.00
      expect(screen.getByText('₹950.00')).toBeInTheDocument();
    });

    it('splits bill equally among diners and dispatches settlement request', async () => {
      const onSuccessMock = jest.fn();
      (apiClient.settleRestaurantOrder as jest.Mock).mockResolvedValue({
        order: { ...mockActiveOrder, status: RestaurantOrderStatus.COMPLETED },
        invoice: {
          id: 'inv-999',
          invoiceNumber: 'INV-REST-001',
        },
      });

      render(
        <SplitBillModal
          order={mockActiveOrder}
          open={true}
          onOpenChange={jest.fn()}
          onSettlementSuccess={onSuccessMock}
        />,
      );

      // Click Equal Split mode
      const equalSplitBtn = screen.getByRole('button', { name: /Equal Split/i });
      fireEvent.click(equalSplitBtn);

      // Number of diners should be configurable, check Guest splits
      expect(screen.getByText('Guest #1')).toBeInTheDocument();
      expect(screen.getByText('Guest #2')).toBeInTheDocument();

      // Submit settlement
      const settleBtn = screen.getByRole('button', { name: /Complete Settlement/i });
      fireEvent.click(settleBtn);

      await waitFor(() => {
        expect(apiClient.settleRestaurantOrder).toHaveBeenCalledTimes(1);
        expect(apiClient.settleRestaurantOrder).toHaveBeenCalledWith(
          'tenant-123',
          'branch-456',
          expect.objectContaining({
            orderId: 'order-101',
            isSplit: true,
          }),
        );
        expect(onSuccessMock).toHaveBeenCalledTimes(1);
      });

      // Verify success screen
      expect(screen.getByText('Payment Confirmed')).toBeInTheDocument();
      expect(screen.getByText(/Invoice #INV-REST-001/i)).toBeInTheDocument();
    });
  });

  describe('KitchenDisplayView', () => {
    const mockKdsTickets: RestaurantKot[] = [
      {
        id: 'kot-test-1',
        tenantId: 'tenant-123',
        branchId: 'branch-456',
        orderId: 'order-101',
        kotNumber: 'KOT-01',
        tableNumber: 'T-02',
        kitchenStation: KitchenStation.MAIN_KITCHEN,
        status: KotStatus.PENDING,
        captainName: 'Rahul Sharma',
        dispatchedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        readyAt: null,
        servedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lines: [
          {
            id: 'l-1',
            tenantId: 'tenant-123',
            kotId: 'kot-test-1',
            orderId: 'order-101',
            productId: 'p-1',
            productNameSnapshot: 'Paneer Butter Masala',
            quantity: '2.000',
            unitPrice: '280.00',
            lineTotal: '560.00',
            kitchenStation: KitchenStation.MAIN_KITCHEN,
            specialInstructions: 'Extra spicy, no butter on top',
            status: KotStatus.PENDING,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ];

    it('renders active KDS queue and allows bumping ticket status', async () => {
      (apiClient.getRestaurantKdsQueue as jest.Mock).mockResolvedValue(mockKdsTickets);
      (apiClient.updateRestaurantKotStatus as jest.Mock).mockResolvedValue({
        ...mockKdsTickets[0],
        status: KotStatus.PREPARING,
      });

      render(<KitchenDisplayView />);

      expect(screen.getByText(/Kitchen Display Screen/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('KOT-01')).toBeInTheDocument();
        expect(screen.getByText('T-02')).toBeInTheDocument();
        expect(screen.getByText('Paneer Butter Masala')).toBeInTheDocument();
        expect(screen.getByText(/Note: Extra spicy, no butter on top/i)).toBeInTheDocument();
      });

      // Click "Start Cooking" action button
      const startCookingBtn = screen.getByRole('button', { name: /Start Cooking/i });
      fireEvent.click(startCookingBtn);

      await waitFor(() => {
        expect(apiClient.updateRestaurantKotStatus).toHaveBeenCalledWith(
          'tenant-123',
          'branch-456',
          'kot-test-1',
          KotStatus.PREPARING,
        );
      });
    });
  });
});
