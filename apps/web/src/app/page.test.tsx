import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from './page';

describe('Web POS Checkout Page & Admin Dashboard', () => {
  it('renders Kirana POS billing title and search bar in cashier mode', () => {
    render(<HomePage />);
    expect(screen.getByText('Kirana POS Billing')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Scan Barcode \/ Enter SKU/i)).toBeInTheDocument();
  });

  it('adds product to cart when clicked and computes grand total', () => {
    render(<HomePage />);
    const oilProduct = screen.getByText('Fortune Sunflower Oil 1L');
    fireEvent.click(oilProduct);

    // Item should now appear in the cart list
    expect(screen.getAllByText('Fortune Sunflower Oil 1L').length).toBeGreaterThanOrEqual(1);

    // Grand total should calculate 140.00 + 5% GST (7.00) = 147.00
    expect(screen.getByText('₹147.00')).toBeInTheDocument();
  });

  it('processes checkout and clears cart', () => {
    render(<HomePage />);
    const saltProduct = screen.getByText('Tata Salt 1kg');
    fireEvent.click(saltProduct);

    const cashButton = screen.getByRole('button', { name: /Cash \(F1\)/i });
    fireEvent.click(cashButton);

    expect(screen.getByText(/Sale completed via CASH/i)).toBeInTheDocument();
    expect(screen.getByText(/Cart is empty/i)).toBeInTheDocument();
  });

  it('switches to Store Owner & Admin mode and displays analytics and inventory', () => {
    render(<HomePage />);
    const adminModeBtn = screen.getByTestId('mode-admin-btn');
    fireEvent.click(adminModeBtn);

    // Store Owner portal header should appear
    expect(screen.getByText(/Store Owner Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/Gross Sales/i)).toBeInTheDocument();
    expect(screen.getByText(/GST Tax Breakdown/i)).toBeInTheDocument();

    // Switch to Inventory tab
    const inventoryTab = screen.getByTestId('tab-inventory');
    fireEvent.click(inventoryTab);
    expect(screen.getByTestId('inventory-table')).toBeInTheDocument();
    expect(screen.getByText('Aashirvaad Shudh Chakki Atta 5kg')).toBeInTheDocument();

    // Switch to Khata tab
    const khataTab = screen.getByTestId('tab-khata');
    fireEvent.click(khataTab);
    expect(screen.getByTestId('khata-table')).toBeInTheDocument();
    expect(screen.getByText('Ramesh Sharma')).toBeInTheDocument();
  });
});
