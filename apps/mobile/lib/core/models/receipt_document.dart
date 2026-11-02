import 'cart_item.dart';
import '../services/offline_billing_service.dart';

class ReceiptHeader {
  final String storeName;
  final String address;
  final String? phone;
  final String? gstin;
  final String? fssai;
  final String? tagline;

  const ReceiptHeader({
    this.storeName = 'KIRANA SUPERMART',
    this.address = 'Shop 4, Andheri West, Mumbai',
    this.phone = '+91 98765 43210',
    this.gstin = '27AABCU9603R1ZM',
    this.fssai,
    this.tagline = 'Powering Indian Retail MSMEs',
  });
}

class ReceiptInvoiceMeta {
  final String invoiceNumber;
  final String? invoiceId;
  final DateTime date;
  final String cashierName;
  final String paymentMethod;
  final String? customerName;
  final String? customerPhone;
  final bool isReprint;

  const ReceiptInvoiceMeta({
    required this.invoiceNumber,
    this.invoiceId,
    required this.date,
    this.cashierName = 'Counter 1',
    required this.paymentMethod,
    this.customerName,
    this.customerPhone,
    this.isReprint = false,
  });
}

class ReceiptLineItem {
  final String name;
  final String? hsnCode;
  final int quantity;
  final String unit;
  final int unitPricePaisa;
  final int discountPaisa;
  final int taxRatePercent;
  final int taxPaisa;
  final int totalPaisa;

  const ReceiptLineItem({
    required this.name,
    this.hsnCode,
    required this.quantity,
    this.unit = 'PKT',
    required this.unitPricePaisa,
    this.discountPaisa = 0,
    required this.taxRatePercent,
    required this.taxPaisa,
    required this.totalPaisa,
  });

  double get unitPriceRupees => unitPricePaisa / 100.0;
  double get discountRupees => discountPaisa / 100.0;
  double get taxRupees => taxPaisa / 100.0;
  double get totalRupees => totalPaisa / 100.0;
}

class ReceiptTaxSlab {
  final int taxRatePercent;
  final int taxableValuePaisa;
  final int cgstPaisa;
  final int sgstPaisa;
  final int totalTaxPaisa;

  const ReceiptTaxSlab({
    required this.taxRatePercent,
    required this.taxableValuePaisa,
    required this.cgstPaisa,
    required this.sgstPaisa,
    required this.totalTaxPaisa,
  });

  double get taxableRupees => taxableValuePaisa / 100.0;
  double get cgstRupees => cgstPaisa / 100.0;
  double get sgstRupees => sgstPaisa / 100.0;
  double get totalTaxRupees => totalTaxPaisa / 100.0;
}

class ReceiptTotals {
  final int subtotalPaisa;
  final int discountTotalPaisa;
  final int cgstTotalPaisa;
  final int sgstTotalPaisa;
  final int roundingAdjustmentPaisa;
  final int grandTotalPaisa;

  const ReceiptTotals({
    required this.subtotalPaisa,
    this.discountTotalPaisa = 0,
    required this.cgstTotalPaisa,
    required this.sgstTotalPaisa,
    this.roundingAdjustmentPaisa = 0,
    required this.grandTotalPaisa,
  });

  int get totalTaxPaisa => cgstTotalPaisa + sgstTotalPaisa;
  double get subtotalRupees => subtotalPaisa / 100.0;
  double get discountTotalRupees => discountTotalPaisa / 100.0;
  double get cgstTotalRupees => cgstTotalPaisa / 100.0;
  double get sgstTotalRupees => sgstTotalPaisa / 100.0;
  double get totalTaxRupees => totalTaxPaisa / 100.0;
  double get grandTotalRupees => grandTotalPaisa / 100.0;
  double get roundingRupees => roundingAdjustmentPaisa / 100.0;
}

class ReceiptDocument {
  final ReceiptHeader header;
  final ReceiptInvoiceMeta meta;
  final List<ReceiptLineItem> lines;
  final List<ReceiptTaxSlab> taxSlabs;
  final ReceiptTotals totals;
  final List<String> footerNotes;
  final String? upiQrPayload;

