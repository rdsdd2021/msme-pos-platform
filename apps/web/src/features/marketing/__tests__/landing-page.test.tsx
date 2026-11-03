import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingPage, INDUSTRY_MODULES } from '../landing-page';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock auth store
jest.mock('@/store/auth.store', () => ({
  useAuthStore: jest.fn(() => ({
    login: jest.fn(),
    status: 'unauthenticated',
    error: null,
    clearError: jest.fn(),
  })),
}));

describe('LandingPage — Marketing & Multi-Industry Modules', () => {
  it('renders marketing hero with value proposition and badges', () => {
    render(<LandingPage />);

    expect(screen.getAllByText(/ASSISTT/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/The Modern/i)).toBeInTheDocument();
    expect(screen.getByText(/Offline-First POS/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Offline SQLite/i)).toBeInTheDocument();
    expect(screen.getByText(/GST Statutory Ready/i)).toBeInTheDocument();
  });

  it('renders all 6 industry vertical module tabs', () => {
    render(<LandingPage />);

    expect(screen.getByTestId('module-tab-grocery')).toBeInTheDocument();
    expect(screen.getByTestId('module-tab-restaurant')).toBeInTheDocument();
    expect(screen.getByTestId('module-tab-pharmacy')).toBeInTheDocument();
    expect(screen.getByTestId('module-tab-electronics')).toBeInTheDocument();
    expect(screen.getByTestId('module-tab-apparel')).toBeInTheDocument();
    expect(screen.getByTestId('module-tab-wholesale')).toBeInTheDocument();
  });

  it('displays Kirana & Grocery details by default', () => {
    render(<LandingPage />);

    expect(screen.getByText(/High-speed barcode ring-up, weighing scale sync/i)).toBeInTheDocument();
    expect(screen.getByText(/0.2s Barcode & Camera Ring-up/i)).toBeInTheDocument();
    expect(screen.getByText(/Loose Weight & Fractional Units/i)).toBeInTheDocument();
  });

  it('switches to Restaurant & Cafe module and displays table/KOT capabilities', () => {
    render(<LandingPage />);

    const restaurantTab = screen.getByTestId('module-tab-restaurant');
    fireEvent.click(restaurantTab);

    expect(screen.getByText(/Table visual management, Kitchen Order Tickets/i)).toBeInTheDocument();
    expect(screen.getByText(/Visual Floorplan & Table Mapping/i)).toBeInTheDocument();
    expect(screen.getByText(/Instant KOT Digital & Thermal Dispatch/i)).toBeInTheDocument();
  });

  it('switches to Pharmacy & Healthcare module and displays batch/prescription capabilities', () => {
    render(<LandingPage />);

    const pharmacyTab = screen.getByTestId('module-tab-pharmacy');
    fireEvent.click(pharmacyTab);

    expect(screen.getByText(/Batch expiry tracking, Schedule H1/i)).toBeInTheDocument();
    expect(screen.getByText(/FEFO Batch & Expiry Date Enforcement/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule H \/ H1 Prescription Audit/i)).toBeInTheDocument();
  });

  it('switches to Electronics & Mobile module and displays IMEI tracking', () => {
    render(<LandingPage />);

    const electronicsTab = screen.getByTestId('module-tab-electronics');
    fireEvent.click(electronicsTab);

    expect(screen.getByText(/IMEI & serial number tracking, digital warranty/i)).toBeInTheDocument();
    expect(screen.getByText(/Single-Unit Serial & IMEI Tracking/i)).toBeInTheDocument();
  });

  it('switches to Apparel & Fashion module and displays matrix variants', () => {
    render(<LandingPage />);

    const apparelTab = screen.getByTestId('module-tab-apparel');
    fireEvent.click(apparelTab);

    expect(screen.getByText(/Size x Color variant matrices/i)).toBeInTheDocument();
    expect(screen.getByText(/Size x Color x Fit Matrix/i)).toBeInTheDocument();
  });

  it('switches to Wholesale & FMCG module and displays tiered B2B pricing', () => {
    render(<LandingPage />);

    const wholesaleTab = screen.getByTestId('module-tab-wholesale');
    fireEvent.click(wholesaleTab);

    expect(screen.getByText(/Tiered bulk pricing, carton\/case packaging/i)).toBeInTheDocument();
    expect(screen.getByText(/Tiered B2B Slab Pricing/i)).toBeInTheDocument();
  });

  it('renders hardware and printer compatibility section', () => {
    render(<LandingPage />);

    expect(screen.getByText(/Works With Any Thermal Printer & Billing Machine/i)).toBeInTheDocument();
    expect(screen.getByText(/58mm & 80mm ESC\/POS Support/i)).toBeInTheDocument();
    expect(screen.getByText(/Dynamic UPI QR Codes On Every Bill/i)).toBeInTheDocument();
  });

  it('renders pricing plans for Indian MSMEs', () => {
    render(<LandingPage />);

    expect(screen.getByText(/Fair Pricing for Indian MSMEs/i)).toBeInTheDocument();
    expect(screen.getByText(/Kirana Starter/i)).toBeInTheDocument();
    expect(screen.getByText(/Retail Pro/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-Branch Enterprise/i)).toBeInTheDocument();
  });

  it('embeds login form and demo credentials in sign-in section', () => {
    render(<LandingPage />);

    expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
    expect(screen.getByTestId('demo-owner-btn')).toBeInTheDocument();
    expect(screen.getByTestId('demo-cashier-btn')).toBeInTheDocument();
  });
});
