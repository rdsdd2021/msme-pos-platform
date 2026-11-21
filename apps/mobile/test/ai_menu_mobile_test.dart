import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/providers/auth_provider.dart';
import 'package:pos_mobile/core/providers/catalog_provider.dart';
import 'package:pos_mobile/core/providers/sync_provider.dart';
import 'package:pos_mobile/core/repositories/auth_repository.dart';
import 'package:pos_mobile/core/repositories/local_catalog_repository.dart';
import 'package:pos_mobile/core/repositories/sync_repository.dart';
import 'package:pos_mobile/features/restaurant/restaurant_menu_screen.dart';
import 'package:pos_mobile/features/restaurant/widgets/ai_menu_upload_dialog.dart';
import 'package:drift/drift.dart' as drift;

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late AppDatabase db;
  late LocalCatalogRepository catalogRepo;
  late SyncRepository syncRepo;
  late AuthRepository authRepo;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    db = AppDatabase.inMemory();
    catalogRepo = LocalCatalogRepository(db);
    authRepo = AuthRepository(prefs: prefs, baseUrl: 'http://test-mock');
    syncRepo = SyncRepository(authRepo: authRepo, baseUrl: 'http://test-mock');
  });

  tearDown(() async {
    await db.close();
  });

  group('Mobile AI Menu Scanner & Bulk Import Unit & Logic Tests', () {
    test('SyncRepository.parseAiMenu extracts dishes with confidence, course, and dietary attributes', () async {
      final result = await syncRepo.parseAiMenu(
        tenantId: 'test-tenant-1',
        imageBase64: 'mock-base64',
        isTestMode: true,
      );

      expect(result['dishes'], isNotNull);
      final dishes = result['dishes'] as List<dynamic>;
      expect(dishes.length, 3);

      final d1 = dishes[0] as Map<String, dynamic>;
      expect(d1['name'], 'Paneer Butter Masala');
      expect(d1['price'], '260.00');
      expect(d1['foodType'], 'veg');
      expect(d1['category'], 'Main Course');

      final d3 = dishes[2] as Map<String, dynamic>;
      expect(d3['name'], 'Chicken Biryani');
      expect(d3['foodType'], 'non_veg');
    });

    test('SyncRepository.importAiMenu formats payload and returns import status', () async {
      final dishes = [
        {'name': 'Masala Dosa', 'price': '120.00', 'category': 'South Indian', 'foodType': 'veg'},
        {'name': 'Cold Coffee', 'price': '80.00', 'category': 'Beverages', 'foodType': 'veg'},
      ];

      final importRes = await syncRepo.importAiMenu(
        tenantId: 'test-tenant-1',
        branchId: 'branch-1',
        dishes: dishes,
        isTestMode: true,
      );

      expect(importRes['importedCount'], 2);
    });

    test('LocalCatalogRepository.batchInsertProducts saves parsed dishes to SQLite', () async {
      final now = DateTime.now();
      final companions = [
        LocalProductsCompanion.insert(
          id: 'dish-ai-1',
          tenantId: 'test-tenant-1',
          sku: 'DISH-AI-01',
          name: 'Paneer Butter Masala',
          sellingPricePaisa: 26000,
          categoryName: const drift.Value('Main Course'),
          foodType: const drift.Value('veg'),
          isMadeToOrder: const drift.Value(true),
          updatedAt: drift.Value(now),
        ),
        LocalProductsCompanion.insert(
          id: 'dish-ai-2',
          tenantId: 'test-tenant-1',
          sku: 'DISH-AI-02',
          name: 'Butter Naan',
          sellingPricePaisa: 5000,
          categoryName: const drift.Value('Breads'),
          foodType: const drift.Value('veg'),
          isMadeToOrder: const drift.Value(true),
          updatedAt: drift.Value(now),
        ),
      ];

      await catalogRepo.batchInsertProducts(companions);

      final products = await catalogRepo.getAllProducts(tenantId: 'test-tenant-1');
      expect(products.length, 2);
      expect(products.any((p) => p.name == 'Paneer Butter Masala'), isTrue);
      expect(products.any((p) => p.name == 'Butter Naan'), isTrue);
    });
  });

  group('Mobile AI Menu Scanner Widget Tests', () {
    testWidgets('RestaurantMenuScreen displays AI Menu Scan action in AppBar and prompt banner', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            localCatalogRepoProvider.overrideWithValue(catalogRepo),
            syncRepositoryProvider.overrideWithValue(syncRepo),
          ],
          child: const MaterialApp(
            home: RestaurantMenuScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // 1. Verify AppBar button exists
      expect(find.byTooltip('AI Menu Scan'), findsOneWidget);
      expect(find.byIcon(Icons.auto_awesome), findsWidgets);

      // 2. Verify quick banner exists
      expect(find.text('Upload Paper Menu with AI'), findsOneWidget);
      expect(find.text('Scan'), findsOneWidget);

      // 3. Verify empty state CTA exists
      expect(find.text('Scan Menu with AI'), findsOneWidget);
    });

    testWidgets('AiMenuUploadDialog opens, processes image in test mode, displays review dishes, and imports', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            localCatalogRepoProvider.overrideWithValue(catalogRepo),
            syncRepositoryProvider.overrideWithValue(syncRepo),
          ],
          child: const MaterialApp(
            home: Scaffold(
              body: AiMenuUploadDialog(isTestMode: true),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // 1. Verify initial step shows Take Photo & Choose Image
      expect(find.text('AI Menu Scanner'), findsOneWidget);
      expect(find.text('GEMINI AI'), findsOneWidget);
      expect(find.text('Take Photo'), findsOneWidget);
      expect(find.text('Choose Image'), findsOneWidget);

      // 2. Tap Take Photo (runs test mode fast-path)
      await tester.tap(find.text('Take Photo'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pump(const Duration(milliseconds: 500));

      // 3. Verify extracted dishes in review list
      expect(find.text('Paneer Butter Masala'), findsOneWidget);
      expect(find.text('Butter Naan'), findsOneWidget);
      expect(find.text('Chicken Biryani'), findsOneWidget);
      expect(find.text('3/3 Selected'), findsOneWidget);

      // 4. Tap Import Dishes button
      expect(find.text('Import 3 Dishes'), findsOneWidget);
      await tester.tap(find.text('Import 3 Dishes'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pump(const Duration(milliseconds: 500));

      // 5. Verify dishes were inserted into SQLite database
      final stored = await catalogRepo.getAllProducts();
      expect(stored.length, 3);
      expect(stored.any((p) => p.name == 'Paneer Butter Masala'), isTrue);
      expect(stored.any((p) => p.name == 'Butter Naan'), isTrue);
      expect(stored.any((p) => p.name == 'Chicken Biryani'), isTrue);
    });
  });
}
