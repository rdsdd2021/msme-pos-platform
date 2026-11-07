import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';
import '../config/app_config.dart';
import '../database/app_database.dart';
import '../models/cart_item.dart';
import '../models/receipt_document.dart';
import '../services/offline_billing_service.dart';

class LocalBillingRepository {
  final AppDatabase _db;
  static int _invoiceSequence = 1001;
  static int _outboxSequence = 1;

  LocalBillingRepository(this._db);

  /// Executes complete offline sale transaction atomically compliant with Rule 13:
  /// (Local sale writes invoice, lines, payment, stock movement and outbox in one SQLite transaction).
  Future<OfflineSaleResult> createSaleAtomic({
    required List<CartItem> items,
    required String paymentMethod,
    String? customerId,
    String? customerName,
    String tenantId = 'tenant-1',
    String branchId = 'branch-1',
    String? deviceId,
  }) async {
    if (items.isEmpty) {
      throw ArgumentError('Cannot process sale with empty cart');
    }

    final resolvedDeviceId = (deviceId != null && deviceId.isNotEmpty && deviceId != 'device-pos-01')
        ? deviceId
        : await AppConfig.getDeviceId();
    final invoiceId = const Uuid().v4();
    final now = DateTime.now();
    final invoiceNumber = 'INV-${now.year}-$_invoiceSequence';
    _invoiceSequence++;

    // Safe integer calculation in Paisa (Rule 8: Never use floating-point for money)
    final grandTotalPaisa = items.fold(0, (sum, i) => sum + i.totalPaisa);
    final totalTaxPaisa = items.fold(0, (sum, i) => sum + i.taxPaisa);
    final subtotalPaisa = grandTotalPaisa - totalTaxPaisa;

    // Build thermal receipt text (ESC/POS 58mm/80mm format)
    final receiptBuffer = StringBuffer();
    receiptBuffer.writeln('================================');
    receiptBuffer.writeln('      KIRANA SUPERMART');
    receiptBuffer.writeln('  Shop 4, Andheri West, Mumbai');
    receiptBuffer.writeln('    GSTIN: 27AABCU9603R1ZM');
    receiptBuffer.writeln('--------------------------------');
    receiptBuffer.writeln('Invoice: $invoiceNumber');
    receiptBuffer.writeln('Date:    ${now.day}/${now.month}/${now.year} ${now.hour}:${now.minute.toString().padLeft(2, '0')}');
    if (customerName != null && customerName.isNotEmpty) {
      receiptBuffer.writeln('Khata:   $customerName');
    }
    receiptBuffer.writeln('Tender:  ${paymentMethod.toUpperCase()}');
    receiptBuffer.writeln('--------------------------------');
    receiptBuffer.writeln('Item          Qty   Rate   Total');
    receiptBuffer.writeln('--------------------------------');

    for (final item in items) {
      final name = item.product.name.length > 13
          ? item.product.name.substring(0, 13)
          : item.product.name.padRight(13);
      final qty = item.quantity.toString().padRight(4);
      final rate = (item.product.sellingPricePaisa / 100).toStringAsFixed(1).padLeft(6);
      final total = (item.totalPaisa / 100).toStringAsFixed(1).padLeft(7);
      receiptBuffer.writeln('$name $qty$rate$total');
    }

    receiptBuffer.writeln('--------------------------------');
    receiptBuffer.writeln('Subtotal:             Rs. ${(subtotalPaisa / 100.0).toStringAsFixed(2)}');
    receiptBuffer.writeln('GST (CGST+SGST):      Rs. ${(totalTaxPaisa / 100.0).toStringAsFixed(2)}');
    receiptBuffer.writeln('GRAND TOTAL:          Rs. ${(grandTotalPaisa / 100.0).toStringAsFixed(2)}');
    receiptBuffer.writeln('================================');
    receiptBuffer.writeln('   Thank You! Visit Again!');
    receiptBuffer.writeln('  Powering Indian Retail MSMEs');
    receiptBuffer.writeln('================================');

    // Create PushSync payload matching server CreateSaleDto
    final syncPayload = {
      'invoiceNumber': invoiceNumber,
      'idempotencyKey': invoiceNumber,
      'customerId': customerId,
      'branchId': branchId,
      'items': items
          .map(
            (i) => {
              'productId': i.product.id,
              'sku': i.product.sku,
              'barcode': i.product.barcode,
              'quantity': i.quantity.toString(),
              'discountAmount': '0.00',
              'gstRatePercent': i.product.gstRate.toString(),
            },
          )
          .toList(),
      'lines': items
          .map(
            (i) => {
              'productId': i.product.id,
              'quantity': i.quantity.toString(),
              'unitPrice': (i.product.sellingPricePaisa / 100.0).toStringAsFixed(2),
              'gstRate': i.product.gstRate.toString(),
              'hsnCode': i.product.hsnCode,
            },
          )
          .toList(),
      'payments': [
        {
          'paymentMethod': paymentMethod,
          'method': paymentMethod,
          'amount': (grandTotalPaisa / 100.0).toStringAsFixed(2),
        }
      ],
      'notes': 'Offline Android Sale',
    };

    // Execute atomic SQLite transaction
    await _db.transaction(() async {
      // 1. Insert local invoice
      await _db.into(_db.localInvoices).insert(
        LocalInvoicesCompanion.insert(
          id: invoiceId,
          tenantId: tenantId,
          branchId: branchId,
          deviceId: resolvedDeviceId,
          invoiceNumber: invoiceNumber,
          customerId: Value(customerId),
          customerName: Value(customerName),
          subtotalPaisa: subtotalPaisa,
          taxPaisa: totalTaxPaisa,
          grandTotalPaisa: grandTotalPaisa,
          paymentMethod: paymentMethod,
          status: const Value('completed'),
          createdAt: Value(now),
        ),
      );

      // 2. Insert invoice lines with immutable tax & price snapshots
      for (final item in items) {
        await _db.into(_db.localInvoiceLines).insert(
          LocalInvoiceLinesCompanion.insert(
            id: const Uuid().v4(),
            invoiceId: invoiceId,
            productId: item.product.id,
            productName: item.product.name,
            hsnCode: Value(item.product.hsnCode),
            gstRatePercent: Value(item.product.gstRate.toDouble()),
            quantity: item.quantity.toDouble(),
            unitPricePaisa: item.product.sellingPricePaisa,
            taxPaisa: item.taxPaisa,
            totalPaisa: item.totalPaisa,
          ),
        );

        // 3. Insert local stock deduction movement
        await _db.into(_db.localStockMovements).insert(
          LocalStockMovementsCompanion.insert(
            id: const Uuid().v4(),
            productId: item.product.id,
            movementType: 'sale',
            quantity: -item.quantity.toDouble(), // Negative deduction
            referenceId: invoiceId,
            reason: 'POS Sale $invoiceNumber',
            createdAt: Value(now),
          ),
        );

        // Update local product on-hand stock projection if product exists
        final existingProduct = await (_db.select(_db.localProducts)
              ..where((p) => p.id.equals(item.product.id)))
            .getSingleOrNull();

        if (existingProduct != null) {
          final updatedStock = existingProduct.stockQuantity - item.quantity.toDouble();
          await (_db.update(_db.localProducts)
                ..where((p) => p.id.equals(item.product.id)))
              .write(
            LocalProductsCompanion(
              stockQuantity: Value(updatedStock),
              updatedAt: Value(now),
            ),
          );
        }
      }

      // 4. Insert local payment record
      await _db.into(_db.localPayments).insert(
        LocalPaymentsCompanion.insert(
          id: const Uuid().v4(),
          invoiceId: invoiceId,
          paymentMethod: paymentMethod,
          amountPaisa: grandTotalPaisa,
          status: const Value('completed'),
          createdAt: Value(now),
        ),
      );

      // 4b. If Khata credit sale, atomically update customer outstanding balance (Rule 13)
      if (paymentMethod.toLowerCase() == 'khata' && customerId != null) {
        final existingCust = await (_db.select(_db.localCustomers)
              ..where((c) => c.id.equals(customerId)))
            .getSingleOrNull();
        if (existingCust != null) {
          final updatedBal = existingCust.currentBalancePaisa + grandTotalPaisa;
          await (_db.update(_db.localCustomers)
                ..where((c) => c.id.equals(customerId)))
              .write(
            LocalCustomersCompanion(
              currentBalancePaisa: Value(updatedBal),
              updatedAt: Value(now),
            ),
          );
        }
      }

      // 5. Insert SyncOutbox operation for background synchronizer
      final outboxOpId = const Uuid().v4();
      await _db.into(_db.syncOutbox).insert(
        SyncOutboxCompanion.insert(
          operationId: outboxOpId,
          deviceId: resolvedDeviceId,
          sequence: _outboxSequence++,
          operationType: 'CREATE_SALE',
          schemaVersion: const Value(1),
          payload: jsonEncode(syncPayload),
          status: const Value('pending'),
          retryCount: const Value(0),
          createdAt: Value(now),
        ),
      );
    });

    final baseResult = OfflineSaleResult(
      invoiceId: invoiceId,
      invoiceNumber: invoiceNumber,
      paymentMethod: paymentMethod,
      totalPaisa: grandTotalPaisa,
      receiptText: receiptBuffer.toString(),
      createdAt: now,
    );

    final receiptDoc = ReceiptDocument.fromOfflineSale(
      sale: baseResult,
      items: items,
      customerName: customerName,
    );

    return OfflineSaleResult(
      invoiceId: invoiceId,
      invoiceNumber: invoiceNumber,
      paymentMethod: paymentMethod,
      totalPaisa: grandTotalPaisa,
      receiptText: receiptBuffer.toString(),
      createdAt: now,
      receiptDocument: receiptDoc,
    );
  }

