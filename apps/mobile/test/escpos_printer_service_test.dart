import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/core/models/receipt_document.dart';
import 'package:pos_mobile/core/services/escpos_builder.dart';
import 'package:pos_mobile/core/services/offline_billing_service.dart';
import 'package:pos_mobile/core/services/printer_service.dart';

void main() {
  group('ESC/POS Thermal Receipt Builder Tests', () {
    late ReceiptDocument sampleDoc;

    setUp(() {
      final now = DateTime(2026, 11, 1, 14, 30);
      final sale = OfflineSaleResult(
        invoiceId: 'inv-uuid-001',
        invoiceNumber: 'INV-2026-1001',
        paymentMethod: 'cash',
        totalPaisa: 32000, // ₹320.00
        receiptText: 'Preview',
        createdAt: now,
      );

      const line1 = ReceiptLineItem(
        name: 'Aashirvaad Atta 5kg',
        hsnCode: '1101',
        quantity: 1,
        unit: 'PKT',
        unitPricePaisa: 24000,
        taxRatePercent: 5,
        taxPaisa: 1200,
        totalPaisa: 24000,
      );

      const line2 = ReceiptLineItem(
        name: 'Parle-G 800g',
        hsnCode: '1905',
        quantity: 1,
        unit: 'PKT',
        unitPricePaisa: 8000,
        taxRatePercent: 18,
        taxPaisa: 1440,
        totalPaisa: 8000,
      );

      sampleDoc = ReceiptDocument(
        header: const ReceiptHeader(
          storeName: 'KIRANA SUPERMART',
          address: 'Shop 4, Andheri West, Mumbai',
          phone: '+91 98765 43210',
          gstin: '27AABCU9603R1ZM',
        ),
        meta: ReceiptInvoiceMeta(
          invoiceNumber: sale.invoiceNumber,
          invoiceId: sale.invoiceId,
          date: now,
          cashierName: 'Cashier Ramesh',
          paymentMethod: 'cash',
          customerName: 'Pooja Verma',
          isReprint: false,
        ),
        lines: [line1, line2],
        taxSlabs: const [
          ReceiptTaxSlab(
            taxRatePercent: 5,
            taxableValuePaisa: 22800,
            cgstPaisa: 600,
            sgstPaisa: 600,
            totalTaxPaisa: 1200,
          ),
          ReceiptTaxSlab(
            taxRatePercent: 18,
            taxableValuePaisa: 6560,
            cgstPaisa: 720,
            sgstPaisa: 720,
            totalTaxPaisa: 1440,
          ),
        ],
        totals: const ReceiptTotals(
          subtotalPaisa: 29360,
          cgstTotalPaisa: 1320,
          sgstTotalPaisa: 1320,
          grandTotalPaisa: 32000,
        ),
        upiQrPayload: 'upi://pay?pa=kirana@upi&pn=KIRANA%20SUPERMART&am=320.00&tr=INV-2026-1001',
      );
    });

    test('renders 58mm layout (32 columns) with correct ESC/POS command sequences', () {
      final builder = EscPosBuilder(paperWidth: PaperWidth.mm58);
      builder.buildReceipt(sampleDoc);

      final bytes = builder.toBytes();
      final preview = builder.toTextPreview();

      // Verify ESC/POS byte sequence initialization (ESC @ = 0x1B, 0x40)
      expect(bytes[0], 0x1B);
      expect(bytes[1], 0x40);

      // Verify human-readable text preview contains essential tax invoice components
      expect(preview, contains('KIRANA SUPERMART'));
      expect(preview, contains('27AABCU9603R1ZM'));
      expect(preview, contains('INV-2026-1001'));
      expect(preview, contains('Cashier: Cashier Ramesh'));
      expect(preview, contains('Pooja Verma'));
      expect(preview, contains('Aashirvaad Atta 5kg'));
      expect(preview, contains('Parle-G 800g'));
      expect(preview, contains('GRAND TOTAL:'));
      expect(preview, contains('Rs. 320.00'));
      expect(preview, contains('--- GST TAX SUMMARY ---'));
      expect(preview, contains('5%'));
      expect(preview, contains('18%'));
      expect(preview, contains('[--- DYNAMIC UPI QR CODE ---]'));
      expect(preview, contains('[--- PAPER CUT ---]'));

      // Verify line length does not exceed 32 characters on any line
      final lines = preview.split('\n');
      for (final l in lines) {
        if (!l.startsWith('[---') && !l.contains('upi://')) {
          expect(l.length, lessThanOrEqualTo(32), reason: 'Line overflows 32 cols: "$l"');
        }
      }
    });

    test('renders 80mm layout (48 columns) with wide table format', () {
      final builder = EscPosBuilder(paperWidth: PaperWidth.mm80);
      builder.buildReceipt(sampleDoc);

      final bytes = builder.toBytes();
      final preview = builder.toTextPreview();

      expect(bytes.isNotEmpty, isTrue);
      expect(preview, contains('Item Name            Qty     Rate  GST%   Total'));
      expect(preview, contains('Rs. 320.00'));

      // Verify line length does not exceed 48 characters
      final lines = preview.split('\n');
      for (final l in lines) {
        if (!l.startsWith('[---') && !l.contains('upi://')) {
          expect(l.length, lessThanOrEqualTo(48), reason: 'Line overflows 48 cols: "$l"');
        }
      }
    });

    test('generates dynamic UPI QR code ESC/POS bytes', () {
      final builder = EscPosBuilder();
      builder.addQrCode('upi://pay?pa=kirana@upi&am=150.00', size: 5);
      final bytes = builder.toBytes();

      // Verify GS ( k command sequence: 0x1D 0x28 0x6B
      expect(bytes.contains(0x1D), isTrue);
      expect(bytes.contains(0x28), isTrue);
      expect(bytes.contains(0x6B), isTrue);

      final preview = builder.toTextPreview();
      expect(preview, contains('[--- DYNAMIC UPI QR CODE ---]'));
      expect(preview, contains('upi://pay?pa=kirana@upi&am=150.00'));
    });

    test('generates cash drawer kick pulse command bytes', () {
      final builder = EscPosBuilder();
      builder.kickDrawer(pin: 2);
      final bytes = builder.toBytes();

      // ESC p 0 25 250 -> 0x1B, 0x70, 0x00, 0x19, 0xFA
      expect(bytes, [0x1B, 0x70, 0x00, 0x19, 0xFA]);
    });

    test('emits prominent DUPLICATE / REPRINT banner when isReprint is true', () {
      final duplicateDoc = sampleDoc.copyWithReprint();
      expect(duplicateDoc.meta.isReprint, isTrue);

      final builder = EscPosBuilder(paperWidth: PaperWidth.mm58);
      builder.buildReceipt(duplicateDoc);
      final preview = builder.toTextPreview();

      expect(preview, contains('*** DUPLICATE COPY / REPRINT ***'));
    });
  });

  group('PrinterService Transport & Resilience Tests', () {
    late MockPrinterTransport mockTransport;
    late PrinterService printerService;
    late ReceiptDocument sampleDoc;

    setUp(() {
      mockTransport = MockPrinterTransport(startConnected: true);
      printerService = PrinterService(
        transport: mockTransport,
        paperWidth: PaperWidth.mm58,
      );

      sampleDoc = ReceiptDocument(
        header: const ReceiptHeader(storeName: 'TEST STORE'),
        meta: ReceiptInvoiceMeta(
          invoiceNumber: 'INV-TEST-001',
          date: DateTime(2026, 11, 1),
          paymentMethod: 'cash',
        ),
        lines: const [
          ReceiptLineItem(
            name: 'Biscuits',
            quantity: 2,
            unitPricePaisa: 2000,
            taxRatePercent: 0,
            taxPaisa: 0,
            totalPaisa: 4000,
          ),
        ],
        taxSlabs: const [],
        totals: const ReceiptTotals(
          subtotalPaisa: 4000,
          cgstTotalPaisa: 0,
          sgstTotalPaisa: 0,
          grandTotalPaisa: 4000,
        ),
      );
    });

    test('prints receipt successfully and records byte buffer in transport', () async {
      final result = await printerService.printReceipt(sampleDoc, openCashDrawer: true);

      expect(result.success, isTrue);
      expect(result.invoiceNumber, 'INV-TEST-001');
      expect(result.bytesSent, greaterThan(50));
      expect(mockTransport.printedByteJobs.length, 1);
      expect(mockTransport.printedTextJobs.length, 1);
      expect(mockTransport.printedTextJobs.first, contains('TEST STORE'));
      expect(mockTransport.printedTextJobs.first, contains('[--- CASH DRAWER OPENED ---]'));
    });

    test('reprints receipt with DUPLICATE header without altering original invoice', () async {
      final result = await printerService.reprintReceipt(sampleDoc);

      expect(result.success, isTrue);
      expect(mockTransport.printedTextJobs.length, 1);
      expect(mockTransport.printedTextJobs.first, contains('*** DUPLICATE COPY / REPRINT ***'));
      expect(mockTransport.printedTextJobs.first, contains('INV-TEST-001'));
    });

    test('prints diagnostic test page', () async {
      final result = await printerService.printTestPage();

      expect(result.success, isTrue);
      expect(result.invoiceNumber, 'TEST-PAGE');
      expect(mockTransport.printedTextJobs.first, contains('KIRANA POS PRINTER TEST'));
      expect(mockTransport.printedTextJobs.first, contains('ESC/POS HARDWARE READY!'));
    });

    test('sends cash drawer kick pulse successfully', () async {
      final ok = await printerService.kickCashDrawer();
      expect(ok, isTrue);
      expect(mockTransport.printedByteJobs.length, 1);
      expect(mockTransport.printedByteJobs.first, [0x1B, 0x70, 0x00, 0x19, 0xFA]);
    });

    test('enforces Rule 14: catches transport disconnection safely without crashing', () async {
      await mockTransport.disconnect();
      mockTransport.simulateConnectionFailure = true;

      // Print attempt must not throw an unhandled exception or duplicate the sale
      final result = await printerService.printReceipt(sampleDoc);

      expect(result.success, isFalse);
      expect(result.errorMessage, isNotNull);
      expect(printerService.status, PrinterStatus.error);
      expect(mockTransport.printedByteJobs.isEmpty, isTrue);
    });

    test('enforces Rule 14: catches paper-out / cover-open error safely', () async {
      mockTransport.simulatePaperOut = true;

      final result = await printerService.printReceipt(sampleDoc);

      expect(result.success, isFalse);
      expect(result.errorMessage, contains('Paper roll out'));
      expect(printerService.status, PrinterStatus.error);
    });
  });
}
