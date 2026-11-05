import 'dart:async';
import 'dart:convert';
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

  /// Purges any legacy mock customers
  Future<void> purgeMockCustomersIfPresent() async {
    await (_db.delete(_db.localCustomers)
          ..where((t) => t.tenantId.equals('tenant-1') | t.id.isIn(['c-1', 'c-2', 'c-3'])))
        .go();
  }

  /// Reactive stream of all customers ordered by name, optionally filtered by tenant
  Stream<List<Customer>> watchAllCustomers({String? tenantId}) {
    final query = _db.select(_db.localCustomers);
    if (tenantId != null && tenantId.isNotEmpty) {
      query.where((c) => c.tenantId.equals(tenantId));
    }
    return (query..orderBy([(c) => OrderingTerm(expression: c.name, mode: OrderingMode.asc)]))
        .watch()
        .map((rows) => rows.map(_mapToModel).toList());
  }

  /// Snapshot of all customers, optionally filtered by tenant
  Future<List<Customer>> getAllCustomers({String? tenantId}) async {
    final query = _db.select(_db.localCustomers);
    if (tenantId != null && tenantId.isNotEmpty) {
      query.where((c) => c.tenantId.equals(tenantId));
    }
    final rows = await (query
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

  /// Record customer credit repayment atomically and queue sync outbox
  Future<int> recordRepayment({
    required String customerId,
    required int amountPaisa,
    required String paymentMethod,
    String deviceId = 'pos-mobile-01',
  }) async {
    final now = DateTime.now();
    final existing = await (_db.select(_db.localCustomers)..where((c) => c.id.equals(customerId))).getSingleOrNull();
    if (existing == null) throw ArgumentError('Customer not found');

    final updatedBalance = (existing.currentBalancePaisa - amountPaisa).clamp(0, 1000000000);

    await _db.transaction(() async {
      await (_db.update(_db.localCustomers)..where((c) => c.id.equals(customerId))).write(
        LocalCustomersCompanion(
          currentBalancePaisa: Value(updatedBalance),
          updatedAt: Value(now),
        ),
      );

      await _db.into(_db.syncOutbox).insert(
        SyncOutboxCompanion.insert(
          operationId: const Uuid().v4(),
          deviceId: deviceId,
          sequence: DateTime.now().millisecondsSinceEpoch % 1000000,
          operationType: 'CUSTOMER_REPAYMENT',
          schemaVersion: const Value(1),
          payload: jsonEncode({
            'customerId': customerId,
            'customerName': existing.name,
            'amount': (amountPaisa / 100.0).toStringAsFixed(2),
            'method': paymentMethod,
            'remainingBalance': (updatedBalance / 100.0).toStringAsFixed(2),
          }),
          status: const Value('pending'),
          retryCount: const Value(0),
          createdAt: Value(now),
        ),
      );
    });

    return updatedBalance;
  }

  /// Compute total outstanding Khata ledger balance across all customers
  Future<int> getTotalKhataOutstandingPaisa() async {
    final all = await (_db.select(_db.localCustomers)).get();
    return all.fold<int>(0, (sum, c) => sum + c.currentBalancePaisa);
  }
}

