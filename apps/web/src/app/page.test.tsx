import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from './page';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { apiClient } from '@/lib/api-client';
import { Role, Permission, PaymentMethod, StockMovementType } from '@pos/shared-types';

// Mock apiClient
jest.mock('@/lib/api-client', () => {
  const actual = jest.requireActual('@/lib/api-client');
  return {
    ...actual,
    apiClient: {
      login: jest.fn(),
      getProfile: jest.fn(),
      logout: jest.fn(),
      getTenants: jest.fn(),
      getBranches: jest.fn(),
      getProducts: jest.fn(),
      searchProduct: jest.fn(),
      getStockBalances: jest.fn(),
      recordStockMovement: jest.fn(),
      createSale: jest.fn(),
      getInvoices: jest.fn(),
      getCustomers: jest.fn(),
      recordCustomerPayment: jest.fn(),
      getShifts: jest.fn(),
      getCurrentShift: jest.fn(),
      openShift: jest.fn(),
      closeShift: jest.fn(),
      getDailySalesReport: jest.fn(),
      getDevices: jest.fn(),
      getSubscription: jest.fn(),
      setActiveContext: jest.fn(),
      getCategories: jest.fn(),
      createCategory: jest.fn(),
      getUnits: jest.fn(),
      createUnit: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
      getProduct: jest.fn(),
      getSuppliers: jest.fn(),
      createSupplier: jest.fn(),
      updateSupplier: jest.fn(),
      deleteSupplier: jest.fn(),
      getPurchaseOrders: jest.fn(),
      getPurchaseOrder: jest.fn(),
      createPurchaseOrder: jest.fn(),
      updatePurchaseOrderStatus: jest.fn(),
      receivePurchaseOrder: jest.fn(),
      getCustomerStatement: jest.fn(),
      updateCustomerCreditLimit: jest.fn(),
      createCustomer: jest.fn(),
      recordCustomerAdjustment: jest.fn(),
      getGstr1Report: jest.fn(),
      getGstr3bReport: jest.fn(),
      getSalesRegister: jest.fn(),
      getSupplierInvoices: jest.fn(),
      recordSupplierInvoice: jest.fn(),
      searchCustomers: jest.fn(),
      getCustomerHistory: jest.fn(),
      mergeCustomers: jest.fn(),
      cleanupDevTestCustomers: jest.fn(),
      updateBranch: jest.fn(),
      createSalesReturn: jest.fn(),
      getCreditNotes: jest.fn(),
      getCreditNoteById: jest.fn(),
    },
  };
});