  const ReceiptDocument({
    required this.header,
    required this.meta,
    required this.lines,
    required this.taxSlabs,
    required this.totals,
    this.footerNotes = const [
      'Thank You! Visit Again!',
      'Goods once sold cannot be returned after 7 days.',
      'Powering Indian Retail MSMEs',
    ],
    this.upiQrPayload,
  });

  /// Factory helper to build a full ReceiptDocument from an offline sale and cart items
  factory ReceiptDocument.fromOfflineSale({
    required OfflineSaleResult sale,
    required List<CartItem> items,
    ReceiptHeader header = const ReceiptHeader(),
    String cashierName = 'Cashier 1',
    String? customerName,
    String? customerPhone,
    bool isReprint = false,
    String upiVpa = 'kirana@upi',
  }) {
    final lineItems = items.map((item) {
      return ReceiptLineItem(
        name: item.product.name,
        hsnCode: item.product.hsnCode,
        quantity: item.quantity,
        unit: item.product.unit,
        unitPricePaisa: item.product.sellingPricePaisa,
        taxRatePercent: item.product.gstRate,
        taxPaisa: item.taxPaisa,
        totalPaisa: item.totalPaisa,
      );
    }).toList();

    // Group taxes by GST slab
    final Map<int, List<CartItem>> itemsByRate = {};
    for (final item in items) {
      itemsByRate.putIfAbsent(item.product.gstRate, () => []).add(item);
    }

    final taxSlabs = <ReceiptTaxSlab>[];
    int totalCgstPaisa = 0;
    int totalSgstPaisa = 0;

    for (final entry in itemsByRate.entries) {
      final rate = entry.key;
      final rateItems = entry.value;
      final slabTaxable = rateItems.fold(0, (sum, i) => sum + i.subtotalPaisa);
      final slabTotalTax = rateItems.fold(0, (sum, i) => sum + i.taxPaisa);
      // For intra-state supply, CGST = 50%, SGST = 50%
      final cgst = slabTotalTax ~/ 2;
      final sgst = slabTotalTax - cgst;

      totalCgstPaisa += cgst;
      totalSgstPaisa += sgst;

      taxSlabs.add(
        ReceiptTaxSlab(
          taxRatePercent: rate,
          taxableValuePaisa: slabTaxable,
          cgstPaisa: cgst,
          sgstPaisa: sgst,
          totalTaxPaisa: slabTotalTax,
        ),
      );
    }

    final subtotalPaisa = items.fold(0, (sum, i) => sum + i.subtotalPaisa);
    final grandTotalPaisa = sale.totalPaisa;

    // Generate UPI dynamic QR payload if applicable
    final upiPayload = 'upi://pay?pa=$upiVpa'
        '&pn=${Uri.encodeComponent(header.storeName)}'
        '&am=${sale.totalRupees.toStringAsFixed(2)}'
        '&tr=${sale.invoiceNumber}'
        '&tn=Bill%20${sale.invoiceNumber}';

    return ReceiptDocument(
      header: header,
      meta: ReceiptInvoiceMeta(
        invoiceNumber: sale.invoiceNumber,
        invoiceId: sale.invoiceId,
        date: sale.createdAt,
        cashierName: cashierName,
        paymentMethod: sale.paymentMethod,
        customerName: customerName,
        customerPhone: customerPhone,
        isReprint: isReprint,
      ),
      lines: lineItems,
      taxSlabs: taxSlabs,
      totals: ReceiptTotals(
        subtotalPaisa: subtotalPaisa,
        cgstTotalPaisa: totalCgstPaisa,
        sgstTotalPaisa: totalSgstPaisa,
        grandTotalPaisa: grandTotalPaisa,
      ),
      upiQrPayload: upiPayload,
    );
  }

  ReceiptDocument copyWithReprint() {
    return ReceiptDocument(
      header: header,
      meta: ReceiptInvoiceMeta(
        invoiceNumber: meta.invoiceNumber,
        invoiceId: meta.invoiceId,
        date: meta.date,
        cashierName: meta.cashierName,
        paymentMethod: meta.paymentMethod,
        customerName: meta.customerName,
        customerPhone: meta.customerPhone,
        isReprint: true,
      ),
      lines: lines,
      taxSlabs: taxSlabs,
      totals: totals,
      footerNotes: footerNotes,
      upiQrPayload: upiQrPayload,
    );
  }
}
