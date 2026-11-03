import 'dart:async';
import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';
import '../database/app_database.dart';
import '../models/customer.dart';

class LocalCustomerRepository {
  final AppDatabase _db;

  LocalCustomerRepository(this._db);

  Customer _mapToModel(LocalCustomer row) {
    return Customer(
      id: row.id,
      name: row.name,
      phone: row.phone,
      creditLimitPaisa: row.creditLimitPaisa,
      currentBalancePaisa: row.currentBalancePaisa,
    );
  }

  /// Seeds initial Kirana customers if table is currently empty
  Future<void> seedInitialCustomersIfEmpty({String tenantId = 'tenant-1'}) async {
    final count = await _db.localCustomers.count().getSingle();
    if (count > 0) return;

    final initialCustomers = [
      LocalCustomersCompanion.insert(
        id: 'c-1',
        tenantId: tenantId,
        name: 'Ramesh Sharma',
        phone: '+919876543210',
        creditLimitPaisa: const Value(500000), // ₹5,000.00
        currentBalancePaisa: const Value(125000), // ₹1,250.00 outstanding
        updatedAt: Value(DateTime.now()),
      ),
      LocalCustomersCompanion.insert(
        id: 'c-2',
        tenantId: tenantId,
        name: 'Pooja Verma',
        phone: '+919876543211',
        creditLimitPaisa: const Value(300000), // ₹3,000.00
        currentBalancePaisa: const Value(42000), // ₹420.00 outstanding
        updatedAt: Value(DateTime.now()),
      ),
      LocalCustomersCompanion.insert(
        id: 'c-3',
        tenantId: tenantId,
        name: 'Suresh Patel',
        phone: '+919876543212',
        creditLimitPaisa: const Value(1000000), // ₹10,000.00
        currentBalancePaisa: const Value(0),
        updatedAt: Value(DateTime.now()),
      ),
    ];

    await _db.batch((batch) {
      batch.insertAll(_db.localCustomers, initialCustomers);
    });
  }

  /// Reactive stream of all customers ordered by name
  Stream<List<Customer>> watchAllCustomers() {
    return (_db.select(_db.localCustomers)
          ..orderBy([(c) => OrderingTerm(expression: c.name, mode: OrderingMode.asc)]))
        .watch()
        .map((rows) => rows.map(_mapToModel).toList());
  }

  /// Snapshot of all customers
  Future<List<Customer>> getAllCustomers() async {
    final rows = await (_db.select(_db.localCustomers)
          ..orderBy([(c) => OrderingTerm(expression: c.name, mode: OrderingMode.asc)]))
        .get();
    return rows.map(_mapToModel).toList();
  }

  /// Find customer by id
  Future<Customer?> getCustomerById(String id) async {
    final row = await (_db.select(_db.localCustomers)
          ..where((c) => c.id.equals(id)))
        .getSingleOrNull();
    return row != null ? _mapToModel(row) : null;
  }

  /// Create new customer record locally
  Future<Customer> createCustomer({
    required String name,
    required String phone,
    int creditLimitPaisa = 500000,
    String tenantId = 'tenant-1',
  }) async {
    final id = const Uuid().v4();
    final companion = LocalCustomersCompanion.insert(
      id: id,
      tenantId: tenantId,
      name: name.trim(),
      phone: phone.trim(),
      creditLimitPaisa: Value(creditLimitPaisa),
      currentBalancePaisa: const Value(0),
      updatedAt: Value(DateTime.now()),
    );

    await _db.into(_db.localCustomers).insert(companion);
    return Customer(
      id: id,
      name: name.trim(),
      phone: phone.trim(),
      creditLimitPaisa: creditLimitPaisa,
      currentBalancePaisa: 0,
    );
  }

  /// Update customer debt balance when a Khata purchase or repayment occurs
  Future<void> adjustCustomerBalance(String customerId, int deltaPaisa) async {
    final existing = await (_db.select(_db.localCustomers)
          ..where((c) => c.id.equals(customerId)))
        .getSingleOrNull();

    if (existing != null) {
      final newBalance = existing.currentBalancePaisa + deltaPaisa;
      await (_db.update(_db.localCustomers)..where((c) => c.id.equals(customerId))).write(
        LocalCustomersCompanion(
          currentBalancePaisa: Value(newBalance),
          updatedAt: Value(DateTime.now()),
        ),
      );
    }
  }

  /// Compute total outstanding Khata ledger balance across all customers
  Future<int> getTotalKhataOutstandingPaisa() async {
    final all = await (_db.select(_db.localCustomers)).get();
    return all.fold<int>(0, (sum, c) => sum + c.currentBalancePaisa);
  }
}

