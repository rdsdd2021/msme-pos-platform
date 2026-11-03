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
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? executor]) : super(executor ?? _openConnection());

  @override
  int get schemaVersion => 1;

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
