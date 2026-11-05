import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/models/product.dart';
import 'package:pos_mobile/core/providers/catalog_provider.dart';
import 'package:pos_mobile/core/providers/printer_provider.dart';
import 'package:pos_mobile/core/services/barcode_scanner_listener.dart';
import 'package:pos_mobile/core/services/offline_billing_service.dart';
import 'package:pos_mobile/core/services/printer_service.dart';
import 'package:pos_mobile/features/pos/pos_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('BarcodeScannerController Unit Tests', () {
    test('buffers rapid keystrokes and dispatches on Enter', () {
      String? scannedBarcode;
      final controller = BarcodeScannerController(
        onBarcodeScanned: (barcode) {
          scannedBarcode = barcode;
        },
      );

      // Simulate rapid keystrokes: '8', '9', '0', '1', 'Enter'
      const digits = ['8', '9', '0', '1'];
      for (final d in digits) {
        controller.handleKeyEvent(
          KeyDownEvent(
            physicalKey: PhysicalKeyboardKey.digit1,
            logicalKey: LogicalKeyboardKey.digit1,
            character: d,
            timeStamp: Duration.zero,
          ),
        );
      }

      // Send Enter key
      final consumed = controller.handleKeyEvent(
        const KeyDownEvent(
          physicalKey: PhysicalKeyboardKey.enter,
          logicalKey: LogicalKeyboardKey.enter,
          timeStamp: Duration.zero,
        ),
      );

      expect(consumed, isTrue);
      expect(scannedBarcode, '8901');
    });

    test('debounces identical barcode scanned in rapid succession', () {
      final List<String> receivedScans = [];
      final controller = BarcodeScannerController(
        debounceDuration: const Duration(milliseconds: 300),
        onBarcodeScanned: (b) => receivedScans.add(b),
      );

      controller.dispatchBarcode('890103000005');
      controller.dispatchBarcode('890103000005'); // Duplicate inside debounce window

      expect(receivedScans.length, 1);
      expect(receivedScans.first, '890103000005');
    });

    test('ignores barcodes shorter than minBarcodeLength', () {
      String? result;
      final controller = BarcodeScannerController(
        minBarcodeLength: 4,
        onBarcodeScanned: (b) => result = b,
      );

      controller.dispatchBarcode('12'); // Only 2 chars
      expect(result, isNull);
    });
  });

  group('POS Hardware Scanner & Printer Integration Widget Tests', () {
    late AppDatabase testDb;
    late MockPrinterTransport mockPrinterTransport;
    late PrinterService testPrinterService;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      testDb = AppDatabase.inMemory();
      OfflineBillingService.setDatabase(testDb);

      mockPrinterTransport = MockPrinterTransport(startConnected: true);
      testPrinterService = PrinterService(transport: mockPrinterTransport);
    });

    tearDown(() async {
      await testDb.close();
    });

    Widget createTestPosScreen() {
      final testProducts = [
        const Product(
          id: 'prod-5',
          name: 'Parle-G Biscuit 800g',
          sku: 'SNACK-001',
          barcode: '890103000005',
          category: 'Snacks',
          unit: 'PKT',
          sellingPricePaisa: 8000,
          purchaseCostPaisa: 6800,
          gstRate: 18,
          currentStock: 80.0,
        ),
        const Product(
          id: 'prod-1',
          name: 'Aashirvaad Atta 5kg',
          sku: 'GROC-001',
          barcode: '890103000001',
          category: 'Groceries',
          unit: 'PKT',
          sellingPricePaisa: 24000,
          purchaseCostPaisa: 21000,
          gstRate: 5,
          currentStock: 50.0,
        ),
      ];

      return ProviderScope(
        overrides: [
          printerServiceProvider.overrideWithValue(testPrinterService),
          catalogProvider.overrideWith(
            (ref) => CatalogNotifier(ref.watch(localCatalogRepoProvider))
              ..state = CatalogState(allProducts: testProducts),
          ),
        ],
        child: const MaterialApp(
          home: MobilePosScreen(),
        ),
      );
    }

    testWidgets('adds product to cart when manual barcode is entered from dialog', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(createTestPosScreen());
      await tester.pumpAndSettle();

      // Tap manual scan icon button
      final scanBtn = find.byKey(const Key('pos_manual_scan_btn'));
      expect(scanBtn, findsOneWidget);
      await tester.tap(scanBtn);
      await tester.pumpAndSettle();

      // Verify Scan Barcode dialog opened
      expect(find.text('Scan Barcode'), findsOneWidget);

      // Tap the "Parle-G 800g" quick test chip (barcode: 890103000005)
      final chip = find.text('Parle-G 800g');
      expect(chip, findsOneWidget);
      await tester.tap(chip);
      await tester.pumpAndSettle();

      // Cart bar should now show 1 item (₹80.00 + 18% GST = ₹94.40)
      expect(find.text('1 items | Tax: ₹14.40'), findsOneWidget);
      expect(find.text('₹94.40'), findsOneWidget);
    });

    testWidgets('shows warning snackbar when unrecognized barcode is scanned', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(createTestPosScreen());
      await tester.pumpAndSettle();

      // Tap manual scan icon button
      await tester.tap(find.byKey(const Key('pos_manual_scan_btn')));
      await tester.pumpAndSettle();

      // Enter nonexistent barcode into text field
      await tester.enterText(find.byType(TextField).last, '999999999999');
      await tester.tap(find.text('Add to Cart'));
      await tester.pumpAndSettle();

      // Verify warning snackbar appeared
      expect(find.text('Barcode "999999999999" not recognized in catalog.'), findsOneWidget);
    });

    testWidgets('completes sale, prints receipt to thermal printer, and supports reprint from recent bills', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(createTestPosScreen());
      await tester.pumpAndSettle();

      // 1. Add Atta to cart
      await tester.tap(find.text('Aashirvaad Atta 5kg'));
      await tester.pumpAndSettle();
      expect(find.text('1 items | Tax: ₹12.00'), findsOneWidget);
      expect(find.text('₹252.00'), findsOneWidget);

      // 2. Open checkout sheet
      await tester.tap(find.text('PAY / BILL'));
      await tester.pumpAndSettle();

      // 3. Complete sale with Cash
      await tester.tap(find.text('CONFIRM PAYMENT & SAVE INVOICE'));
      await tester.pumpAndSettle();

      // 4. Verify Sale Complete dialog with thermal preview
      expect(find.text('Sale Complete!'), findsOneWidget);
      expect(find.text('Amount Paid: ₹252.00'), findsOneWidget);
      expect(find.byKey(const Key('print_receipt_btn')), findsOneWidget);

      // 5. Tap Print Receipt
      await tester.tap(find.byKey(const Key('print_receipt_btn')));
      await tester.pumpAndSettle();

      // Verify printer transport received receipt
      expect(mockPrinterTransport.printedByteJobs.length, 1);
      expect(mockPrinterTransport.printedTextJobs.length, 1);
      expect(mockPrinterTransport.printedTextJobs.first, contains('Aashirvaad Atta 5kg'));
      expect(mockPrinterTransport.printedTextJobs.first, contains('GRAND TOTAL:'));

      // 6. Tap Recent Invoices button from AppBar
      final recentBillsBtn = find.byKey(const Key('pos_recent_bills_btn'));
      expect(recentBillsBtn, findsOneWidget);
      await tester.tap(recentBillsBtn);
      await tester.pumpAndSettle();

      // Verify Recent Invoices dialog is visible
      expect(find.text('Recent Invoices'), findsOneWidget);

      // Tap Reprint button
      final reprintBtn = find.text('Reprint');
      expect(reprintBtn, findsOneWidget);
      await tester.tap(reprintBtn);
      await tester.pumpAndSettle();

      // Verify duplicate copy was sent to printer transport with duplicate watermark
      expect(mockPrinterTransport.printedTextJobs.length, 2);
      expect(mockPrinterTransport.printedTextJobs[1], contains('*** DUPLICATE COPY / REPRINT ***'));
    });
  });
}
