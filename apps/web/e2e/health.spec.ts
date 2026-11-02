import { test, expect } from '@playwright/test';

test.describe('Web POS & Admin End-to-End Workflow', () => {
  test('unauthenticated user sees login screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Sign in to your Store')).toBeVisible();
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-btn')).toBeVisible();
  });

  test('invalid login credentials display error banner', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('login-email-input').fill('invalid@user.com');
    await page.getByTestId('login-password-input').fill('WrongPassword123');
    await page.getByTestId('login-submit-btn').click();

    await expect(page.getByTestId('login-error-banner')).toBeVisible();
  });

  test('store owner login renders live POS terminal and allows navigating to Admin dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('demo-owner-btn')).toBeVisible();

    // Use Quick Demo Store Owner button
    await page.getByTestId('demo-owner-btn').click();
    await page.getByTestId('login-submit-btn').click();

    // Verify POS terminal loads
    await expect(page.getByTestId('pos-app-root')).toBeVisible();
    await expect(page.getByTestId('user-fullname')).toContainText('Rajesh');
    await expect(page.getByTestId('mode-pos-btn')).toBeVisible();
    await expect(page.getByTestId('mode-admin-btn')).toBeVisible();

    // Switch to Store Owner & Admin Dashboard
    await page.getByTestId('mode-admin-btn').click();
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
    await expect(page.getByText('Daily Invoices')).toBeVisible();

    // Verify Tab navigation in Admin
    await page.getByTestId('admin-tab-inventory').click();
    await expect(page.getByText('Current Stock & Valuation')).toBeVisible();

    await page.getByTestId('admin-tab-customers').click();
    await expect(page.getByText('Customer Khata & Receivables')).toBeVisible();
  });
});
