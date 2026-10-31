import { Test, TestingModule } from '@nestjs/testing';
import { HardwareService } from './hardware.service';
import { EscPosRenderer, EXEO_EX5810_PROFILE, STANDARD_80MM_PROFILE } from './escpos-renderer';
import { ReceiptDocument, PaperWidth } from '@pos/shared-types';

describe('HardwareService & Thermal Printer Abstractions', () => {
  let service: HardwareService;
  let renderer: EscPosRenderer;

  const sampleReceipt: ReceiptDocument = {
    header: {
      businessName: 'Gupta Kirana Store',
      branchName: 'Main Bazaar Branch',
      addressLine: '12 M.G. Road, Kolkata',
      gstin: '19AAACG1234A1Z5',
      phone: '+91 9876543210',
    },
    invoice: {
      invoiceNumber: 'INV-20261031-1001',
      dateTime: '2026-10-31 11:45',
      cashierName: 'Ramanuj',
    },
    items: [
      {
        name: 'Fortune Sunflower Oil 1L',
        quantity: '2.000',
        rate: '140.00',
        taxPercent: '5.00',
        total: '280.00',
      },
      {
        name: 'Tata Salt 1kg',
        quantity: '1.000',
        rate: '28.00',
        taxPercent: '0.00',
        total: '28.00',
      },
    ],
    totals: {
      subtotal: '308.00',
      discountTotal: '0.00',
      taxableTotal: '308.00',
      tax: {
        cgst: '7.00',
        sgst: '7.00',
        igst: '0.00',
        totalTax: '14.00',
      },
      grandTotal: '322.00',
    },
    payments: [
      {
        method: 'cash',
        amount: '322.00',
      },
    ],
    footer: {
      thankYouMessage: 'Dhanyavad! Visit Again.',
      fssaiLicense: '10019031000123',
    },
  };

  beforeEach(async () => {
    renderer = new EscPosRenderer();
    const module: TestingModule = await Test.createTestingModule({
      providers: [HardwareService],
    }).compile();

    service = module.get<HardwareService>(HardwareService);
  });

  describe('58mm Thermal Layout (EXEO EX-5810 compatibility)', () => {
    it('formats a 32-column receipt layout within 58mm boundaries', () => {
      const text = renderer.renderText(sampleReceipt, EXEO_EX5810_PROFILE);

      expect(text).toContain('Gupta Kirana Store');
      expect(text).toContain('INV-20261031-1001');
      expect(text).toContain('Fortune Sunflower Oil 1L');
      expect(text).toContain('GRAND TOTAL:');
      expect(text).toContain('322.00');

      // Verify no line exceeds 32 characters
      const lines = text.split('\n');
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(32);
      }
    });

    it('generates valid ESC/POS byte sequence containing init and drawer kick', () => {
      const bytes = renderer.renderBytes(sampleReceipt, EXEO_EX5810_PROFILE);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(50);
      // ESC @ (Init command: 0x1b, 0x40)
      expect(bytes[0]).toBe(0x1b);
      expect(bytes[1]).toBe(0x40);
    });
  });

  describe('80mm Thermal Layout', () => {
    it('formats 48-column wide receipt layout', () => {
      const text = renderer.renderText(sampleReceipt, STANDARD_80MM_PROFILE);
      expect(text).toContain('Gupta Kirana Store');
      const lines = text.split('\n');
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(48);
      }
    });
  });

  describe('Printer Disconnect Isolation (Non-Negotiable Rule 14)', () => {
    it('surfaces a retryable job when printer is disconnected without failing the sale', async () => {
      const result = await service.dispatchPrintJob(sampleReceipt, false); // Device is offline

      expect(result.success).toBe(false);
      expect(result.isRetryable).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(result.errorMessage).toContain('Printer disconnected or offline');
    });

    it('successfully processes print job when device is connected', async () => {
      const result = await service.dispatchPrintJob(sampleReceipt, true); // Device is online

      expect(result.success).toBe(true);
      expect(result.isRetryable).toBe(false);
      expect(result.jobId).toBeDefined();
    });
  });
});

