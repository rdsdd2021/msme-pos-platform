import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/models/product.dart';
import 'package:pos_mobile/core/repositories/local_catalog_repository.dart';
import 'package:pos_mobile/core/widgets/camera_barcode_scanner_modal.dart';
import 'package:pos_mobile/core/widgets/product_photo_picker.dart';
import 'package:pos_mobile/features/inventory/widgets/add_edit_product_dialog.dart';

void main() {
  group('Catalog Repository & Image URL Tests', () {
    late AppDatabase db;
    late LocalCatalogRepository repo;

    setUp(() {
      db = AppDatabase.inMemory();
      repo = LocalCatalogRepository(db);
    });

    tearDown(() async {
      await db.close();
    });

    test('createProduct persists imageUrl in SQLite and sync outbox', () async {
      const sampleImageUrl = 'data:image/jpeg;base64,mockImageData123';
      final product = await repo.createProduct(
        name: 'Cadbury Dairy Milk 50g',
        sku: 'SNK-001',
        barcode: '890123456789',
        category: 'Snacks',
        sellingPricePaisa: 4000,
        purchaseCostPaisa: 3200,
        gstRate: 18.0,
        unit: 'PCS',
        initialStock: 25.0,
        imageUrl: sampleImageUrl,
      );

      expect(product.imageUrl, sampleImageUrl);

      // Verify row in SQLite
      final found = await repo.findByBarcodeOrSku('890123456789');
      expect(found, isNotNull);
      expect(found!.imageUrl, sampleImageUrl);

      // Verify sync outbox entry has imageUrl
      final outboxRows = await db.select(db.syncOutbox).get();
      expect(outboxRows.length, 1);
      final payload = jsonDecode(outboxRows.first.payload) as Map<String, dynamic>;
      expect(payload['imageUrl'], sampleImageUrl);
    });

    test('updateProduct updates imageUrl in SQLite and sync outbox', () async {
      final initial = await repo.createProduct(
        name: 'Britannia Bourbon 100g',
        sku: 'SNK-002',
        barcode: '890123456790',
        category: 'Snacks',
        sellingPricePaisa: 3000,
        unit: 'PCS',
        initialStock: 15.0,
      );

      expect(initial.imageUrl, isNull);

      const updatedImageUrl = 'data:image/jpeg;base64,newUpdatedImageBytes';
      final updated = Product(
        id: initial.id,
        name: initial.name,
        sku: initial.sku,
        barcode: initial.barcode,
        category: initial.category,
        unit: initial.unit,
        sellingPricePaisa: initial.sellingPricePaisa,
        purchaseCostPaisa: initial.purchaseCostPaisa,
        gstRate: initial.gstRate,
        currentStock: initial.currentStock,
        imageUrl: updatedImageUrl,
      );

      await repo.updateProduct(updated);

      final reloaded = await repo.findByBarcodeOrSku(initial.sku);
      expect(reloaded, isNotNull);
      expect(reloaded!.imageUrl, updatedImageUrl);

      final outboxRows = await db.select(db.syncOutbox).get();
      final updateOp = outboxRows.firstWhere((r) => r.operationType == 'UPDATE_PRODUCT');
      final payload = jsonDecode(updateOp.payload) as Map<String, dynamic>;
      expect(payload['imageUrl'], updatedImageUrl);
    });
  });

  group('ProductPhotoPicker Widget Tests', () {
    testWidgets('renders empty state when no photo is attached', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ProductPhotoPicker(
              initialImageUrl: null,
              onPhotoChanged: (_) {},
            ),
          ),
        ),
      );

      expect(find.text('Add Product Photo'), findsOneWidget);
      expect(find.text('Take photo or upload from gallery'), findsOneWidget);
      expect(find.byIcon(Icons.add_a_photo_outlined), findsOneWidget);
    });

    testWidgets('attaches photo in test mode and displays photo preview', (tester) async {
      String? updatedPhoto;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ProductPhotoPicker(
              initialImageUrl: null,
              isTestMode: true,
              onPhotoChanged: (url) => updatedPhoto = url,
            ),
          ),
        ),
      );

      // Tap to open source selection sheet
      await tester.tap(find.text('Add Product Photo'));
      await tester.pumpAndSettle();

      // Tap 'Take Photo with Camera'
      expect(find.text('Select Product Photo'), findsOneWidget);
      await tester.tap(find.text('Take Photo with Camera'));
      await tester.pumpAndSettle();

      // Expect photo to be attached
      expect(updatedPhoto, isNotNull);
      expect(updatedPhoto!.startsWith('data:image/jpeg;base64,'), isTrue);
      expect(find.text('Product Photo Attached'), findsOneWidget);
      expect(find.text('Change'), findsOneWidget);
      expect(find.text('Remove'), findsOneWidget);
    });

    testWidgets('removes photo when Remove is tapped', (tester) async {
      String? currentPhoto = 'data:image/jpeg;base64,/9j/mock';
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (ctx, setState) => ProductPhotoPicker(
                initialImageUrl: currentPhoto,
                onPhotoChanged: (url) => setState(() => currentPhoto = url),
              ),
            ),
          ),
        ),
      );

      expect(find.text('Product Photo Attached'), findsOneWidget);
      await tester.tap(find.text('Remove'));
      await tester.pumpAndSettle();

      expect(currentPhoto, isNull);
      expect(find.text('Add Product Photo'), findsOneWidget);
    });
  });

  group('CameraBarcodeScannerModal Widget Tests', () {
    testWidgets('renders scanner modal with title and controls', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: CameraBarcodeScannerModal(
                isTestMode: true,
                onBarcodeScanned: (_) {},
              ),
            ),
          ),
        ),
      );

      expect(find.text('Scan Barcode'), findsOneWidget);
      expect(find.text('Enter Barcode Manually'), findsOneWidget);
      expect(find.byIcon(Icons.close), findsOneWidget);
    });

    testWidgets('dispatches barcode when test scan chip is tapped', (tester) async {
      String? scannedCode;
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: CameraBarcodeScannerModal(
                isTestMode: true,
                onBarcodeScanned: (code) => scannedCode = code,
              ),
            ),
          ),
        ),
      );

      final chip = find.text('Parle-G 800g');
      expect(chip, findsOneWidget);
      await tester.tap(chip);
      await tester.pump();

      expect(scannedCode, '890103000005');
    });

    testWidgets('switches to manual input view and submits typed barcode', (tester) async {
      String? scannedCode;
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: CameraBarcodeScannerModal(
                isTestMode: true,
                onBarcodeScanned: (code) => scannedCode = code,
              ),
            ),
          ),
        ),
      );

      // Switch to manual input
      await tester.tap(find.text('Enter Barcode Manually'));
      await tester.pumpAndSettle();

      expect(find.text('Type Barcode or SKU'), findsOneWidget);

      // Enter barcode
      await tester.enterText(find.byKey(const Key('manual_barcode_input_field')), '890103009999');
      await tester.tap(find.byKey(const Key('submit_manual_barcode_btn')));
      await tester.pump();

      expect(scannedCode, '890103009999');
    });
  });

  group('AddEditProductDialog Photo and Barcode Integration', () {
    testWidgets('renders photo picker and camera scan button in dialog', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: AddEditProductDialog(),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Add New Item'), findsOneWidget);
      expect(find.text('Add Product Photo'), findsOneWidget);
      expect(find.byKey(const Key('scan_item_barcode_btn')), findsOneWidget);
    });
  });
}