  /// Construct a ReceiptDocument from local SQLite records for reprint
  Future<ReceiptDocument?> getReceiptDocument(String invoiceId) async {
    final invoice = await (_db.select(_db.localInvoices)
          ..where((i) => i.id.equals(invoiceId)))
        .getSingleOrNull();
    if (invoice == null) return null;

    final lines = await (_db.select(_db.localInvoiceLines)
          ..where((l) => l.invoiceId.equals(invoiceId)))
        .get();

    final lineItems = lines.map((l) {
      return ReceiptLineItem(
        name: l.productName,
        hsnCode: l.hsnCode,
        quantity: l.quantity.toInt(),
        unit: 'PKT',
        unitPricePaisa: l.unitPricePaisa,
        discountPaisa: 0,
        taxRatePercent: l.gstRatePercent.round(),
        taxPaisa: l.taxPaisa,
        totalPaisa: l.totalPaisa,
      );
    }).toList();

    // Group taxes by rate
    final Map<int, List<LocalInvoiceLine>> byRate = {};
    for (final l in lines) {
      byRate.putIfAbsent(l.gstRatePercent.round(), () => []).add(l);
    }

    final taxSlabs = <ReceiptTaxSlab>[];
    int totalCgst = 0;
    int totalSgst = 0;
    for (final entry in byRate.entries) {
      final rate = entry.key;
      final rateLines = entry.value;
      final slabTaxable = rateLines.fold(0, (sum, l) => sum + (l.unitPricePaisa * l.quantity.toInt()));
      final slabTax = rateLines.fold(0, (sum, l) => sum + l.taxPaisa);
      final cgst = slabTax ~/ 2;
      final sgst = slabTax - cgst;
      totalCgst += cgst;
      totalSgst += sgst;

      taxSlabs.add(ReceiptTaxSlab(
        taxRatePercent: rate,
        taxableValuePaisa: slabTaxable,
        cgstPaisa: cgst,
        sgstPaisa: sgst,
        totalTaxPaisa: slabTax,
      ),);
    }

    return ReceiptDocument(
      header: const ReceiptHeader(),
      meta: ReceiptInvoiceMeta(
        invoiceNumber: invoice.invoiceNumber,
        invoiceId: invoice.id,
        date: invoice.createdAt,
        paymentMethod: invoice.paymentMethod,
        customerName: invoice.customerName,
        isReprint: true,
      ),
      lines: lineItems,
      taxSlabs: taxSlabs,
      totals: ReceiptTotals(
        subtotalPaisa: invoice.subtotalPaisa,
        cgstTotalPaisa: totalCgst,
        sgstTotalPaisa: totalSgst,
        grandTotalPaisa: invoice.grandTotalPaisa,
      ),
    );
  }

