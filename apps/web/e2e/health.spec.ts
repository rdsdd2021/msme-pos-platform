import { test, expect } from '@playwright/test';

test.describe('Application shell', () => {
  test('home page loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/POS Platform/);
    await expect(page.getByText('POS Platform')).toBeVisible();
  });

  test('home page shows development status', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Development environment initialised/i)).toBeVisible();
  });
});
