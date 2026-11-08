const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const dataPath = 'C:/Users/Ramanuj Dey Sarkar/.gemini/antigravity/brain/cd2fd5f9-7e12-4a88-bf69-18633b2aafaa/scratch/live-test-data.json';
  if (!fs.existsSync(dataPath)) {
    console.error('live-test-data.json not found at', dataPath);
    process.exit(1);
  }
  const testData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log('Testing with account:', testData.email);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 850 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  console.log('1. Navigating to https://pos.assistt.in ...');
  await page.goto('https://pos.assistt.in', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('2. Filling login credentials on webapp...');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', testData.email);
  await page.fill('input[type="password"]', testData.password);
  await page.click('button[type="submit"]');

  console.log('3. Waiting for dashboard navigation...');
  await page.waitForSelector('[data-testid="admin-tab-inventory"]', { timeout: 20000 });
  console.log('Logged into WebApp successfully! Store loaded.');

  // Click Products & Inventory
  console.log('4. Navigating to Products & Inventory tab...');
  await page.click('[data-testid="admin-tab-inventory"]');
  await page.waitForTimeout(2000);

  // Wait for product table
  await page.waitForSelector(`text=${testData.productName}`, { timeout: 15000 });
  console.log(`Found product "${testData.productName}" in WebApp inventory!`);

  const productScreenshotPath = 'C:/Users/Ramanuj Dey Sarkar/.gemini/antigravity/brain/cd2fd5f9-7e12-4a88-bf69-18633b2aafaa/scratch/live-web-products.png';
  await page.screenshot({ path: productScreenshotPath, fullPage: false });
  console.log('Saved product verification screenshot to:', productScreenshotPath);

  // Click Bills & Invoices
  console.log('5. Navigating to Bills & Invoices tab...');
  await page.click('[data-testid="tab-invoices"]');
  await page.waitForTimeout(2000);

  // Wait for invoice
  const targetInvoice = testData.serverInvoiceNumber || testData.invoiceNumber;
  console.log(`Waiting for invoice "${targetInvoice}" in bills list...`);
  await page.waitForSelector(`text=${targetInvoice}`, { timeout: 15000 });
  console.log(`Found invoice "${targetInvoice}" in WebApp bills list!`);

  const invoiceScreenshotPath = 'C:/Users/Ramanuj Dey Sarkar/.gemini/antigravity/brain/cd2fd5f9-7e12-4a88-bf69-18633b2aafaa/scratch/live-web-invoices.png';
  await page.screenshot({ path: invoiceScreenshotPath, fullPage: false });
  console.log('Saved invoice verification screenshot to:', invoiceScreenshotPath);

  console.log('\n=== LIVE WEBAPP VERIFICATION COMPLETE: ALL CHECKS PASSED ===');
  await browser.close();
})().catch((err) => {
  console.error('Playwright verification failed:', err);
  process.exit(1);
});