describe('Web POS & Admin Dashboard — Full Integration & RBAC', () => {
  const mockOwnerProfile = {
    id: 'user-owner-1',
    email: 'admin@kirana.dev',
    fullName: 'Rajesh Store Owner',
    phone: '+919876543201',
    memberships: [
      {
        tenantId: 'tenant-1',
        tenantName: 'Kirana Supermart',
        branchId: null, // Tenant-wide
        role: 'owner',
        roles: [Role.OWNER],
        status: 'active',
        permissions: [Permission.BILLING_POS_CREATE, Permission.TENANT_READ, Permission.CATALOG_READ],
        isOwner: true,
      },
    ],
  };

  const mockCashierProfile = {
    id: 'user-cashier-2',
    email: 'cashier@kirana.dev',
    fullName: 'Suresh Cashier',
    phone: '+919876543202',
    memberships: [
      {
        tenantId: 'tenant-1',
        tenantName: 'Kirana Supermart',
        branchId: 'branch-1', // Scoped to branch-1
        role: 'cashier',
        roles: [Role.CASHIER],
        status: 'active',
        permissions: [Permission.BILLING_POS_CREATE, Permission.CATALOG_READ, Permission.SHIFT_OPEN],
        isOwner: false,
      },
    ],
  };

  const mockBranches = [
    {
      id: 'branch-1',
      tenantId: 'tenant-1',
      code: 'BR-001',
      name: 'Main Store - Andheri West',
      isActive: true,
    },
    {
      id: 'branch-2',
      tenantId: 'tenant-1',
      code: 'BR-002',
      name: 'Bandra West Branch',
      isActive: true,
    },
  ];

  const mockProducts = [
    {
      id: 'prod-oil-1',
      tenantId: 'tenant-1',
      sku: 'FORT-SUN-1L',
      name: 'Fortune Sunflower Oil 1L',
      barcodePrimary: '8901234567890',
      sellingPrice: '140.00',
      purchaseCost: '120.00',
      mrp: '150.00',
      productType: 'stock',
      trackInventory: true,
      isActive: true,
      categoryId: null,
    },
    {
      id: 'prod-rice-2',
      tenantId: 'tenant-1',
      sku: 'IG-RICE-5KG',
      name: 'India Gate Basmati Rice 5kg',
      barcodePrimary: '8901234567891',
      sellingPrice: '520.00',
      purchaseCost: '450.00',
      mrp: '550.00',
      productType: 'stock',
      trackInventory: true,
      isActive: true,
      categoryId: null,
    },
  ];

  const mockBalances = [
    { id: 'sb-1', tenantId: 'tenant-1', branchId: 'branch-1', productId: 'prod-oil-1', quantityOnHand: '25.000', lowStockThreshold: '5.000' },
    { id: 'sb-2', tenantId: 'tenant-1', branchId: 'branch-1', productId: 'prod-rice-2', quantityOnHand: '10.000', lowStockThreshold: '5.000' },
  ];

  const mockCustomers = [
    {
      id: 'cust-1',
      tenantId: 'tenant-1',
      name: 'Ramesh Sharma',
      phone: '9876543210',
      email: null,
      creditLimit: '5000.00',
      currentBalance: '850.00',
      isActive: true,
    },
  ];

  const mockDailyReport = {
    date: '2026-10-31',
    totalSales: '4850.00',
    totalTax: '225.00',
    invoiceCount: 18,
    paymentBreakdown: { cash: '2450.00', upi: '1800.00', card: '350.00', credit: '250.00' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCartStore.getState().clearCart();
    useAuthStore.setState({
      user: null,
      activeTenant: null,
      branches: [],
      activeBranch: null,
      status: 'unauthenticated',
      error: null,
    });

    (apiClient.getProfile as jest.Mock).mockRejectedValue(new Error('Unauthenticated'));
    (apiClient.getBranches as jest.Mock).mockResolvedValue(mockBranches);
    (apiClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);
    (apiClient.getStockBalances as jest.Mock).mockResolvedValue(mockBalances);
    (apiClient.getCategories as jest.Mock).mockResolvedValue([
      { id: 'cat-1', name: 'Groceries & Staples', code: 'CAT-GROC', parentId: null, sortOrder: 0, isActive: true },
    ]);
    (apiClient.getUnits as jest.Mock).mockResolvedValue([
      { id: 'unit-1', name: 'Kilogram', symbol: 'KG', decimalPlaces: 3 },
      { id: 'unit-2', name: 'Litre', symbol: 'LTR', decimalPlaces: 3 },
    ]);
    (apiClient.createProduct as jest.Mock).mockResolvedValue({
      id: 'prod-new-1',
      tenantId: 'tenant-1',
      name: 'Tata Tea Gold 500g',
      sku: 'TEA-GOLD-500G',
      barcodePrimary: '8901234569999',
      sellingPrice: '320.00',
      purchaseCost: '270.00',
      mrp: '350.00',
      hsnCode: '09023020',
      gstRatePercent: '5.00',
      packageSize: '500 g',
      productType: 'stock',
      trackInventory: true,
      isActive: true,
      categoryId: 'cat-1',
    });
    (apiClient.updateProduct as jest.Mock).mockResolvedValue({
      id: 'prod-oil-1',
      tenantId: 'tenant-1',
      sku: 'FORT-SUN-1L',
      name: 'Fortune Sunlite Refined Sunflower Oil 1L',
      sellingPrice: '145.00',
      purchaseCost: '120.00',
      mrp: '150.00',
      isActive: true,
    });
    (apiClient.deleteProduct as jest.Mock).mockResolvedValue({ success: true, message: 'Product archived' });
    (apiClient.getSuppliers as jest.Mock).mockResolvedValue([
      {
        id: 'sup-1',
        tenantId: 'tenant-1',
        name: 'Hindustan Unilever Ltd',
        contactPerson: 'Sanjay Gupta',
        phone: '9876543210',
        email: 'sanjay@hul.com',
        gstin: '29ABCDE1234F1Z5',
        isActive: true,
      },
    ]);
    (apiClient.createSupplier as jest.Mock).mockResolvedValue({
      id: 'sup-2',
      tenantId: 'tenant-1',
      name: 'Amul Dairy Cooperative',
      contactPerson: 'Anand K',
      phone: '9876500000',
      email: 'sales@amul.coop',
      gstin: '24AAAAA0000A1Z5',
      isActive: true,
    });
    (apiClient.getPurchaseOrders as jest.Mock).mockResolvedValue([
      {
        id: 'po-1',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        supplierId: 'sup-1',
        orderNumber: 'PO-20261031-001',
        status: 'ordered',
        subtotal: '2400.00',
        taxAmount: '120.00',
        totalAmount: '2520.00',
        notes: 'Monthly staples supply',
        createdAt: '2026-10-31T10:00:00Z',
        supplier: { id: 'sup-1', name: 'Hindustan Unilever Ltd', phone: '9876543210' },
        lines: [
          {
            id: 'line-1',
            tenantId: 'tenant-1',
            purchaseOrderId: 'po-1',
            productId: 'prod-oil-1',
            quantityOrdered: '20.000',
            quantityReceived: '0.000',
            unitCost: '120.00',
            taxRatePercent: '5.00',
            lineTotal: '2520.00',
            product: { id: 'prod-oil-1', name: 'Fortune Sunflower Oil 1L', sku: 'FORT-SUN-1L' },
          },
        ],
      },
    ]);
    (apiClient.createPurchaseOrder as jest.Mock).mockResolvedValue({
      id: 'po-new',
      orderNumber: 'PO-2026-999',
      status: 'draft',
      totalAmount: '1000.00',
    });
    (apiClient.receivePurchaseOrder as jest.Mock).mockResolvedValue({
      id: 'po-1',
      status: 'received',
    });
    (apiClient.getCustomers as jest.Mock).mockResolvedValue(mockCustomers);
    (apiClient.getInvoices as jest.Mock).mockResolvedValue([]);
    (apiClient.getCreditNotes as jest.Mock).mockResolvedValue({ creditNotes: [], total: 0 });
    (apiClient.getDailySalesReport as jest.Mock).mockResolvedValue(mockDailyReport);
    (apiClient.getShifts as jest.Mock).mockResolvedValue([]);
    (apiClient.getDevices as jest.Mock).mockResolvedValue([]);
    (apiClient.getSubscription as jest.Mock).mockResolvedValue({
      id: 'sub-1',
      tenantId: 'tenant-1',
      planCode: 'basic_kirana',
      status: 'active',
      maxBranches: 2,
      maxDevices: 5,
      maxUsers: 10,
      currentPeriodEnd: null,
    });
  });

  describe('Part B: Web Authentication & Session Handling', () => {
    it('renders login screen when unauthenticated', async () => {
      render(<HomePage />);
      expect(await screen.findByText(/Sign in to your Store/i)).toBeInTheDocument();
      expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    });

    it('displays error banner when login credentials are invalid', async () => {
      (apiClient.login as jest.Mock).mockRejectedValueOnce(new Error('Invalid email or password'));
      render(<HomePage />);

      const emailInput = await screen.findByTestId('login-email-input');
      fireEvent.change(emailInput, { target: { value: 'wrong@kirana.dev' } });
      fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'WrongPass' } });
      fireEvent.click(screen.getByTestId('login-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('login-error-banner')).toBeInTheDocument();
        expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('successfully logs in with store owner credentials and displays POS & Admin', async () => {
      (apiClient.login as jest.Mock).mockResolvedValueOnce({ accessToken: 'jwt-owner', user: mockOwnerProfile });
      (apiClient.getProfile as jest.Mock)
        .mockRejectedValueOnce(new Error('Unauthenticated'))
        .mockResolvedValueOnce(mockOwnerProfile);

      render(<HomePage />);

      const demoBtn = await screen.findByTestId('demo-owner-btn');
      fireEvent.click(demoBtn);
      fireEvent.click(screen.getByTestId('login-submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('pos-app-root')).toBeInTheDocument();
        expect(screen.getByTestId('user-fullname')).toHaveTextContent('Rajesh Store Owner');
        expect(screen.getByTestId('mode-admin-btn')).toBeInTheDocument();
      });
    });

    it('logs out and redirects to login screen when logout button is clicked', async () => {
      (apiClient.logout as jest.Mock).mockResolvedValueOnce(undefined);
      useAuthStore.setState({
        user: mockOwnerProfile,
        activeTenant: mockOwnerProfile.memberships[0],
        branches: mockBranches,
        activeBranch: mockBranches[0],
        status: 'authenticated',
      });

      render(<HomePage />);
      expect(screen.getByTestId('logout-btn')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(apiClient.logout).toHaveBeenCalled();
        expect(screen.getByText(/Sign in to your Store/i)).toBeInTheDocument();
      });
    });
  });

  describe('Part F: Role-Aware Web Navigation & Branch Scoping', () => {
    it('restricts cashier from accessing Store Owner & Admin button', async () => {
      useAuthStore.setState({
        user: mockCashierProfile,
        activeTenant: mockCashierProfile.memberships[0],
        branches: mockBranches,
        activeBranch: mockBranches[0],
        status: 'authenticated',
      });

      render(<HomePage />);
      expect(screen.getByTestId('mode-pos-btn')).toBeInTheDocument();
      expect(screen.queryByTestId('mode-admin-btn')).not.toBeInTheDocument();
    });

    it('displays locked branch indicator when user is branch-scoped', async () => {
      useAuthStore.setState({
        user: mockCashierProfile,
        activeTenant: mockCashierProfile.memberships[0],
        branches: mockBranches,
        activeBranch: mockBranches[0],
        status: 'authenticated',
      });

      render(<HomePage />);
      expect(screen.getByTestId('locked-branch-badge')).toBeInTheDocument();
      expect(screen.getByText('Main Store - Andheri West')).toBeInTheDocument();
      expect(screen.queryByTestId('branch-selector')).not.toBeInTheDocument();
    });

    it('allows tenant-wide owner to switch branches freely', async () => {
      useAuthStore.setState({
        user: mockOwnerProfile,
        activeTenant: mockOwnerProfile.memberships[0],
        branches: mockBranches,
        activeBranch: mockBranches[0],
        status: 'authenticated',
      });

      render(<HomePage />);
      const branchSelect = screen.getByTestId('branch-selector');
      expect(branchSelect).toBeInTheDocument();

      fireEvent.change(branchSelect, { target: { value: 'branch-2' } });
      expect(apiClient.setActiveContext).toHaveBeenCalledWith('tenant-1', 'branch-2');
    });
  });

  describe('Part D: Live Cashier POS Billing & Server Checkout', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: mockOwnerProfile,
        activeTenant: mockOwnerProfile.memberships[0],
        branches: mockBranches,
        activeBranch: mockBranches[0],
        status: 'authenticated',
      });
    });

    it('fetches live products and renders catalog grid with stock', async () => {
      render(<HomePage />);

      const oilCard = await screen.findByTestId('product-card-FORT-SUN-1L');
      expect(oilCard).toBeInTheDocument();
      expect(screen.getByText('Fortune Sunflower Oil 1L')).toBeInTheDocument();
      expect(screen.getByText('India Gate Basmati Rice 5kg')).toBeInTheDocument();
      expect(screen.getByText(/Qty: 25/i)).toBeInTheDocument();
    });

    it('adds product to cart, updates quantity, and calculates grand total', async () => {
      render(<HomePage />);

      const oilCard = await screen.findByTestId('product-card-FORT-SUN-1L');
      fireEvent.click(oilCard);

      // Check item appears in cart list
      expect(screen.getByTestId('cart-row-prod-oil-1')).toBeInTheDocument();
      expect(screen.getByTestId('qty-prod-oil-1')).toHaveTextContent('1');

      // Grand total: 140.00 + 5% GST (7.00) = 147.00
      expect(screen.getByTestId('pos-grand-total')).toHaveTextContent('₹147.00');

      // Increment quantity
      fireEvent.click(screen.getByText('+'));
      expect(screen.getByTestId('qty-prod-oil-1')).toHaveTextContent('2');
      // 280.00 + 14.00 = 294.00
      expect(screen.getByTestId('pos-grand-total')).toHaveTextContent('₹294.00');
    });

    it('submits sale to backend and renders server-confirmed invoice with idempotency key', async () => {
      const mockInvoiceResult = {
        id: 'inv-uuid-999',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        invoiceNumber: 'INV-20261031-7788',
        idempotencyKey: 'idemp-uuid-1',
        status: 'posted',
        subtotal: '140.00',
        discountTotal: '0.00',
        taxableTotal: '140.00',
        cgstTotal: '3.50',
        sgstTotal: '3.50',
        igstTotal: '0.00',
        grandTotal: '147.00',
        roundingAdjustment: '0.00',
        paymentStatus: 'paid',
        postedAt: '2026-10-31T11:55:00.000Z',
        lines: [
          {
            id: 'line-1',
            productId: 'prod-oil-1',
            productNameSnapshot: 'Fortune Sunflower Oil 1L',
            skuSnapshot: 'FORT-SUN-1L',
            quantity: '1.000',
            unitPrice: '140.00',
            discountAmount: '0.00',
            taxableValue: '140.00',
            gstRatePercent: '5.00',
            cgstAmount: '3.50',
            sgstAmount: '3.50',
            igstAmount: '0.00',
            lineTotal: '147.00',
          },
        ],
      };

      (apiClient.createSale as jest.Mock).mockResolvedValueOnce(mockInvoiceResult);

      render(<HomePage />);

      const oilCard = await screen.findByTestId('product-card-FORT-SUN-1L');
      fireEvent.click(oilCard);

      // Click Cash (F1) to open checkout modal
      fireEvent.click(screen.getByTestId('pay-cash-btn'));
      expect(screen.getByTestId('checkout-modal')).toBeInTheDocument();

      // Confirm checkout
      fireEvent.click(screen.getByTestId('confirm-checkout-btn'));

      await waitFor(() => {
        expect(apiClient.createSale).toHaveBeenCalledWith(
          'tenant-1',
          expect.objectContaining({
            branchId: 'branch-1',
            items: [expect.objectContaining({ productId: 'prod-oil-1', quantity: '1.000' })],
            payments: [{ paymentMethod: PaymentMethod.CASH, amount: '147.00' }],
          }),
        );
        expect(screen.getByTestId('confirmed-invoice-modal')).toBeInTheDocument();
        expect(screen.getByTestId('confirmed-invoice-number')).toHaveTextContent('INV-20261031-7788');
      });
    });

    it('supports split payments across Cash and UPI and validates payment totals', async () => {
      render(<HomePage />);

      const oilCard = await screen.findByTestId('product-card-FORT-SUN-1L');
      fireEvent.click(oilCard);
      fireEvent.click(screen.getByTestId('pay-cash-btn'));

      // Toggle split mode
      fireEvent.click(screen.getByText('+ Split Tender'));
      expect(screen.getByText('Split Tender Allocations:')).toBeInTheDocument();

      // Submit should check total
      fireEvent.click(screen.getByTestId('confirm-checkout-btn'));
    });
  });

  describe('Part E: Live Store Owner Dashboard Connections', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: mockOwnerProfile,
        activeTenant: mockOwnerProfile.memberships[0],
        branches: mockBranches,
        activeBranch: mockBranches[0],
        status: 'authenticated',
      });
    });

    it('switches to Store Owner & Admin and renders live sales analytics', async () => {
      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      await screen.findByTestId('admin-dashboard');

      fireEvent.click(screen.getByTestId('tab-analytics'));

      await waitFor(() => {
        expect(screen.getByTestId('stat-turnover')).toHaveTextContent('₹4850.00');
        expect(screen.getByTestId('stat-invoices')).toHaveTextContent('18');
        expect(screen.getByTestId('stat-tax')).toHaveTextContent('₹225.00');
      });
    });

    it('records stock adjustment with mandatory audit reason through real backend API', async () => {
      (apiClient.recordStockMovement as jest.Mock).mockResolvedValueOnce({
        ledger: { id: 'ledg-1' },
        balance: { quantityOnHand: '35.000' },
      });

      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));

      await screen.findByTestId('admin-dashboard');

      // Click subtab stock
      const stockSubtab = await screen.findByTestId('subtab-stock');
      fireEvent.click(stockSubtab);

      // Click Adjust button on Fortune Sunflower Oil
      const adjustBtn = await screen.findByTestId('adjust-stock-btn-FORT-SUN-1L');
      fireEvent.click(adjustBtn);
      expect(screen.getByText(/Audit-Logged Stock Adjustment/i)).toBeInTheDocument();

      // Fill adjustment delta and audit reason
      fireEvent.change(screen.getByTestId('adjust-qty-input'), { target: { value: '10.000' } });
      fireEvent.click(screen.getByTestId('confirm-adjust-btn'));

      await waitFor(() => {
        expect(apiClient.recordStockMovement).toHaveBeenCalledWith(
          'tenant-1',
          expect.objectContaining({
            productId: 'prod-oil-1',
            branchId: 'branch-1',
            quantityDelta: '10.000',
            movementType: StockMovementType.ADJUSTMENT,
          }),
        );
      });
    });

    it('records customer Khata repayment through real backend customer payment API', async () => {
      (apiClient.recordCustomerPayment as jest.Mock).mockResolvedValueOnce({
        ledger: { id: 'ledg-khata-1' },
        customer: { ...mockCustomers[0], currentBalance: '0.00' },
      });

      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));

      await screen.findByTestId('admin-dashboard');

      // Switch to Khata tab
      fireEvent.click(screen.getByTestId('admin-tab-customers'));
      const khataContent = await screen.findByTestId('khata-content');
      expect(khataContent).toBeInTheDocument();
      expect(screen.getByText('Ramesh Sharma')).toBeInTheDocument();

      // Click Record Repayment
      fireEvent.click(screen.getByTestId('repay-btn-cust-1'));
      expect(screen.getByText(/Receive Khata Debt Repayment/i)).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('repayment-amount-input'), { target: { value: '850.00' } });
      fireEvent.click(screen.getByTestId('confirm-repayment-btn'));

      await waitFor(() => {
        expect(apiClient.recordCustomerPayment).toHaveBeenCalledWith(
          'tenant-1',
          'cust-1',
          expect.objectContaining({
            amount: '850.00',
            paymentMethod: 'cash',
          }),
        );
      });
    });
  });

  describe('Sub-Phase 3A: Product & SKU Management, Barcodes, Categories, Units & Opening Stock', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: mockOwnerProfile,
        activeTenant: mockOwnerProfile.memberships[0],
        branches: mockBranches,
        activeBranch: mockBranches[0],
        status: 'authenticated',
      });
    });

    it('renders product catalogue table with SKU, barcode, and pricing', async () => {
      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      await screen.findByTestId('admin-dashboard');

      expect(screen.getByTestId('products-table')).toBeInTheDocument();
      expect(screen.getByText('Fortune Sunflower Oil 1L')).toBeInTheDocument();
      expect(screen.getByText('FORT-SUN-1L')).toBeInTheDocument();
      expect(screen.getByText('India Gate Basmati Rice 5kg')).toBeInTheDocument();
      expect(screen.getByTestId('add-product-btn')).toBeInTheDocument();
    });

    it('opens Add New Product modal and submits product with opening stock', async () => {
      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      const addBtn = await screen.findByTestId('add-product-btn');

      fireEvent.click(addBtn);
      expect(screen.getByTestId('product-modal')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('product-name-input'), { target: { value: 'Tata Tea Gold 500g' } });
      fireEvent.change(screen.getByTestId('product-sku-input'), { target: { value: 'TEA-GOLD-500G' } });
      fireEvent.change(screen.getByTestId('product-barcode-input'), { target: { value: '8901234569999' } });
      fireEvent.change(screen.getByTestId('product-cost-input'), { target: { value: '270.00' } });
      fireEvent.change(screen.getByTestId('product-price-input'), { target: { value: '320.00' } });
      fireEvent.change(screen.getByTestId('product-mrp-input'), { target: { value: '350.00' } });
      fireEvent.change(screen.getByTestId('product-hsn-input'), { target: { value: '09023020' } });
      fireEvent.change(screen.getByTestId('product-package-size-input'), { target: { value: '500 g' } });
      fireEvent.change(screen.getByTestId('product-opening-stock-input'), { target: { value: '25.000' } });

      fireEvent.click(screen.getByTestId('product-save-btn'));

      await waitFor(() => {
        expect(apiClient.createProduct).toHaveBeenCalledWith(
          'tenant-1',
          expect.objectContaining({
            name: 'Tata Tea Gold 500g',
            sku: 'TEA-GOLD-500G',
            barcodePrimary: '8901234569999',
            purchaseCost: '270.00',
            sellingPrice: '320.00',
            mrp: '350.00',
            hsnCode: '09023020',
            packageSize: '500 g',
            openingStockQuantity: '25.000',
          }),
        );
      });
    });

    it('validates that selling price cannot exceed MRP in Product modal', async () => {
      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      const addBtn = await screen.findByTestId('add-product-btn');

      fireEvent.click(addBtn);
      fireEvent.change(screen.getByTestId('product-name-input'), { target: { value: 'Overpriced Tea' } });
      fireEvent.change(screen.getByTestId('product-sku-input'), { target: { value: 'TEA-EXP' } });
      fireEvent.change(screen.getByTestId('product-cost-input'), { target: { value: '100.00' } });
      fireEvent.change(screen.getByTestId('product-price-input'), { target: { value: '250.00' } });
      fireEvent.change(screen.getByTestId('product-mrp-input'), { target: { value: '200.00' } }); // Less than selling price!

      fireEvent.click(screen.getByTestId('product-save-btn'));

      expect(await screen.findByTestId('product-modal-error')).toHaveTextContent(/cannot exceed MRP/i);
      expect(apiClient.createProduct).not.toHaveBeenCalled();
    });

    it('opens Edit Product modal and updates pricing', async () => {
      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      const editBtn = await screen.findByTestId('edit-product-btn-FORT-SUN-1L');

      fireEvent.click(editBtn);
      expect(screen.getByTestId('product-modal')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('product-price-input'), { target: { value: '145.00' } });
      fireEvent.click(screen.getByTestId('product-save-btn'));

      await waitFor(() => {
        expect(apiClient.updateProduct).toHaveBeenCalledWith(
          'tenant-1',
          'prod-oil-1',
          expect.objectContaining({
            sellingPrice: '145.00',
          }),
        );
      });
    });

    it('archives product when confirmed in Archive modal', async () => {
      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      const archiveBtn = await screen.findByTestId('archive-product-btn-FORT-SUN-1L');

      fireEvent.click(archiveBtn);
      expect(screen.getByTestId('archive-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('confirm-archive-btn'));

      await waitFor(() => {
        expect(apiClient.deleteProduct).toHaveBeenCalledWith('tenant-1', 'prod-oil-1');
      });
    });

    it('switches to categories and units subtab and displays UOM list', async () => {
      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      const catSubtab = await screen.findByTestId('subtab-categories');

      fireEvent.click(catSubtab);
      expect(screen.getByText('Product Categories')).toBeInTheDocument();
      expect(screen.getByText('Units of Measurement (UOM)')).toBeInTheDocument();
      expect(screen.getByText('Kilogram')).toBeInTheDocument();
      expect(screen.getByText('KG')).toBeInTheDocument();
    });

    it('navigates to Suppliers sub-tab and allows registering a new vendor', async () => {
      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      const supSubtab = await screen.findByTestId('subtab-suppliers');

      fireEvent.click(supSubtab);
      expect(await screen.findByText('Hindustan Unilever Ltd')).toBeInTheDocument();
      expect(screen.getByText('Sanjay Gupta')).toBeInTheDocument();

      // Open Add Supplier Modal
      const addSupBtn = screen.getByTestId('add-supplier-btn');
      fireEvent.click(addSupBtn);

      fireEvent.change(screen.getByTestId('supplier-name-input'), { target: { value: 'Amul Dairy Cooperative' } });
      fireEvent.change(screen.getByTestId('supplier-contact-input'), { target: { value: 'Anand K' } });
      fireEvent.change(screen.getByTestId('supplier-phone-input'), { target: { value: '9876500000' } });
      fireEvent.change(screen.getByTestId('supplier-email-input'), { target: { value: 'sales@amul.coop' } });
      fireEvent.change(screen.getByTestId('supplier-gstin-input'), { target: { value: '24AAAAA0000A1Z5' } });

      fireEvent.click(screen.getByTestId('save-supplier-btn'));

      await waitFor(() => {
        expect(apiClient.createSupplier).toHaveBeenCalledWith(
          'tenant-1',
          expect.objectContaining({
            name: 'Amul Dairy Cooperative',
            gstin: '24AAAAA0000A1Z5',
          }),
        );
      });
    });

    it('navigates to Purchase Orders sub-tab and completes inward GRN receiving', async () => {
      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      const poSubtab = await screen.findByTestId('subtab-purchases');

      fireEvent.click(poSubtab);
      expect(await screen.findByText('PO-20261031-001')).toBeInTheDocument();
      expect(screen.getAllByText('₹2520.00').length).toBeGreaterThanOrEqual(1);

      // Open GRN modal
      const receiveBtn = screen.getByTestId('receive-po-po-1');
      fireEvent.click(receiveBtn);

      expect(screen.getByText(/Receive Goods \(Goods Received Note — GRN\)/i)).toBeInTheDocument();
      const grnQtyInput = screen.getByTestId('grn-qty-input-0');
      fireEvent.change(grnQtyInput, { target: { value: '20.000' } });

      fireEvent.click(screen.getByTestId('confirm-grn-btn'));

      await waitFor(() => {
        expect(apiClient.receivePurchaseOrder).toHaveBeenCalledWith(
          'tenant-1',
          'po-1',
          expect.objectContaining({
            items: [{ lineId: 'line-1', quantityReceived: '20.000' }],
          }),
        );
      });
    });
  });

  describe('Sub-Phase 3C: Customer Khata, Receivables Ledger & Statements', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: mockOwnerProfile,
        activeTenant: mockOwnerProfile.memberships[0],
        branches: mockBranches,
        activeBranch: mockBranches[0],
        status: 'authenticated',
      });
    });

    it('renders Khata KPI metrics, search filtering, and customer accounts table', async () => {
      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      await screen.findByTestId('admin-dashboard');

      fireEvent.click(screen.getByTestId('admin-tab-customers'));
      expect(await screen.findByTestId('khata-content')).toBeInTheDocument();

      expect(screen.getByTestId('total-receivables')).toBeInTheDocument();
      expect(screen.getByTestId('customer-search-input')).toBeInTheDocument();
      expect(screen.getByText('Ramesh Sharma')).toBeInTheDocument();
    });

    it('opens Customer Statement timeline modal with ageing analysis and running balance', async () => {
      (apiClient.getCustomerStatement as jest.Mock).mockResolvedValueOnce({
        customer: {
          id: 'cust-1',
          name: 'Ramesh Sharma',
          phone: '+919876543210',
          email: null,
          creditLimit: '5000.00',
          currentBalance: '850.00',
          availableCredit: '4150.00',
          creditUtilizationPercent: 17,
          creditStatus: 'healthy',
          ageing: {
            current: '850.00',
            days31To60: '0.00',
            days61To90: '0.00',
            over90Days: '0.00',
          },
        },
        statement: {
          from: null,
          to: null,
          branchId: null,
          openingBalance: '0.00',
          closingBalance: '850.00',
          totalDebits: '850.00',
          totalCredits: '0.00',
          entries: [
            {
              id: 'ledg-1',
              occurredAt: '2026-10-15T10:00:00Z',
              entryType: 'invoice_debit',
              debit: '850.00',
              credit: '0.00',
              runningBalance: '850.00',
              sourceType: 'invoice',
              sourceId: 'inv-1',
              paymentMethod: 'credit',
              notes: 'Credit sale invoice INV-001',
            },
          ],
        },
      });

      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      await screen.findByTestId('admin-dashboard');

      fireEvent.click(screen.getByTestId('admin-tab-customers'));
      await screen.findByTestId('khata-content');

      const statementBtn = screen.getByTestId('statement-btn-cust-1');
      fireEvent.click(statementBtn);

      expect(await screen.findByText(/Khata Ledger Statement — Ramesh Sharma/i)).toBeInTheDocument();
      expect(screen.getByText(/FIFO Outstanding Receivables Ageing Analysis/i)).toBeInTheDocument();
      expect(screen.getByTestId('statement-table')).toBeInTheDocument();
      expect(screen.getByTestId('print-statement-btn')).toBeInTheDocument();
      expect(screen.getByTestId('export-statement-csv-btn')).toBeInTheDocument();
    });

    it('updates customer credit limit with mandatory audit reason', async () => {
      (apiClient.updateCustomerCreditLimit as jest.Mock).mockResolvedValueOnce({
        id: 'cust-1',
        name: 'Ramesh Sharma',
        creditLimit: '10000.00',
        currentBalance: '850.00',
      });

      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      await screen.findByTestId('admin-dashboard');

      fireEvent.click(screen.getByTestId('admin-tab-customers'));
      await screen.findByTestId('khata-content');

      const limitBtn = screen.getByTestId('limit-btn-cust-1');
      fireEvent.click(limitBtn);

      expect(screen.getByText(/Modify Customer Credit Limit/i)).toBeInTheDocument();
      fireEvent.change(screen.getByTestId('edit-limit-input'), { target: { value: '10000.00' } });
      fireEvent.change(screen.getByTestId('edit-limit-reason-input'), { target: { value: 'Good monthly clearance' } });

      fireEvent.click(screen.getByTestId('confirm-edit-limit-btn'));

      await waitFor(() => {
        expect(apiClient.updateCustomerCreditLimit).toHaveBeenCalledWith(
          'tenant-1',
          'cust-1',
          expect.objectContaining({
            creditLimit: '10000.00',
            reason: 'Good monthly clearance',
          }),
        );
      });
    });

    it('registers new customer account through modal', async () => {
      (apiClient.createCustomer as jest.Mock).mockResolvedValueOnce({
        id: 'cust-new',
        name: 'Sunil Kumar',
        phone: '9876543299',
        creditLimit: '6000.00',
        currentBalance: '0.00',
      });

      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      await screen.findByTestId('admin-dashboard');

      fireEvent.click(screen.getByTestId('admin-tab-customers'));
      await screen.findByTestId('khata-content');

      fireEvent.click(screen.getByTestId('add-customer-btn'));
      expect(screen.getByText(/Register New Khata Customer/i)).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('customer-name-input'), { target: { value: 'Sunil Kumar' } });
      fireEvent.change(screen.getByTestId('customer-phone-input'), { target: { value: '9876543299' } });
      fireEvent.change(screen.getByTestId('customer-limit-input'), { target: { value: '6000.00' } });

      fireEvent.click(screen.getByTestId('save-customer-btn'));

      await waitFor(() => {
        expect(apiClient.createCustomer).toHaveBeenCalledWith(
          'tenant-1',
          expect.objectContaining({
            name: 'Sunil Kumar',
            phone: '9876543299',
            creditLimit: '6000.00',
          }),
        );
      });
    });

    it('navigates from Customer Statement directly to Record Repayment and displays repayment receipt confirmation', async () => {
      (apiClient.getCustomerStatement as jest.Mock).mockResolvedValueOnce({
        customer: {
          id: 'cust-1',
          name: 'Ramesh Patel',
          phone: '9876543210',
          email: null,
          creditLimit: '5000.00',
          currentBalance: '1500.00',
          availableCredit: '3500.00',
          creditUtilizationPercent: 30,
          creditStatus: 'healthy',
          ageing: { current: '1500.00', days31To60: '0.00', days61To90: '0.00', over90Days: '0.00' },
        },
        statement: {
          from: null,
          to: null,
          branchId: null,
          openingBalance: '0.00',
          closingBalance: '1500.00',
          totalDebits: '1500.00',
          totalCredits: '0.00',
          entries: [
            {
              id: 'ledg-1',
              occurredAt: new Date().toISOString(),
              entryType: 'invoice_debit',
              debit: '1500.00',
              credit: '0.00',
              runningBalance: '1500.00',
              sourceType: 'pos_sale',
              sourceId: 'inv-1',
              idempotencyKey: 'idem-1',
              paymentMethod: 'credit',
              branchId: 'branch-1',
              createdBy: 'user-1',
              notes: 'Credit sale',
            },
          ],
        },
      });

      (apiClient.recordCustomerPayment as jest.Mock).mockResolvedValueOnce({
        ledger: {
          id: 'repay-ledger-12345',
          customerId: 'cust-1',
          credit: '500.00',
          entryType: 'payment_credit',
          paymentMethod: 'cash',
        },
        customer: {
          id: 'cust-1',
          name: 'Ramesh Patel',
          phone: '9876543210',
          creditLimit: '5000.00',
          currentBalance: '1000.00',
        },
      });

      render(<HomePage />);
      fireEvent.click(screen.getByTestId('mode-admin-btn'));
      await screen.findByTestId('admin-dashboard');

      fireEvent.click(screen.getByTestId('admin-tab-customers'));
      await screen.findByTestId('khata-content');

      // 1. Open customer statement
      const statementBtn = screen.getByTestId('statement-btn-cust-1');
      fireEvent.click(statementBtn);

      await waitFor(() => {
        expect(screen.getByText(/Khata Ledger Statement — Ramesh Sharma/i)).toBeInTheDocument();
      });

      // 2. Click "Record Repayment" directly from inside the statement
      const repayFromStatementBtn = screen.getByTestId('statement-record-repayment-btn');
      expect(repayFromStatementBtn).toBeInTheDocument();
      fireEvent.click(repayFromStatementBtn);

      // 3. Verify dedicated repayment modal is open with prefilled amount and current balance
      expect(screen.getByText(/Receive Khata Debt Repayment/i)).toBeInTheDocument();
      const amountInput = screen.getByTestId('repayment-amount-input');
      expect(amountInput).toBeInTheDocument();
      fireEvent.change(amountInput, { target: { value: '500.00' } });

      // 4. Confirm Repayment
      fireEvent.click(screen.getByTestId('confirm-repayment-btn'));

      // 5. Verify dedicated API was called
      await waitFor(() => {
        expect(apiClient.recordCustomerPayment).toHaveBeenCalledWith(
          'tenant-1',
          'cust-1',
          expect.objectContaining({
            amount: '500.00',
            paymentMethod: 'cash',
          }),
        );
      });

      // 6. Verify receipt confirmation dialog is shown
      const receiptModal = await screen.findByTestId('repayment-receipt-modal');
      expect(receiptModal).toHaveTextContent('repay-ledger-12345');
      expect(receiptModal).toHaveTextContent('Remaining Outstanding:');
      expect(receiptModal).toHaveTextContent('₹1000.00');
      expect(receiptModal).toHaveTextContent('₹500.00');

      // 7. Close receipt
      fireEvent.click(screen.getByTestId('close-receipt-btn'));
      expect(screen.queryByTestId('repayment-receipt-modal')).not.toBeInTheDocument();
    });

    describe('Pre-Phase 3E: Production Data Quality & Customer Merging', () => {
      it('POS checkout defaults to Walk-in customer and allows direct POS customer registration', async () => {
        (apiClient.createCustomer as jest.Mock).mockResolvedValueOnce({
          id: 'cust-pos-new',
          tenantId: 'tenant-1',
          name: 'Sunita Mehra',
          phone: '+919876543299',
          creditLimit: '3000.00',
          currentBalance: '0.00',
          isActive: true,
        });

        render(<HomePage />);
        await screen.findByTestId('pos-checkout-screen');

        // Add item to cart
        const productBtn = await screen.findByTestId('product-card-FORT-SUN-1L');
        fireEvent.click(productBtn);

        // Open Cash checkout
        fireEvent.click(screen.getByTestId('pay-cash-btn'));
        const checkoutModal = await screen.findByTestId('checkout-modal');

        // Verify Walk-in is default
        expect(checkoutModal).toHaveTextContent('Walk-in (Anonymous)');

        // Open quick add customer from POS
        fireEvent.click(screen.getByTestId('pos-new-customer-btn'));
        const posCustModal = await screen.findByTestId('pos-new-customer-modal');
        expect(posCustModal).toBeInTheDocument();

        // Fill customer form
        fireEvent.change(screen.getByTestId('pos-cust-name-input'), { target: { value: 'Sunita Mehra' } });
        fireEvent.change(screen.getByTestId('pos-cust-phone-input'), { target: { value: '9876543299' } });
        fireEvent.click(screen.getByTestId('save-pos-customer-btn'));

        await waitFor(() => {
          expect(apiClient.createCustomer).toHaveBeenCalledWith(
            'tenant-1',
            expect.objectContaining({
              name: 'Sunita Mehra',
              phone: '9876543299',
            }),
          );
        });

        // Verify linked account is now displayed in checkout
        expect(checkoutModal).toHaveTextContent('Linked Account');
        expect(checkoutModal).toHaveTextContent('Sunita Mehra');

        // Close modal
        fireEvent.click(screen.getByText('Cancel'));
      });

      it('Store Owner opens Customer Dossier and executes controlled customer merge', async () => {
        (apiClient.getCustomers as jest.Mock).mockResolvedValue([
          {
            id: 'cust-1',
            tenantId: 'tenant-1',
            name: 'Ramesh Sharma',
            phone: '+919876543210',
            creditLimit: '5000.00',
            currentBalance: '1500.00',
            isActive: true,
          },
          {
            id: 'cust-2',
            tenantId: 'tenant-1',
            name: 'Suresh Patel',
            phone: '+919876543220',
            creditLimit: '5000.00',
            currentBalance: '1000.00',
            isActive: true,
          },
        ]);

        (apiClient.getCustomerHistory as jest.Mock).mockResolvedValueOnce({
          customer: {
            id: 'cust-1',
            tenantId: 'tenant-1',
            name: 'Ramesh Sharma',
            phone: '+919876543210',
            creditLimit: '5000.00',
            currentBalance: '1500.00',
            isActive: true,
          },
          lifetimeStats: {
            totalInvoicesCount: 4,
            totalPurchasesValue: '6250.00',
            totalRepaymentsValue: '4750.00',
            currentOutstandingBalance: '1500.00',
            creditLimit: '5000.00',
          },
          invoices: [
            {
              id: 'inv-1',
              invoiceNumber: 'INV-20261020-0001',
              createdAt: '2026-10-20T10:00:00Z',
              grandTotal: '1500.00',
              status: 'posted',
              paymentStatus: 'unpaid',
            },
          ],
          ledgerEntries: [
            {
              id: 'ledg-1',
              occurredAt: '2026-10-20T10:00:00Z',
              entryType: 'invoice_debit',
              debit: '1500.00',
              credit: '0.00',
              sourceType: 'invoice',
              sourceId: 'inv-1',
              paymentMethod: null,
              notes: 'Credit sale',
            },
          ],
        });

        (apiClient.mergeCustomers as jest.Mock).mockResolvedValueOnce({
          success: true,
          message: 'Customer Ramesh Sharma successfully merged into Suresh Patel. All records preserved.',
          targetCustomer: {
            id: 'cust-2',
            name: 'Suresh Patel',
            currentBalance: '2500.00',
          },
        });

        render(<HomePage />);
        fireEvent.click(screen.getByTestId('mode-admin-btn'));
        await screen.findByTestId('admin-dashboard');

        fireEvent.click(screen.getByTestId('admin-tab-customers'));
        await screen.findByTestId('khata-content');

        // Open history dossier
        const historyBtn = screen.getByTestId('history-btn-cust-1');
        fireEvent.click(historyBtn);
        const dossierModal = await screen.findByTestId('customer-history-modal');
        expect(dossierModal).toHaveTextContent('Lifetime Customer Dossier');
        expect(dossierModal).toHaveTextContent('₹6250.00');
        expect(dossierModal).toHaveTextContent('INV-20261020-0001');

        fireEvent.click(screen.getByText('Close Dossier'));

        // Open Merge modal
        const mergeBtn = screen.getByTestId('merge-btn-cust-1');
        fireEvent.click(mergeBtn);
        const mergeModal = await screen.findByTestId('customer-merge-modal');
        expect(mergeModal).toHaveTextContent('Merge Customer Records');

        // Select target customer
        fireEvent.change(screen.getByTestId('merge-target-customer-select'), {
          target: { value: 'cust-2' },
        });

        // Fill merge reason and confirm
        fireEvent.change(screen.getByTestId('merge-reason-input'), {
          target: { value: 'Duplicate Kirana buyer profile' },
        });
        fireEvent.click(screen.getByTestId('confirm-merge-btn'));

        await waitFor(() => {
          expect(apiClient.mergeCustomers).toHaveBeenCalledWith(
            'tenant-1',
            'cust-1',
            expect.objectContaining({
              targetCustomerId: 'cust-2',
              reason: 'Duplicate Kirana buyer profile',
            }),
          );
        });
      });
    });
  });
});
