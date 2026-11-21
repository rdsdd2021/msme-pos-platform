import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/models/cart_item.dart';
import 'package:pos_mobile/core/models/product.dart';
import 'package:pos_mobile/core/providers/restaurant_provider.dart';
import 'package:pos_mobile/core/providers/cart_provider.dart';
import 'package:pos_mobile/core/repositories/local_catalog_repository.dart';
import 'package:pos_mobile/features/restaurant/restaurant_tables_screen.dart';
import 'package:pos_mobile/features/restaurant/table_order_sheet.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final testProductPaneer = Product(
    id: 'prod-paneer-tikka',
    name: 'Paneer Tikka Masala',
    sku: 'DISH-PTM-01',
    category: 'Main Course',
    unit: 'PLATE',
    sellingPricePaisa: 28000, // ₹280.00
    purchaseCostPaisa: 15000,
    gstRate: 5,
    currentStock: 50,
  );

  final testProductNaan = Product(
    id: 'prod-garlic-naan',
    name: 'Butter Garlic Naan',
    sku: 'BREAD-BGN-01',
    category: 'Breads',
    unit: 'PCS',
    sellingPricePaisa: 6000, // ₹60.00
    purchaseCostPaisa: 2000,
    gstRate: 5,
    currentStock: 100,
  );

  group('Restaurant & Dining Module Logic Tests', () {
    test('TableStatus enum supports complete lifecycle including cleaning turnover', () {
      expect(TableStatus.vacant.label, 'Vacant');
      expect(TableStatus.seated.label, 'Seated');
      expect(TableStatus.ordered.label, 'Ordered');
      expect(TableStatus.billed.label, 'Billed');
      expect(TableStatus.dirty.label, 'Needs Cleaning');
    });

    test('RestaurantTable calculates running totals, taxes and counts accurately', () {
      final line1 = CartItem(product: testProductPaneer, quantity: 2, notes: 'Less spicy');
      final line2 = CartItem(product: testProductNaan, quantity: 4);

      final table = RestaurantTable(
        id: 't-test-1',
        name: 'Table 1',
        section: 'AC Dining',
        capacity: 4,
        currentGuestCount: 3,
        status: TableStatus.seated,
        activeOrderLines: [line1, line2],
      );

      // line1: 2 * 280 = 560 + 5% tax (28) = 58800 paisa
      // line2: 4 * 60 = 240 + 5% tax (12) = 25200 paisa
      expect(table.itemCount, 6);
      expect(table.runningTotalPaisa, line1.totalPaisa + line2.totalPaisa);
      expect(table.runningTotalPaisa, 84000); // ₹840.00
    });

    test('RestaurantTable JSON serialization and deserialization preserves notes and items', () {
      final table = RestaurantTable(
        id: 't-test-serial',
        name: 'Table 5',
        section: 'Terrace',
        capacity: 6,
        currentGuestCount: 5,
        status: TableStatus.seated,
        seatedAt: DateTime(2026, 11, 5, 20, 30),
        captainNotes: 'VIP Guest',
        activeOrderLines: [
          CartItem(product: testProductPaneer, quantity: 1, notes: 'No onion/garlic'),
        ],
      );

      final json = table.toJson();
      final restored = RestaurantTable.fromJson(json);

      expect(restored.id, table.id);
      expect(restored.name, table.name);
      expect(restored.currentGuestCount, 5);
      expect(restored.captainNotes, 'VIP Guest');
      expect(restored.status, TableStatus.seated);
      expect(restored.activeOrderLines.length, 1);
      expect(restored.activeOrderLines.first.notes, 'No onion/garlic');
      expect(restored.activeOrderLines.first.product.name, 'Paneer Tikka Masala');
    });

    test('RestaurantNotifier manages table lifecycle, notes, transfers and busser cleaning', () {
      final notifier = RestaurantNotifier();

      // 1. Initially vacant
      final initialT1 = notifier.state.tables.firstWhere((t) => t.id == 'T-01');
      expect(initialT1.status, TableStatus.vacant);
      expect(initialT1.activeOrderLines, isEmpty);

      // 2. Add dish with cooking note
      notifier.addItemToTable('T-01', testProductPaneer, qty: 2, notes: 'Extra crisp');
      var t1 = notifier.state.tables.firstWhere((t) => t.id == 'T-01');
      expect(t1.status, TableStatus.seated);
      expect(t1.activeOrderLines.length, 1);
      expect(t1.activeOrderLines.first.notes, 'Extra crisp');

      // 3. Update guest count
      notifier.setGuestCount('T-01', 4);
      t1 = notifier.state.tables.firstWhere((t) => t.id == 'T-01');
      expect(t1.currentGuestCount, 4);

      // 4. Update cooking note
      notifier.updateLineNotes('T-01', testProductPaneer.id, 'Medium spicy, extra crisp');
      t1 = notifier.state.tables.firstWhere((t) => t.id == 'T-01');
      expect(t1.activeOrderLines.first.notes, 'Medium spicy, extra crisp');

      // 5. Transfer Table to Table 2 (T-02)
      final transferSuccess = notifier.transferTable('T-01', 'T-02');
      expect(transferSuccess, isTrue);

      final t1AfterTransfer = notifier.state.tables.firstWhere((t) => t.id == 'T-01');
      final t2AfterTransfer = notifier.state.tables.firstWhere((t) => t.id == 'T-02');
      expect(t1AfterTransfer.status, TableStatus.vacant);
      expect(t1AfterTransfer.activeOrderLines, isEmpty);
      expect(t2AfterTransfer.status, TableStatus.seated);
      expect(t2AfterTransfer.activeOrderLines.length, 1);
      expect(t2AfterTransfer.activeOrderLines.first.product.id, testProductPaneer.id);
      expect(t2AfterTransfer.currentGuestCount, 4);

      // 6. Bill settled -> Table marked dirty for cleaning
      notifier.clearAndVacateTable('T-02', markDirty: true);
      final t2Dirty = notifier.state.tables.firstWhere((t) => t.id == 'T-02');
      expect(t2Dirty.status, TableStatus.dirty);
      expect(t2Dirty.activeOrderLines, isEmpty);

      // 7. Busser marks clean -> Vacant again
      notifier.markTableClean('T-02');
      final t2Clean = notifier.state.tables.firstWhere((t) => t.id == 'T-02');
      expect(t2Clean.status, TableStatus.vacant);
    });
  });

  group('Restaurant Screen & Order Sheet UI Tests', () {
    testWidgets('RestaurantTablesScreen renders Shadcn table cards and KPI strip', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: RestaurantTablesScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Check metrics header
      expect(find.text('Occupied Tables'), findsOneWidget);
      expect(find.text('Active Dine-In'), findsOneWidget);
      expect(find.text('Active Diners'), findsOneWidget);

      // Check section chips
      expect(find.text('All'), findsOneWidget);
      expect(find.text('Main Dining'), findsOneWidget);

      // Check table cards
      expect(find.byKey(const Key('table_card_T-01')), findsOneWidget);
      expect(find.text('Table 1'), findsOneWidget);
    });

    testWidgets('TableOrderSheet renders responsive menu tabs, items and KOT triggers', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final notifier = RestaurantNotifier();
      notifier.addItemToTable('T-01', testProductPaneer, qty: 1);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            restaurantProvider.overrideWith((ref) => notifier),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: TableOrderSheet(
                table: notifier.state.tables.firstWhere((t) => t.id == 'T-01'),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Header info
      expect(find.text('Table 1'), findsOneWidget);

      // Phone segmented tabs
      expect(find.text('📋 Menu'), findsOneWidget);
      expect(find.textContaining('🍽️ Order'), findsOneWidget);

      // Switch to Order tab
      await tester.tap(find.textContaining('🍽️ Order'));
      await tester.pumpAndSettle();

      // Verify active running order pane
      expect(find.text('Active Running Order'), findsOneWidget);
      expect(find.text('Paneer Tikka Masala'), findsOneWidget);
      expect(find.byKey(const Key('print_kot_btn')), findsOneWidget);
      expect(find.byKey(const Key('confirm_order_btn')), findsOneWidget);

      // Tap Confirm / Place Order
      await tester.tap(find.byKey(const Key('confirm_order_btn')));
      await tester.pumpAndSettle();

      // Now all items are placed -> button changes to Print Bill (settle_table_btn)
      expect(find.byKey(const Key('settle_table_btn')), findsOneWidget);
      expect(find.text('Print Bill'), findsOneWidget);
    });

    test('Product model supports vertical-aware restaurant culinary attributes', () {
      final dish = Product(
        id: 'dish-1',
        name: 'Butter Chicken',
        sku: 'DISH-BC-01',
        category: 'Main Course',
        unit: 'PORTION',
        sellingPricePaisa: 34000,
        purchaseCostPaisa: 0,
        gstRate: 5,
        currentStock: 0,
        foodType: 'non_veg',
        kitchenStation: 'main_kitchen',
        prepTimeMinutes: 20,
        isAvailable: true,
        isMadeToOrder: true,
      );

      expect(dish.isNonVeg, isTrue);
      expect(dish.isVeg, isFalse);
      expect(dish.isEgg, isFalse);
      expect(dish.isMadeToOrder, isTrue);
      expect(dish.isAvailable, isTrue);
      expect(dish.prepTimeMinutes, 20);
    });

    test('Product supports portion variants (Half/Full) and price calculation', () {
      final variants = [
        const ProductVariant(name: 'Half', price: 180.0),
        const ProductVariant(name: 'Full', price: 320.0),
      ];

      final dish = Product(
        id: 'dish-paneer-butter',
        name: 'Paneer Butter Masala',
        sku: 'DISH-PBM-01',
        category: 'Main Course',
        unit: 'PORTION',
        sellingPricePaisa: 32000,
        purchaseCostPaisa: 0,
        gstRate: 5,
        currentStock: 0,
        foodType: 'veg',
        kitchenStation: 'main_kitchen',
        variants: variants,
      );

      expect(dish.isVeg, isTrue);
      expect(dish.variants?.length, 2);
      expect(dish.variants?[0].name, 'Half');
      expect(dish.variants?[0].pricePaisa, 18000);
      expect(dish.variants?[1].name, 'Full');
      expect(dish.variants?[1].pricePaisa, 32000);

      // Verify CartItem with portion variant retains pristine base product UUID
      final cartItemHalf = CartItem(
        product: dish,
        quantity: 2,
        variantName: 'Half',
        variantPricePaisa: variants[0].pricePaisa,
      );
      expect(cartItemHalf.product.id, dish.id); // Pristine UUID/ID!
      expect(cartItemHalf.lineKey, '${dish.id}__Half');
      expect(cartItemHalf.displayName, 'Paneer Butter Masala (Half)');
      expect(cartItemHalf.unitPricePaisa, 18000);
      expect(cartItemHalf.subtotalPaisa, 36000);
      expect(cartItemHalf.taxPaisa, 1800); // 5% GST on 36000 = 1800
      expect(cartItemHalf.totalPaisa, 37800);
    });

    test('LocalCatalogRepository persists and retrieves restaurant dish culinary fields in SQLite', () async {
      final db = AppDatabase.inMemory();
      final repo = LocalCatalogRepository(db);

      final variants = [
        const ProductVariant(name: 'Half', price: 150.0),
        const ProductVariant(name: 'Full', price: 270.0),
      ];

      // 1. Create dish with culinary attributes
      final created = await repo.createProduct(
        name: 'Dal Makhani',
        sku: 'DISH-DM-01',
        category: 'Main Course',
        sellingPricePaisa: 27000,
        foodType: 'veg',
        kitchenStation: 'main_kitchen',
        prepTimeMinutes: 15,
        isAvailable: true,
        isMadeToOrder: true,
        variants: variants,
        tenantId: 'tenant-test',
      );

      expect(created.foodType, 'veg');
      expect(created.kitchenStation, 'main_kitchen');
      expect(created.isVeg, isTrue);
      expect(created.variants?.length, 2);

      // 2. Query all products from SQLite
      final all = await repo.getAllProducts(tenantId: 'tenant-test');
      expect(all.length, 1);
      final fetched = all.first;
      expect(fetched.name, 'Dal Makhani');
      expect(fetched.foodType, 'veg');
      expect(fetched.kitchenStation, 'main_kitchen');
      expect(fetched.prepTimeMinutes, 15);
      expect(fetched.isAvailable, isTrue);
      expect(fetched.isMadeToOrder, isTrue);
      expect(fetched.variants?.length, 2);
      expect(fetched.variants?[0].name, 'Half');
      expect(fetched.variants?[0].price, 150.0);

      // 3. Update availability (86'd)
      final soldOutDish = fetched.copyWith(isAvailable: false);
      await repo.updateProduct(soldOutDish);

      final afterUpdate = await repo.getAllProducts(tenantId: 'tenant-test');
      expect(afterUpdate.first.isAvailable, isFalse);

      await db.close();
    });

    test('CartNotifier allows made-to-order culinary dishes with 0 on-hand stock', () {
      final cartNotifier = CartNotifier();
      final madeToOrderDish = Product(
        id: 'dish-chef-special',
        name: 'Chef Special Paneer',
        sku: 'DISH-999',
        category: 'Main Course',
        unit: 'PORTION',
        sellingPricePaisa: 35000,
        purchaseCostPaisa: 0,
        gstRate: 5,
        currentStock: 0.0,
        isMadeToOrder: true,
      );

      final added = cartNotifier.addProduct(madeToOrderDish);
      expect(added, isTrue);
      expect(cartNotifier.state.items.length, 1);
      expect(cartNotifier.state.items.first.product.id, 'dish-chef-special');
      expect(cartNotifier.state.items.first.quantity, 1);
    });

    test('purgeMockDataIfPresent does NOT wipe user-created products with fallback tenantId', () async {
      final db = AppDatabase.inMemory();
      final repo = LocalCatalogRepository(db);

      // Create a user product under tenant-1
      final userProduct = await repo.createProduct(
        name: 'Gulab Jamun',
        sku: 'DISH-GJ-1',
        category: 'Dessert',
        sellingPricePaisa: 6000,
        tenantId: 'tenant-1',
      );

      // Purge mock data
      await repo.purgeMockDataIfPresent('tenant-1');

      // Product must still exist!
      final all = await repo.getAllProducts(tenantId: 'tenant-1');
      expect(all.any((p) => p.id == userProduct.id), isTrue);

      await db.close();
    });
  });
}
