import 'package:uuid/uuid.dart';
import '../models/cart_item.dart';

class OfflineSaleResult {
  final String invoiceId;
  final String invoiceNumber;
  final String paymentMethod;
  final int totalPaisa;
  final String receiptText;
  final DateTime createdAt;

  const OfflineSaleResult({
    required this.invoiceId,
    required this.invoiceNumber,
    required this.paymentMethod,
    required this.totalPaisa,
    required this.receiptText,
    required this.createdAt,
  });

  double get totalRupees => totalPaisa / 100.0;
}

class OfflineBillingService {
  static int _invoiceSequence = 1001;

  /// Process and persist an offline sale atomically.
  /// Generates invoice, lines, payment, and formatted ESC/POS receipt text.
  static Future<OfflineSaleResult> processSale({
    required List<CartItem> items,
    required String paymentMethod,
    String? customerName,
  }) async {
    // Simulate SQLite transactional local write
    await Future.delayed(const Duration(milliseconds: 150));

    final invoiceId = const Uuid().v4();
    final invoiceNumber = 'INV-${DateTime.now().year}-$_invoiceSequence';
    _invoiceSequence++;

    final now = DateTime.now();
    final grandTotalPaisa = items.fold(0, (sum, i) => sum + i.totalPaisa);
    final totalTaxPaisa = items.fold(0, (sum, i) => sum + i.taxPaisa);

    // Build 58mm / 80mm ESC/POS compatible thermal receipt text
    final buffer = StringBuffer();
    buffer.writeln('================================');
    buffer.writeln('      KIRANA SUPERMART');
    buffer.writeln('  Shop 4, Andheri West, Mumbai');
    buffer.writeln('    GSTIN: 27AABCU9603R1ZM');
    buffer.writeln('--------------------------------');
    buffer.writeln('Invoice: $invoiceNumber');
    buffer.writeln('Date:    ${now.day}/${now.month}/${now.year} ${now.hour}:${now.minute.toString().padLeft(2, '0')}');
    if (customerName != null) {
      buffer.writeln('Khata:   $customerName');
    }
    buffer.writeln('Tender:  ${paymentMethod.toUpperCase()}');
    buffer.writeln('--------------------------------');
    buffer.writeln('Item          Qty   Rate   Total');
    buffer.writeln('--------------------------------');

    for (final item in items) {
      final name = item.product.name.length > 13
          ? item.product.name.substring(0, 13)
          : item.product.name.padRight(13);
      final qty = item.quantity.toString().padRight(4);
      final rate = (item.product.sellingPricePaisa / 100).toStringAsFixed(1).padLeft(6);
      final total = (item.totalPaisa / 100).toStringAsFixed(1).padLeft(7);
      buffer.writeln('$name $qty$rate$total');
    }

    buffer.writeln('--------------------------------');
    buffer.writeln('Subtotal:             Rs. ${(grandTotalPaisa - totalTaxPaisa) / 100.0}');
    buffer.writeln('GST (CGST+SGST):      Rs. ${(totalTaxPaisa) / 100.0}');
    buffer.writeln('GRAND TOTAL:          Rs. ${(grandTotalPaisa) / 100.0}');
    buffer.writeln('================================');
    buffer.writeln('   Thank You! Visit Again!');
    buffer.writeln('  Powering Indian Retail MSMEs');
    buffer.writeln('================================');

    return OfflineSaleResult(
      invoiceId: invoiceId,
      invoiceNumber: invoiceNumber,
      paymentMethod: paymentMethod,
      totalPaisa: grandTotalPaisa,
      receiptText: buffer.toString(),
      createdAt: now,
    );
  }
}

