import '../models/cart_item.dart';
import '../models/receipt_document.dart';
import '../database/app_database.dart';
import '../repositories/local_billing_repository.dart';

class OfflineSaleResult {
  final String invoiceId;
  final String invoiceNumber;
  final String paymentMethod;
  final int totalPaisa;
  final String receiptText;
  final DateTime createdAt;
  final ReceiptDocument? receiptDocument;

  const OfflineSaleResult({
    required this.invoiceId,
    required this.invoiceNumber,
    required this.paymentMethod,
    required this.totalPaisa,
    required this.receiptText,
    required this.createdAt,
    this.receiptDocument,
  });

  double get totalRupees => totalPaisa / 100.0;
}

class OfflineBillingService {
  static AppDatabase? _database;
  static LocalBillingRepository? _repository;

  /// Configure or override the database instance (e.g. for in-memory testing)
  static void setDatabase(AppDatabase db) {
    _database = db;
    _repository = LocalBillingRepository(db);
  }

  static AppDatabase get database {
    _database ??= AppDatabase();
    return _database!;
  }

  static LocalBillingRepository get repository {
    _repository ??= LocalBillingRepository(database);
    return _repository!;
  }

  /// Process and persist an offline sale atomically.
  /// Writes invoice, lines, payment, stock deduction movement, and sync outbox
  /// in one single SQLite transaction before returning.
  static Future<OfflineSaleResult> processSale({
    required List<CartItem> items,
    required String paymentMethod,
    String? customerName,
    String? customerId,
    String tenantId = 'tenant-1',
    String branchId = 'branch-1',
    String deviceId = 'device-pos-01',
  }) async {
    return repository.createSaleAtomic(
      items: items,
      paymentMethod: paymentMethod,
      customerId: customerId,
      customerName: customerName,
      tenantId: tenantId,
      branchId: branchId,
      deviceId: deviceId,
    );
  }

  /// Retrieve all locally saved invoices from SQLite
  static Future<List<LocalInvoice>> getAllInvoices() async {
    return repository.getAllInvoices();
  }

  /// Retrieve all lines for an invoice
  static Future<List<LocalInvoiceLine>> getInvoiceLines(String invoiceId) async {
    return repository.getInvoiceLines(invoiceId);
  }

  /// Reconstruct a ReceiptDocument for an existing invoice for duplicate reprint
  static Future<ReceiptDocument?> getReceiptDocument(String invoiceId) async {
    return repository.getReceiptDocument(invoiceId);
  }
}

