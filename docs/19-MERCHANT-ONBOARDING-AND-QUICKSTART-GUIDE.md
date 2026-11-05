# Merchant Onboarding & Quick-Start Guide
## Assistt POS — Modern Retail Management for Bharat MSMEs

Welcome to **Assistt POS**. This guide provides step-by-step operational instructions for store owners, managers, and cashiers to run daily retail counter billing, hardware pairing, customer Khata management, and GST tax filing.

---

## 1. Quick Setup (45 Seconds)

### Step 1: Create Your Store Account
1. Open your web browser on a laptop, desktop, tablet, or mobile phone and visit **[https://pos.assistt.in](https://pos.assistt.in)**.
2. Click **Launch POS** or **Get Started Free**.
3. Fill in:
   - **Store Name** (e.g., *Gupta Super Kirana*)
   - **Store Owner Name**
   - **Email & Secure Password**
   - **State / Union Territory** (e.g., *Maharashtra*) — *Crucial for automatic Intra-State CGST/SGST vs. Inter-State IGST calculations.*
   - **Retail Industry** (Select *Kirana & Grocery*, *Restaurant*, *Chemist*, *Electronics*, *Apparel*, or *Wholesale*).
4. The system immediately sets up your database and seeds ~15 fast-moving grocery and daily essential items with standard HSN codes and GST rates.

---

## 2. Hardware Connection Guide

### A. Barcode Scanner Gun (USB / Bluetooth / 2.4GHz Dongle)
- **USB / Wireless Dongle**: Plug the USB cable or 2.4GHz wireless receiver into your laptop or POS terminal. No drivers needed. The scanner acts as an instant keyboard wedge. Click anywhere on the POS screen or search bar and scan any item barcode.
- **Mobile / Tablet Camera Scanner**: If you don't have a hardware barcode gun, click the **Camera Icon** in the search bar on your phone or tablet to scan items with the rear device camera.

### B. ESC/POS Thermal Receipt Printer (58mm or 80mm)
- **Supported Brands**: Sunmi, NGX, Essae, TVS, Epson, EzyPOS, and all standard Bluetooth / USB ESC/POS thermal printers.
- **Bluetooth Pairing**:
  1. Turn on your thermal printer.
  2. Open Bluetooth settings on your Android phone, tablet, or PC and pair with the printer (default PIN is usually `0000` or `1234`).
  3. In Assistt POS Settings, select your preferred receipt roll width: **58mm (2-inch)** or **80mm (3-inch)**.
  4. The system automatically formats text, item tables, and QR codes to fit your thermal paper perfectly.

### C. Merchant UPI QR Configuration (Zero Transaction Fees)
1. In the POS backoffice, navigate to **Settings → Store Profile**.
2. Enter your **Merchant UPI VPA** (e.g., `guptakirana@okhdfcbank` or `9876543210@paytm`).
3. Every printed receipt and on-screen checkout modal will now display a **dynamic Bharat UPI QR code** matching the exact bill amount. Customers scan with PhonePe, GPay, Paytm, or BHIM to pay instantly into your bank account.

---

## 3. Daily Cashier Counter Lifecycle

### Morning: Shift Opening
1. Cashier logs in with their cashier account (`cashier1@yourstore.com`).
2. The POS prompts: **"Open New Cashier Shift"**.
3. Enter the starting **Cash Drawer Float** (e.g., ₹2,000 in notes and coins for customer change).
4. Click **Start Shift**. The counter is now live for sales.

---

### Rush-Hour Checkout Flow (0.2s Ring-up)
1. **Scan or Search**:
   - Scan barcode with the scanner gun, OR
   - Type product name / SKU in the search bar, OR
   - Click fast item tiles from the category grid.
2. **Loose Items & Weighing Scales**:
   - For loose grains, sugar, atta, or vegetables, tap the item and enter the weight (e.g., `1.500 Kg` or `0.250 Kg`).
   - The price updates dynamically with decimal paisa precision.
3. **Select Customer (Optional)**:
   - For regular customers or store credit (Udhaar), select their name or click **+ Add Customer** to save their phone number.
4. **Choose Payment Tender**:
   - **Cash**: Enter the cash given by the customer; the screen displays exact change due.
   - **UPI QR**: Customer scans the dynamic QR code on screen or receipt.
   - **Card / NetBanking**: Record transaction reference.
   - **Customer Khata (Store Credit)**: Bill is posted to customer's account within their authorized credit limit.
   - **Split Payment**: Combine multiple tenders (e.g., ₹500 Cash + ₹250 UPI).
5. **Print & WhatsApp**:
   - Click **Print Bill** for instant thermal receipt output.
   - Click **Send on WhatsApp** to send a digital bill link directly to the customer's phone number.

---

### Evening: Shift Closing & Cash Audit
1. At the end of the cashier's shift, click **Close Shift**.
2. Count the physical cash in the drawer and enter the total.
3. The system automatically compares:
   - `Opening Float + Cash Sales - Recorded Cash Drops = Expected Cash`
4. Any surplus or shortage is permanently recorded with a timestamp for owner review.

---

## 4. Customer Khata & Udhaar Credit Notebook

- **Tracking Store Credit**: View outstanding balances for all credit customers in **Customer Khata**.
- **Credit Limits**: Set maximum credit limits per customer (e.g., ₹5,000 max) to prevent bad debt.
- **Recording Repayments**: When a customer comes in to clear their balance, click **Record Payment**, enter the amount, and choose Cash or UPI. The customer's balance updates immediately.
- **WhatsApp Ledger Statements**: Send customer statement summaries and payment reminders with one tap.

---

## 5. Inventory & Multi-Branch Stock Control

- **Adding New Products**: Go to **Catalog → Add Product**. Enter SKU, Barcode, HSN, Tax Rate, Cost Price, MRP, and Selling Price.
- **Stock Adjustments**: Record damaged stock, supplier returns, or physical inventory audit discrepancies with mandatory audit reason codes.
- **Multi-Branch Warehouse Transfers**: If operating more than one store or warehouse, dispatch stock with an in-transit tracking lifecycle (Dispatched → In-Transit → Received).
- **Purchase Orders & GRN**: Generate Purchase Orders for suppliers, log physical Goods Received Notes (GRN), and perform a 3-way match before paying vendor invoices.

---

## 6. Indian GST Statutory Filing & Reports

Assistt POS automatically snapshots HSN codes and calculates intra-state (CGST + SGST) and inter-state (IGST) taxes down to the exact paisa.

### Generating GSTR-1 for Your CA
1. Navigate to **GST Reports** in the top navigation menu.
2. Select the tax period (Month & Year).
3. The platform generates verified statutory summaries:
   - **Table 4**: B2B Invoices (registered buyers with GSTIN).
   - **Table 5 & 7**: B2C Large & Small Invoices.
   - **Table 12**: HSN-wise summary of outward supplies with taxable value and tax split.
4. Click **Export to Excel / JSON** and email directly to your Chartered Accountant or tax consultant for portal upload.

---

## 7. Android Handheld & Offline Mode

1. Install the Assistt POS APK on any Android 8.0+ smartphone, tablet, or Sunmi/NGX handheld billing machine.
2. Log in once with your store credentials.
3. **When Broadband or Electricity Goes Down**:
   - Continue billing normally. Every bill commits immediately to the local encrypted SQLite database on the device.
   - Receipts continue printing over Bluetooth thermal connection.
   - When network connectivity is restored, the **Sync Worker** automatically batches and syncs pending offline bills to the central cloud with zero duplicates.

---

## 8. Store Support & Helpdesk

- **Portal URL**: [https://pos.assistt.in](https://pos.assistt.in)
- **Documentation**: [https://pos.assistt.in/docs](https://pos.assistt.in)
- **Support Email**: support@assistt.in
- **Operating Hours**: Monday – Saturday, 8:00 AM – 10:00 PM IST

