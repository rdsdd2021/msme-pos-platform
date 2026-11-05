import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/core/models/product.dart';
import 'package:pos_mobile/core/widgets/camera_barcode_scanner_modal.dart';
import 'package:pos_mobile/core/widgets/internet_photo_search_dialog.dart';
import 'package:pos_mobile/core/widgets/product_photo_picker.dart';
import 'package:pos_mobile/features/pos/pos_screen.dart';
import 'package:pos_mobile/core/providers/catalog_provider.dart';
import 'package:pos_mobile/core/providers/auth_provider.dart';
import 'package:pos_mobile/core/repositories/auth_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final testProductWithPhoto = Product(
    id: 'prod-eggs-30',
    name: 'Farm Fresh White Eggs (Pack of 30)',
    sku: 'ITEM-EGGS-30',
    category: 'Groceries',
    unit: 'TRAY',
    sellingPricePaisa: 21000, // ₹210.00
    purchaseCostPaisa: 17000,
    currentStock: 15,
    gstRate: 0,
    imageUrl:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  );

  final testProductWithoutPhoto = Product(
    id: 'prod-atta-5kg',
    name: 'Aashirvaad Shudh Chakki Atta 5kg',
    sku: 'ITEM-ATTA-5K',
    category: 'Groceries',
    unit: 'PKT',
    sellingPricePaisa: 24500, // ₹245.00
    purchaseCostPaisa: 21000,
    currentStock: 4, // low stock!
    gstRate: 0,
  );

  group('Product Card Hero Photo & Aspect Ratio Tests', () {
    testWidgets('POS screen renders full-width hero photo with category and stock badges',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(400, 850);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(
              (ref) => AuthNotifier(
                ref.watch(authRepositoryProvider),
                initialState: AuthState(
                  user: AuthRepository.demoOwner,
                  activeMembership: AuthRepository.demoOwner.primaryMembership,
                  isInitialized: true,
                ),
              ),
            ),
            catalogProvider.overrideWith(
              (ref) => CatalogNotifier(ref.watch(localCatalogRepoProvider))
                ..state = CatalogState(
                  allProducts: [testProductWithPhoto, testProductWithoutPhoto],
                ),
            ),
          ],
          child: const MaterialApp(
            home: MobilePosScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify product titles rendered
      expect(find.text('Farm Fresh White Eggs (Pack of 30)'), findsOneWidget);
      expect(find.text('Aashirvaad Shudh Chakki Atta 5kg'), findsOneWidget);

      // Verify prices rendered
      expect(find.text('₹210.0'), findsOneWidget);
      expect(find.text('₹245.0'), findsOneWidget);

      // Verify stock badges (normal vs low stock)
      expect(find.text('15 in stock'), findsOneWidget);
      expect(find.text('4 left'), findsOneWidget);

      // Verify ADD action button is present on both cards
      expect(find.text('ADD'), findsNWidgets(2));
    });
  });

  group('Camera Barcode Scanner Tests', () {
    testWidgets('Renders test viewfinder with mock scan chips when in test mode',
        (WidgetTester tester) async {
      String? scannedResult;

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: CameraBarcodeScannerModal(
                isTestMode: true,
                onBarcodeScanned: (code) {
                  scannedResult = code;
                },
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Scan Barcode'), findsOneWidget);
      expect(find.text('Simulated Camera Viewfinder (Test Mode)'), findsOneWidget);

      // Tap mock barcode chip
      await tester.tap(find.byKey(const Key('test_scan_chip_atta')));
      await tester.pumpAndSettle();

      expect(scannedResult, '890103000001');
    });

    testWidgets('Manual barcode input submits barcode properly', (WidgetTester tester) async {
      String? scannedResult;

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: CameraBarcodeScannerModal(
                isTestMode: true,
                onBarcodeScanned: (code) {
                  scannedResult = code;
                },
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Toggle to manual entry
      await tester.tap(find.text('Enter Barcode Manually'));
      await tester.pumpAndSettle();

      expect(find.text('Type Barcode or SKU'), findsOneWidget);

      // Enter custom barcode
      await tester.enterText(find.byKey(const Key('manual_barcode_input_field')), '8901234567890');
      await tester.tap(find.byKey(const Key('submit_manual_barcode_btn')));
      await tester.pumpAndSettle();

      expect(scannedResult, '8901234567890');
    });
  });

  group('Internet Product Photo Search Tests', () {
    testWidgets('Searches online product database and displays results in test mode',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: InternetPhotoSearchSheet(
              initialQuery: 'Maggi',
              isTestMode: true,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Search Photos from Internet'), findsOneWidget);
      expect(find.text('Maggi'), findsAtLeastNWidgets(1));

      // Tap first search result card in grid
      await tester.tap(find.byKey(const Key('internet_photo_result_0')));
      await tester.pumpAndSettle();

      // Use this photo button appears
      expect(find.byKey(const Key('use_internet_photo_btn')), findsOneWidget);
    });

    testWidgets('ProductPhotoPicker includes Search Photos from Internet in bottom sheet',
        (WidgetTester tester) async {
      String? updatedPhotoUrl;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ProductPhotoPicker(
              initialSearchQuery: 'Atta',
              isTestMode: true,
              onPhotoChanged: (url) {
                updatedPhotoUrl = url;
              },
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap picker to open source selection sheet
      await tester.tap(find.byType(ProductPhotoPicker));
      await tester.pumpAndSettle();

      expect(find.text('Select Product Photo'), findsOneWidget);
      expect(find.text('Search Photos from Internet'), findsOneWidget);
      expect(find.text('Take Photo with Camera'), findsOneWidget);
      expect(find.text('Choose from Gallery'), findsOneWidget);

      // Select 'Take Photo with Camera' in test mode
      await tester.tap(find.text('Take Photo with Camera'));
      await tester.pumpAndSettle();

      expect(updatedPhotoUrl, isNotNull);
      expect(updatedPhotoUrl!.startsWith('data:image/jpeg;base64,'), isTrue);
    });
  });
}

