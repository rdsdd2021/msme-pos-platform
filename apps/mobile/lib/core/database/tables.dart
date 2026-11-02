import 'package:drift/drift.dart';

// --- Local Catalog & Inventory ---

class LocalProducts extends Table {
  TextColumn get id => text()();
  TextColumn get tenantId => text()();
  TextColumn get sku => text()();
  TextColumn get name => text()();
  TextColumn get barcode => text().nullable()();
  IntColumn get sellingPricePaisa => integer()();
  IntColumn get purchaseCostPaisa => integer().withDefault(const Constant(0))();
  IntColumn get mrpPaisa => integer().withDefault(const Constant(0))();
  RealColumn get gstRatePercent => real().withDefault(const Constant(0.0))();
  TextColumn get hsnCode => text().nullable()();
  TextColumn get categoryName => text().nullable()();
  TextColumn get unit => text().withDefault(const Constant('PCS'))();
  RealColumn get stockQuantity => real().withDefault(const Constant(0.0))();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalCustomers extends Table {
  TextColumn get id => text()();
  TextColumn get tenantId => text()();
  TextColumn get name => text()();
  TextColumn get phone => text()();
  IntColumn get creditLimitPaisa => integer().withDefault(const Constant(0))();
  IntColumn get currentBalancePaisa => integer().withDefault(const Constant(0))();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

// --- Local Sales & Financial Documents (Immutable Invariant) ---

class LocalInvoices extends Table {
  TextColumn get id => text()();
  TextColumn get tenantId => text()();
  TextColumn get branchId => text()();
  TextColumn get deviceId => text()();
  TextColumn get invoiceNumber => text()();
  TextColumn get customerId => text().nullable()();
  TextColumn get customerName => text().nullable()();
  IntColumn get subtotalPaisa => integer()();
  IntColumn get taxPaisa => integer()();
  IntColumn get grandTotalPaisa => integer()();
  TextColumn get paymentMethod => text()();
  TextColumn get status => text().withDefault(const Constant('completed'))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalInvoiceLines extends Table {
  TextColumn get id => text()();
  TextColumn get invoiceId => text().references(LocalInvoices, #id)();
  TextColumn get productId => text()();
  TextColumn get productName => text()();
  TextColumn get hsnCode => text().nullable()();
  RealColumn get gstRatePercent => real().withDefault(const Constant(0.0))();
  RealColumn get quantity => real()();
  IntColumn get unitPricePaisa => integer()();
  IntColumn get taxPaisa => integer()();
  IntColumn get totalPaisa => integer()();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalPayments extends Table {
  TextColumn get id => text()();
  TextColumn get invoiceId => text().references(LocalInvoices, #id)();
  TextColumn get paymentMethod => text()(); // cash, upi, card, khata
  IntColumn get amountPaisa => integer()();
  TextColumn get status => text().withDefault(const Constant('completed'))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

// --- Perpetual Local Stock Ledger Movements ---

class LocalStockMovements extends Table {
  TextColumn get id => text()();
  TextColumn get productId => text()();
  TextColumn get movementType => text()(); // sale, adjustment, transfer_out, transfer_in
  RealColumn get quantity => real()(); // negative for sale deduction
  TextColumn get referenceId => text()(); // invoiceId
  TextColumn get reason => text()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

// --- Offline Synchronization Outbox ---

class SyncOutbox extends Table {
  TextColumn get operationId => text()();
  TextColumn get deviceId => text()();
  IntColumn get sequence => integer()();
  TextColumn get operationType => text()(); // CREATE_SALE, etc.
  IntColumn get schemaVersion => integer().withDefault(const Constant(1))();
  TextColumn get payload => text()(); // JSON serialized payload
  TextColumn get status => text().withDefault(const Constant('pending'))(); // pending, sending, accepted, rejected
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  TextColumn get lastError => text().nullable()();
  TextColumn get serverEntityId => text().nullable()();

  @override
  Set<Column> get primaryKey => {operationId};
}

