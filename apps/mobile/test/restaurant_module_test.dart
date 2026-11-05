import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/core/models/cart_item.dart';
import 'package:pos_mobile/core/models/product.dart';
import 'package:pos_mobile/core/providers/catalog_provider.dart';
import 'package:pos_mobile/core/providers/restaurant_provider.dart';
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
      expect(TableStatus.occupied.label, 'Occupied');
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
        status: TableStatus.occupied,
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
        status: TableStatus.occupied,
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
      expect(restored.status, TableStatus.occupied);
      expect(restored.activeOrderLines.length, 1);
      expect(restored.activeOrderLines.first.notes, 'No onion/garlic');
      expect(restored.activeOrderLines.first.product.name, 'Paneer Tikka Masala');
    });

    test('RestaurantNotifier manages table lifecycle, notes, transfers and busser cleaning', () {
      final notifier = RestaurantNotifier();

      // 1. Initially vacant
      final initialT1 = notifier.state.tables.firstWhere((t) => t.id == 't-1');
      expect(initialT1.status, TableStatus.vacant);
      expect(initialT1.activeOrderLines, isEmpty);

      // 2. Add dish with cooking note
      notifier.addItemToTable('t-1', testProductPaneer, qty: 2, notes: 'Extra crisp');
      var t1 = notifier.state.tables.firstWhere((t) => t.id == 't-1');
      expect(t1.status, TableStatus.occupied);
      expect(t1.activeOrderLines.length, 1);
      expect(t1.activeOrderLines.first.notes, 'Extra crisp');

      // 3. Update guest count
      notifier.setGuestCount('t-1', 4);
      t1 = notifier.state.tables.firstWhere((t) => t.id == 't-1');
      expect(t1.currentGuestCount, 4);

      // 4. Update cooking note
      notifier.updateLineNotes('t-1', testProductPaneer.id, 'Medium spicy, extra crisp');
      t1 = notifier.state.tables.firstWhere((t) => t.id == 't-1');
      expect(t1.activeOrderLines.first.notes, 'Medium spicy, extra crisp');

      // 5. Transfer Table to Table 2 (t-2)
      final transferSuccess = notifier.transferTable('t-1', 't-2');
      expect(transferSuccess, isTrue);

      final t1AfterTransfer = notifier.state.tables.firstWhere((t) => t.id == 't-1');
      final t2AfterTransfer = notifier.state.tables.firstWhere((t) => t.id == 't-2');
      expect(t1AfterTransfer.status, TableStatus.vacant);
      expect(t1AfterTransfer.activeOrderLines, isEmpty);
      expect(t2AfterTransfer.status, TableStatus.occupied);
      expect(t2AfterTransfer.activeOrderLines.length, 1);
      expect(t2AfterTransfer.activeOrderLines.first.product.id, testProductPaneer.id);
      expect(t2AfterTransfer.currentGuestCount, 4);

      // 6. Bill settled -> Table marked dirty for cleaning
      notifier.clearAndVacateTable('t-2', markDirty: true);
      final t2Dirty = notifier.state.tables.firstWhere((t) => t.id == 't-2');
      expect(t2Dirty.status, TableStatus.dirty);
      expect(t2Dirty.activeOrderLines, isEmpty);

      // 7. Busser marks clean -> Vacant again
      notifier.markTableClean('t-2');
      final t2Clean = notifier.state.tables.firstWhere((t) => t.id == 't-2');
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
      expect(find.text('AC Dining'), findsOneWidget);

      // Check table cards
      expect(find.byKey(const Key('table_card_t-1')), findsOneWidget);
      expect(find.text('Table 1'), findsOneWidget);
    });

    testWidgets('TableOrderSheet renders responsive menu tabs, items and KOT triggers', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final notifier = RestaurantNotifier();
      notifier.addItemToTable('t-1', testProductPaneer, qty: 1);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            restaurantProvider.overrideWith((ref) => notifier),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: TableOrderSheet(
                table: notifier.state.tables.firstWhere((t) => t.id == 't-1'),
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
      expect(find.byKey(const Key('settle_table_btn')), findsOneWidget);
    });
  });
}
