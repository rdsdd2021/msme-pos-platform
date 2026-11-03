import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingWizard } from './onboarding-wizard';
import { useAuthStore } from '@/store/auth.store';

// Mock the auth store
jest.mock('@/store/auth.store');

describe('OnboardingWizard Component', () => {
  const mockRegisterMerchant = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      registerMerchant: mockRegisterMerchant,
      status: 'idle',
      error: null,
      clearError: mockClearError,
    });
  });

  it('renders Step 1 with store name input, industry verticals, and state selector', () => {
    render(<OnboardingWizard />);

    expect(screen.getByText('Create Store Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ramesh Kirana & Supermarket/i)).toBeInTheDocument();
    expect(screen.getByText('Kirana & Grocery')).toBeInTheDocument();
    expect(screen.getByText('Restaurant & Cafe')).toBeInTheDocument();
    expect(screen.getByText('Pharmacy & Chemist')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
  });

  it('validates store name and advances to Step 2', async () => {
    render(<OnboardingWizard />);

    const step1Form = screen.getByTestId('onboarding-step1-form');
    fireEvent.submit(step1Form);

    // Validation error shown
    expect(screen.getByText(/Please enter your business \/ store name/i)).toBeInTheDocument();

    // Fill in store name and advance
    const storeInput = screen.getByPlaceholderText(/Ramesh Kirana & Supermarket/i);
    fireEvent.change(storeInput, { target: { value: 'Shree Krishna Sweets & Snacks' } });
    fireEvent.submit(step1Form);

    // Should now be on Step 2
    await waitFor(() => {
      expect(screen.getByText(/Owner Full Name/i)).toBeInTheDocument();
      expect(screen.getByText(/Email Address \(Login ID\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Pre-load fast-moving starter catalog/i)).toBeInTheDocument();
    });
  });

  it('validates password requirement and submits registerMerchant successfully', async () => {
    mockRegisterMerchant.mockResolvedValueOnce(undefined);
    const mockSuccess = jest.fn();

    render(<OnboardingWizard onSuccess={mockSuccess} />);

    // Step 1: Store info
    const storeInput = screen.getByPlaceholderText(/Ramesh Kirana & Supermarket/i);
    fireEvent.change(storeInput, { target: { value: 'Gupta Kirana Store' } });
    fireEvent.submit(screen.getByTestId('onboarding-step1-form'));

    // Step 2: Owner profile
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ramesh Gupta/i)).toBeInTheDocument();
    });

    const step2Form = screen.getByTestId('onboarding-step2-form');
    const nameInput = screen.getByPlaceholderText(/Ramesh Gupta/i);
    const emailInput = screen.getByPlaceholderText(/ramesh@guptakirana.in/i);
    const passInput = screen.getByPlaceholderText(/Min 8 characters/i);

    fireEvent.change(nameInput, { target: { value: 'Ramesh Gupta' } });
    fireEvent.change(emailInput, { target: { value: 'ramesh@guptakirana.in' } });
    fireEvent.change(passInput, { target: { value: 'Short' } });

    fireEvent.submit(step2Form);

    expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();

    // Fix password and submit
    fireEvent.change(passInput, { target: { value: 'StrongPass123!' } });
    fireEvent.submit(step2Form);

    await waitFor(() => {
      expect(mockRegisterMerchant).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'ramesh@guptakirana.in',
          password: 'StrongPass123!',
          fullName: 'Ramesh Gupta',
          storeName: 'Gupta Kirana Store',
          businessType: 'grocery',
          stateCode: '27',
          seedSampleCatalog: true,
        }),
      );
      expect(mockSuccess).toHaveBeenCalled();
    });
  });

  it('enforces GSTIN state prefix matches selected state code', async () => {
    render(<OnboardingWizard />);

    const storeInput = screen.getByPlaceholderText(/Ramesh Kirana & Supermarket/i);
    fireEvent.change(storeInput, { target: { value: 'Test Store' } });
    fireEvent.submit(screen.getByTestId('onboarding-step1-form'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ramesh Gupta/i)).toBeInTheDocument();
    });

    const step2Form = screen.getByTestId('onboarding-step2-form');
    fireEvent.change(screen.getByPlaceholderText(/Ramesh Gupta/i), { target: { value: 'Owner' } });
    fireEvent.change(screen.getByPlaceholderText(/ramesh@guptakirana.in/i), {
      target: { value: 'owner@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Min 8 characters/i), {
      target: { value: 'ValidPass123!' },
    });

    // Enter Delhi GSTIN (07) when state is Maharashtra (27)
    const gstinInput = screen.getByPlaceholderText(/27AAAAA0000A1Z5/i);
    fireEvent.change(gstinInput, { target: { value: '07AAAAA0000A1Z5' } });

    fireEvent.submit(step2Form);

    await waitFor(() => {
      expect(screen.getByText(/GSTIN state prefix \(07\) must match selected state code \(27\)/i)).toBeInTheDocument();
    });
    expect(mockRegisterMerchant).not.toHaveBeenCalled();
  });
});