  /// Retrieve all invoices stored locally, optionally filtered by tenant
  Future<List<LocalInvoice>> getAllInvoices({String? tenantId}) {
    final query = _db.select(_db.localInvoices);
    if (tenantId != null && tenantId.isNotEmpty) {
      query.where((i) => i.tenantId.equals(tenantId));
    }
    return (query..orderBy([(i) => OrderingTerm.desc(i.createdAt)])).get();
  }

  /// Reactive stream of local invoices, optionally filtered by tenant
  Stream<List<LocalInvoice>> watchAllInvoices({String? tenantId}) {
    final query = _db.select(_db.localInvoices);
    if (tenantId != null && tenantId.isNotEmpty) {
      query.where((i) => i.tenantId.equals(tenantId));
    }
    return (query..orderBy([(i) => OrderingTerm.desc(i.createdAt)])).watch();
  }

  /// Retrieve all lines for an invoice
  Future<List<LocalInvoiceLine>> getInvoiceLines(String invoiceId) {
    return (_db.select(_db.localInvoiceLines)
          ..where((l) => l.invoiceId.equals(invoiceId)))
        .get();
  }

  /// Retrieve all pending operations in the sync outbox
  Future<List<SyncOutboxData>> getPendingOutbox() {
    return (_db.select(_db.syncOutbox)
          ..where((o) => o.status.equals('pending'))
          ..orderBy([(o) => OrderingTerm.asc(o.sequence)]))
        .get();
  }

