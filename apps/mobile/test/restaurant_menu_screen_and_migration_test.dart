import 'dart:io';
import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:path/path.dart' as p;
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/models/product.dart';
import 'package:pos_mobile/core/providers/catalog_provider.dart';
import 'package:pos_mobile/core/repositories/local_catalog_repository.dart';
import 'package:pos_mobile/features/restaurant/restaurant_menu_screen.dart';
import 'package:pos_mobile/features/restaurant/widgets/add_edit_restaurant_dish_dialog.dart';
import 'package:sqlite3/sqlite3.dart' as sqlite;

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('SQLite Self-Healing Migration Tests', () {
    test('Self-healing dynamically adds missing image_url and culinary columns to legacy SQLite database', () async {
      // 1. Create a real temporary SQLite file with a legacy v1 schema (missing image_url and culinary fields)
      final tempDir = await Directory.systemTemp.createTemp('pos_test_');
      final dbFile = File(p.join(tempDir.path, 'legacy_kirana.sqlite'));

      final rawSqlite = sqlite.sqlite3.open(dbFile.path);
      rawSqlite.execute('''
        CREATE TABLE local_products (
          id TEXT NOT NULL PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          sku TEXT NOT NULL,
          name TEXT NOT NULL,
          barcode TEXT,
          selling_price_paisa INTEGER NOT NULL,
          purchase_cost_paisa INTEGER NOT NULL DEFAULT 0,
          mrp_paisa INTEGER NOT NULL DEFAULT 0,
          gst_rate_percent REAL NOT NULL DEFAULT 0.0,
          hsn_code TEXT,
          category_name TEXT,
          unit TEXT NOT NULL DEFAULT 'PCS',
          stock_quantity REAL NOT NULL DEFAULT 0.0,
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );
      ''');
      rawSqlite.execute('''
        CREATE TABLE sync_outbox (
          operation_id TEXT NOT NULL PRIMARY KEY,
          device_id TEXT NOT NULL,
          sequence INTEGER NOT NULL,
          operation_type TEXT NOT NULL,
          schema_version INTEGER NOT NULL DEFAULT 1,
          payload TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          retry_count INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          last_error TEXT,
          server_entity_id TEXT
        );
      ''');
      rawSqlite.execute('PRAGMA user_version = 1;');

      // Verify that initially, image_url is NOT present in local_products
      final checkColsBefore = rawSqlite.select("PRAGMA table_info('local_products')");
      final colNamesBefore = checkColsBefore.map((row) => row['name'] as String).toSet();
      expect(colNamesBefore.contains('image_url'), isFalse);
      expect(colNamesBefore.contains('food_type'), isFalse);
      rawSqlite.dispose();

      // 2. Open this legacy file with AppDatabase (which triggers Drift onUpgrade from v1 to v4 & beforeOpen self-healer)
      final appDb = AppDatabase(NativeDatabase(dbFile));
      final repo = LocalCatalogRepository(appDb);

      // 3. Insert a product with imageUrl, foodType, station, prep time, and variants
      final inserted = await repo.createProduct(
        name: 'Dal Makhani',
        sku: 'DISH-DM-01',
        category: 'Main Course',
        sellingPricePaisa: 22000,
        imageUrl: 'https://example.com/dal.jpg',
        foodType: 'veg',
        kitchenStation: 'main_kitchen',
        prepTimeMinutes: 20,
        isAvailable: true,
        isMadeToOrder: true,
        variants: [
          const ProductVariant(name: 'Half', price: 140.0),
          const ProductVariant(name: 'Full', price: 220.0),
        ],
        tenantId: 'tenant-test',
      );

      expect(inserted.name, 'Dal Makhani');
      expect(inserted.imageUrl, 'https://example.com/dal.jpg');
      expect(inserted.foodType, 'veg');
      expect(inserted.variants?.length, 2);

      // 4. Verify columns exist on the database now
      final rawSqliteAfter = sqlite.sqlite3.open(dbFile.path);
      final checkColsAfter = rawSqliteAfter.select("PRAGMA table_info('local_products')");
      final colNamesAfter = checkColsAfter.map((row) => row['name'] as String).toSet();
      expect(colNamesAfter.contains('image_url'), isTrue);
      expect(colNamesAfter.contains('food_type'), isTrue);
      expect(colNamesAfter.contains('kitchen_station'), isTrue);
      expect(colNamesAfter.contains('variants_json'), isTrue);
      rawSqliteAfter.dispose();

      await appDb.close();
      if (tempDir.existsSync()) {
        tempDir.deleteSync(recursive: true);
      }
    });
  });

  group('RestaurantMenuScreen Widget Tests', () {
    final testDish1 = Product(
      id: 'dish-paneer-1',
      name: 'Paneer Butter Masala',
      sku: 'DISH-PBM-01',
      category: 'Main Course',
      unit: 'PORTION',
      sellingPricePaisa: 28000,
      purchaseCostPaisa: 0,
      gstRate: 5,
      currentStock: 0,
      foodType: 'veg',
      kitchenStation: 'main_kitchen',
      prepTimeMinutes: 15,
      isAvailable: true,
      isMadeToOrder: true,
      variants: [
        const ProductVariant(name: 'Half', price: 180.0),
        const ProductVariant(name: 'Full', price: 280.0),
      ],
    );

    final testDish2 = Product(
      id: 'dish-chicken-tikka',
      name: 'Chicken Tikka',
      sku: 'DISH-CT-01',
      category: 'Tandoori & Grills',
      unit: 'PORTION',
      sellingPricePaisa: 32000,
      purchaseCostPaisa: 0,
      gstRate: 5,
      currentStock: 0,
      foodType: 'non_veg',
      kitchenStation: 'tandoor',
      prepTimeMinutes: 20,
      isAvailable: false, // 86'd sold out
      isMadeToOrder: true,
    );

    testWidgets('Renders RestaurantMenuScreen with KPI strip, dish cards, and dietary filters', (tester) async {
      final db = AppDatabase.inMemory();
      final repo = LocalCatalogRepository(db);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            localCatalogRepoProvider.overrideWithValue(repo),
            catalogProvider.overrideWith((ref) {
              final notifier = CatalogNotifier(repo);
              notifier.state = CatalogState(
                allProducts: [testDish1, testDish2],
                isLoading: false,
              );
              return notifier;
            }),
          ],
          child: const MaterialApp(
            home: RestaurantMenuScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Check AppBar and Header
      expect(find.text('Restaurant Menu & Dishes'), findsOneWidget);
      expect(find.text('Total Dishes'), findsOneWidget);
      expect(find.text('Pure Veg'), findsOneWidget);
      expect(find.text('Non-Veg'), findsOneWidget);
      expect(find.text('Sold Out (86)'), findsOneWidget);

      // Check KPI values
      expect(find.text('2'), findsOneWidget); // Total Dishes is 2
      expect(find.text('1'), findsWidgets); // Veg: 1, Non-Veg: 1, Sold Out: 1

      // Check Dish names and badges
      expect(find.text('Paneer Butter Masala'), findsOneWidget);
      expect(find.text('Chicken Tikka'), findsOneWidget);
      expect(find.text("86'd SOLD OUT"), findsOneWidget);

      // Check variant pricing preview
      expect(find.text('Half: ₹180.00'), findsOneWidget);
      expect(find.text('Full: ₹280.00'), findsOneWidget);

      // Check kitchen routing tags
      expect(find.text('Tandoor'), findsOneWidget);

      // Test dietary filter: Tap '🟢 Pure Veg'
      await tester.tap(find.text('🟢 Pure Veg'));
      await tester.pumpAndSettle();

      // Paneer Butter Masala should be visible, Chicken Tikka filtered out
      expect(find.text('Paneer Butter Masala'), findsOneWidget);
      expect(find.text('Chicken Tikka'), findsNothing);

      // Tap 'All Items'
      await tester.tap(find.text('All Items'));
      await tester.pumpAndSettle();

      expect(find.text('Chicken Tikka'), findsOneWidget);

      // Tap 'Add Dish' FAB opens dialog
      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();

      expect(find.text('Add Restaurant Dish'), findsOneWidget);
      expect(find.text('Portion Sizes (Half / Full / Custom)'), findsOneWidget);

      await db.close();
    });
  });
}
class _TestDatabaseUser extends drift.QueryExecutorUser {
  @override
  Future<void> beforeOpen(drift.QueryExecutor executor, drift.OpeningDetails details) async {}

  @override
  int get schemaVersion => 1;
}
