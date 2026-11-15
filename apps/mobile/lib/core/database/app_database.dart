import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'tables.dart';

part 'app_database.g.dart';

@DriftDatabase(
  tables: [
    LocalProducts,
    LocalCustomers,
    LocalInvoices,
    LocalInvoiceLines,
    LocalPayments,
    LocalStockMovements,
    SyncOutbox,
    LocalRestaurantTables,
    LocalRestaurantOrders,
    LocalRestaurantKotLines,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? executor]) : super(executor ?? _openConnection());

  @override
  int get schemaVersion => 4;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            await m.createTable(localRestaurantTables);
            await m.createTable(localRestaurantOrders);
            await m.createTable(localRestaurantKotLines);
          }
          if (from < 4) {
            final pragmaRows = await customSelect("PRAGMA table_info('local_products')").get();
            final cols = pragmaRows.map((r) => r.read<String>('name')).toSet();

            if (!cols.contains('image_url')) {
              await m.addColumn(localProducts, localProducts.imageUrl);
            }
            if (!cols.contains('food_type')) {
              await m.addColumn(localProducts, localProducts.foodType);
            }
            if (!cols.contains('kitchen_station')) {
              await m.addColumn(localProducts, localProducts.kitchenStation);
            }
            if (!cols.contains('prep_time_minutes')) {
              await m.addColumn(localProducts, localProducts.prepTimeMinutes);
            }
            if (!cols.contains('is_available')) {
              await m.addColumn(localProducts, localProducts.isAvailable);
            }
            if (!cols.contains('is_made_to_order')) {
              await m.addColumn(localProducts, localProducts.isMadeToOrder);
            }
            if (!cols.contains('variants_json')) {
              await m.addColumn(localProducts, localProducts.variantsJson);
            }
          }
        },
        beforeOpen: (details) async {
          // Proactive self-healing check: ensure image_url, culinary columns, and restaurant tables exist
          try {
            final pragmaRows = await customSelect("PRAGMA table_info('local_products')").get();
            final cols = pragmaRows.map((r) => r.read<String>('name')).toSet();

            if (!cols.contains('image_url')) {
              await customStatement('ALTER TABLE local_products ADD COLUMN image_url TEXT');
            }
            if (!cols.contains('food_type')) {
              await customStatement('ALTER TABLE local_products ADD COLUMN food_type TEXT');
            }
            if (!cols.contains('kitchen_station')) {
              await customStatement('ALTER TABLE local_products ADD COLUMN kitchen_station TEXT');
            }
            if (!cols.contains('prep_time_minutes')) {
              await customStatement('ALTER TABLE local_products ADD COLUMN prep_time_minutes INTEGER');
            }
            if (!cols.contains('is_available')) {
              await customStatement('ALTER TABLE local_products ADD COLUMN is_available INTEGER NOT NULL DEFAULT 1');
            }
            if (!cols.contains('is_made_to_order')) {
              await customStatement('ALTER TABLE local_products ADD COLUMN is_made_to_order INTEGER NOT NULL DEFAULT 0');
            }
            if (!cols.contains('variants_json')) {
              await customStatement('ALTER TABLE local_products ADD COLUMN variants_json TEXT');
            }

            final tableRows = await customSelect("SELECT name FROM sqlite_master WHERE type='table'").get();
            final existingTables = tableRows.map((r) => r.read<String>('name')).toSet();

            if (!existingTables.contains('local_restaurant_tables')) {
              await customStatement('''
                CREATE TABLE IF NOT EXISTS local_restaurant_tables (
                  id TEXT NOT NULL PRIMARY KEY,
                  tenant_id TEXT NOT NULL,
                  branch_id TEXT NOT NULL,
                  table_number TEXT NOT NULL,
                  name TEXT,
                  section TEXT NOT NULL DEFAULT 'Main Dining',
                  seating_capacity INTEGER NOT NULL DEFAULT 4,
                  status TEXT NOT NULL DEFAULT 'vacant',
                  current_guest_count INTEGER NOT NULL DEFAULT 0,
                  occupied_at INTEGER,
                  sort_order INTEGER NOT NULL DEFAULT 0,
                  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
                );
              ''');
            }
            if (!existingTables.contains('local_restaurant_orders')) {
              await customStatement('''
                CREATE TABLE IF NOT EXISTS local_restaurant_orders (
                  id TEXT NOT NULL PRIMARY KEY,
                  tenant_id TEXT NOT NULL,
                  branch_id TEXT NOT NULL,
                  order_number TEXT NOT NULL,
                  order_type TEXT NOT NULL DEFAULT 'dine_in',
                  table_id TEXT,
                  table_number_snapshot TEXT,
                  section_snapshot TEXT,
                  guest_count INTEGER NOT NULL DEFAULT 1,
                  customer_id TEXT,
                  status TEXT NOT NULL DEFAULT 'open',
                  subtotal_paisa INTEGER NOT NULL DEFAULT 0,
                  tax_total_paisa INTEGER NOT NULL DEFAULT 0,
                  discount_total_paisa INTEGER NOT NULL DEFAULT 0,
                  grand_total_paisa INTEGER NOT NULL DEFAULT 0,
                  captain_name_snapshot TEXT,
                  notes TEXT,
                  invoice_id TEXT,
                  opened_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                  closed_at INTEGER
                );
              ''');
            }
            if (!existingTables.contains('local_restaurant_kot_lines')) {
              await customStatement('''
                CREATE TABLE IF NOT EXISTS local_restaurant_kot_lines (
                  id TEXT NOT NULL PRIMARY KEY,
                  tenant_id TEXT NOT NULL,
                  order_id TEXT NOT NULL,
                  kot_id TEXT,
                  product_id TEXT NOT NULL,
                  product_name TEXT NOT NULL,
                  quantity REAL NOT NULL DEFAULT 1.0,
                  unit_price_paisa INTEGER NOT NULL DEFAULT 0,
                  total_paisa INTEGER NOT NULL DEFAULT 0,
                  kitchen_station TEXT NOT NULL DEFAULT 'main_kitchen',
                  special_instructions TEXT,
                  status TEXT NOT NULL DEFAULT 'pending',
                  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
                );
              ''');
            }
          } catch (e, st) {
            // Defensive check
            print('DEBUG beforeOpen error: $e\n$st');
          }
        },
      );

  static LazyDatabase _openConnection() {
    return LazyDatabase(() async {
      if (Platform.environment.containsKey('FLUTTER_TEST')) {
        return NativeDatabase.memory();
      }
      try {
        final dbFolder = await getApplicationDocumentsDirectory();
        final file = File(p.join(dbFolder.path, 'kirana_pos.sqlite'));
        return NativeDatabase.createInBackground(file);
      } catch (_) {
        return NativeDatabase.memory();
      }
    });
  }

  /// In-memory database constructor for reliable unit and integration testing
  factory AppDatabase.inMemory() {
    return AppDatabase(NativeDatabase.memory());
  }
}
