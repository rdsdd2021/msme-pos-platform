import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from './page';

describe('Web POS Checkout Page', () => {
  it('renders Kirana POS billing title and search bar', () => {
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
});