  /// Mark an outbox operation as successfully accepted by the server
  Future<void> markOutboxAccepted(String operationId, String serverEntityId) {
    return (_db.update(_db.syncOutbox)
          ..where((o) => o.operationId.equals(operationId)))
        .write(
      SyncOutboxCompanion(
        status: const Value('accepted'),
        serverEntityId: Value(serverEntityId),
      ),
    );
  }

  /// Mark an outbox operation as rejected by server
  Future<void> markOutboxRejected(String operationId, String error) {
    return (_db.update(_db.syncOutbox)
          ..where((o) => o.operationId.equals(operationId)))
        .write(
      SyncOutboxCompanion(
        status: const Value('rejected'),
        lastError: Value(error),
      ),
    );
  }

  /// Compute live daily performance metrics for today from local SQLite tables
  Future<Map<String, dynamic>> getTodayMetrics() async {
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final tomorrowStart = todayStart.add(const Duration(days: 1));

    final todayInvoices = await (_db.select(_db.localInvoices)
          ..where((i) =>
              i.createdAt.isBiggerOrEqualValue(todayStart) &
              i.createdAt.isSmallerThanValue(tomorrowStart)))
        .get();

    final billCount = todayInvoices.length;
    final grossSalesPaisa = todayInvoices.fold<int>(0, (sum, i) => sum + i.grandTotalPaisa);

    int cashPaisa = 0;
    int upiPaisa = 0;
    int khataPaisa = 0;

    for (final inv in todayInvoices) {
      final method = inv.paymentMethod.toLowerCase();
      if (method == 'cash') {
        cashPaisa += inv.grandTotalPaisa;
      } else if (method == 'upi' || method == 'card') {
        upiPaisa += inv.grandTotalPaisa;
      } else if (method == 'khata') {
        khataPaisa += inv.grandTotalPaisa;
      }
    }

    final allCustomers = await (_db.select(_db.localCustomers)).get();
    final totalKhataDuePaisa = allCustomers.fold<int>(0, (sum, c) => sum + c.currentBalancePaisa);

    final lowStockRows = await (_db.select(_db.localProducts)
          ..where((p) => p.stockQuantity.isSmallerOrEqualValue(5.0)))
        .get();

    return {
      'billCount': billCount,
      'grossSalesPaisa': grossSalesPaisa,
      'cashPaisa': cashPaisa,
      'upiPaisa': upiPaisa,
      'khataPaisa': khataPaisa,
      'totalKhataDuePaisa': totalKhataDuePaisa,
      'lowStockCount': lowStockRows.length,
    };
  }
}
