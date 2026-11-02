import 'dart:convert';
import 'dart:typed_data';
import '../models/receipt_document.dart';

enum PaperWidth {
  mm58(32),
  mm80(48);

  final int columns;
  const PaperWidth(this.columns);
}

class EscPosBuilder {
  final PaperWidth paperWidth;
  final BytesBuilder _bytes = BytesBuilder();
  final StringBuffer _textPreview = StringBuffer();

  EscPosBuilder({this.paperWidth = PaperWidth.mm58});

  int get columns => paperWidth.columns;

  /// Raw byte buffer of generated ESC/POS commands
  Uint8List toBytes() => _bytes.toBytes();

  /// Human-readable text preview of the receipt (for UI preview & debugging)
  String toTextPreview() => _textPreview.toString();

  // ---------------------------------------------------------------------------
  // Low-level ESC/POS primitives
  // ---------------------------------------------------------------------------

  void initialize() {
    _bytes.add([0x1B, 0x40]); // ESC @
  }

  void alignLeft() {
    _bytes.add([0x1B, 0x61, 0x00]); // ESC a 0
  }

  void alignCenter() {
    _bytes.add([0x1B, 0x61, 0x01]); // ESC a 1
  }

  void alignRight() {
    _bytes.add([0x1B, 0x61, 0x02]); // ESC a 2
  }

  void setBold(bool bold) {
    _bytes.add([0x1B, 0x45, bold ? 0x01 : 0x00]); // ESC E n
  }

  void setUnderline(bool underline) {
    _bytes.add([0x1B, 0x2D, underline ? 0x01 : 0x00]); // ESC - n
  }

  void setTextSize({bool doubleHeight = false, bool doubleWidth = false}) {
    int n = 0;
    if (doubleHeight) n |= 0x01;
    if (doubleWidth) n |= 0x10;
    _bytes.add([0x1D, 0x21, n]); // GS ! n
  }

  void feedLines(int count) {
    _bytes.add([0x1B, 0x64, count]); // ESC d n
    for (int i = 0; i < count; i++) {
      _textPreview.writeln();
    }
  }

  void cut({bool partial = true}) {
    // GS V m n: partial cut (66) with 0 feed units
    _bytes.add([0x1D, 0x56, partial ? 0x42 : 0x41, 0x00]);
    _textPreview.writeln('[--- PAPER CUT ---]');
  }

  void kickDrawer({int pin = 2}) {
    // ESC p m t1 t2 (pulse drawer)
    // pin 2: m = 0, t1 = 25 (50ms on), t2 = 250 (500ms off)
    // pin 5: m = 1
    _bytes.add([0x1B, 0x70, pin == 5 ? 0x01 : 0x00, 0x19, 0xFA]);
    _textPreview.writeln('[--- CASH DRAWER OPENED ---]');
  }

  // ---------------------------------------------------------------------------
  // Text & Formatting Helpers
  // ---------------------------------------------------------------------------

  void rawLine(String text) {
    final encoded = latin1.encode(text);
    _bytes.add(encoded);
    _bytes.add([0x0A]); // Line Feed
    _textPreview.writeln(text);
  }

  void textCentered(String text, {bool bold = false, bool doubleSize = false}) {
    alignCenter();
    if (bold) setBold(true);
    if (doubleSize) setTextSize(doubleHeight: true, doubleWidth: true);

    final maxLen = doubleSize ? (columns ~/ 2) : columns;
    if (text.length > maxLen) {
      final words = text.split(' ');
      String currentLine = '';
      for (final word in words) {
        if (currentLine.isEmpty) {
          currentLine = word;
        } else if (currentLine.length + 1 + word.length <= maxLen) {
          currentLine += ' $word';
        } else {
          rawLine(currentLine);
          currentLine = word;
        }
      }
      if (currentLine.isNotEmpty) {
        rawLine(currentLine);
      }
    } else {
      rawLine(text);
    }

    if (doubleSize) setTextSize(doubleHeight: false, doubleWidth: false);
    if (bold) setBold(false);
    alignLeft();
  }

  void divider({String char = '-'}) {
    final div = char * columns;
    rawLine(div);
  }

  void row2(String left, String right, {bool bold = false}) {
    alignLeft();
    if (bold) setBold(true);

    final availableSpaces = columns - left.length - right.length;
    if (availableSpaces < 1) {
      // If combined text overflows the line, print left then right on next line
      rawLine(left);
      final pad = ' ' * (columns - right.length);
      rawLine('$pad$right');
    } else {
      final line = left + (' ' * availableSpaces) + right;
      rawLine(line);
    }

    if (bold) setBold(false);
  }

  // ---------------------------------------------------------------------------
  // UPI QR Code Generator
  // ---------------------------------------------------------------------------

  void addQrCode(String data, {int size = 5}) {
    alignCenter();
    final dataBytes = utf8.encode(data);
    final length = dataBytes.length + 3;
    final pL = length & 0xFF;
    final pH = (length >> 8) & 0xFF;

    // 1. Model 2
    _bytes.add([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);

    // 2. Module size (1 to 16, default 5)
    _bytes.add([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size]);

    // 3. Error correction level (49 = Level M, 15%)
    _bytes.add([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]);

    // 4. Store symbol data
    _bytes.add([0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]);
    _bytes.add(dataBytes);

    // 5. Print symbol
    _bytes.add([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);

    _textPreview.writeln('[--- DYNAMIC UPI QR CODE ---]');
    _textPreview.writeln(data);
    alignLeft();
  }

  // ---------------------------------------------------------------------------
  // High-Level Semantic Receipt Renderer
  // ---------------------------------------------------------------------------

  void buildReceipt(ReceiptDocument doc, {bool openCashDrawer = false}) {
    initialize();

    // 1. Optional Cash Drawer Kick
    if (openCashDrawer) {
      kickDrawer();
    }

    // 2. Duplicate / Reprint Banner (Rule 14 & Rule 10)
    if (doc.meta.isReprint) {
      divider(char: '=');
      textCentered('*** DUPLICATE COPY / REPRINT ***', bold: true);
      divider(char: '=');
    } else {
      divider(char: '=');
    }

    // 3. Header Section
    textCentered(doc.header.storeName, bold: true, doubleSize: true);
    if (doc.header.address.isNotEmpty) {
      textCentered(doc.header.address);
    }
    if (doc.header.phone != null) {
      textCentered('Tel: ${doc.header.phone!}');
    }
    if (doc.header.gstin != null) {
      textCentered('GSTIN: ${doc.header.gstin!}', bold: true);
    }
    if (doc.header.fssai != null) {
      textCentered('FSSAI: ${doc.header.fssai!}');
    }
    divider(char: '-');

    // 4. Invoice Metadata
    row2('Bill No: ${doc.meta.invoiceNumber}', 'Cashier: ${doc.meta.cashierName}');
    final d = doc.meta.date;
    final dateStr = '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year} '
        '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    row2('Date: $dateStr', 'Tender: ${doc.meta.paymentMethod.toUpperCase()}');

    if (doc.meta.customerName != null && doc.meta.customerName!.isNotEmpty) {
      final cust = doc.meta.customerPhone != null
          ? '${doc.meta.customerName} (${doc.meta.customerPhone})'
          : doc.meta.customerName!;
      row2('Khata/Cust:', cust);
    }
    divider(char: '-');

    // 5. Line Items Table
    if (paperWidth == PaperWidth.mm58) {
      // 58mm layout: 32 columns
      // Col 1: Item (13) | Qty (4) | Rate (7) | Total (8)
      rawLine('Item          Qty   Rate   Total');
      divider(char: '-');

      for (final item in doc.lines) {
        final qtyStr = item.quantity.toString().padRight(4);
        final rateStr = item.unitPriceRupees.toStringAsFixed(1).padLeft(6);
        final totalStr = item.totalRupees.toStringAsFixed(1).padLeft(7);

        if (item.name.length > 13) {
          // Print item name on first line, then values on next line
          rawLine(item.name);
          final pad = ' ' * 13;
          rawLine('$pad $qtyStr$rateStr$totalStr');
        } else {
          final nameStr = item.name.padRight(13);
          rawLine('$nameStr $qtyStr$rateStr$totalStr');
        }
      }
    } else {
      // 80mm layout: 48 columns
      // Item Name (20) | Qty (4) | Rate (8) | GST% (5) | Total (7)
      rawLine('Item Name            Qty     Rate  GST%   Total');
      divider(char: '-');

      for (final item in doc.lines) {
        final qtyStr = item.quantity.toString().padRight(4);
        final rateStr = item.unitPriceRupees.toStringAsFixed(2).padLeft(8);
        final gstStr = '${item.taxRatePercent}%'.padLeft(5);
        final totalStr = item.totalRupees.toStringAsFixed(2).padLeft(7);

        if (item.name.length > 20) {
          rawLine(item.name);
          final pad = ' ' * 20;
          rawLine('$pad $qtyStr $rateStr $gstStr $totalStr');
        } else {
          final nameStr = item.name.padRight(20);
          rawLine('$nameStr $qtyStr $rateStr $gstStr $totalStr');
        }
      }
    }
    divider(char: '-');

    // 6. Totals Section
    row2('Subtotal:', 'Rs. ${doc.totals.subtotalRupees.toStringAsFixed(2)}');
    if (doc.totals.discountTotalPaisa > 0) {
      row2('Discount:', '-Rs. ${doc.totals.discountTotalRupees.toStringAsFixed(2)}');
    }
    row2('CGST:', 'Rs. ${doc.totals.cgstTotalRupees.toStringAsFixed(2)}');
    row2('SGST:', 'Rs. ${doc.totals.sgstTotalRupees.toStringAsFixed(2)}');
    if (doc.totals.roundingAdjustmentPaisa != 0) {
      row2('Rounding:', 'Rs. ${doc.totals.roundingRupees.toStringAsFixed(2)}');
    }
    divider(char: '=');
    row2(
      'GRAND TOTAL:',
      'Rs. ${doc.totals.grandTotalRupees.toStringAsFixed(2)}',
      bold: true,
    );
    divider(char: '=');

    // 7. GST Slab Tax Summary Table
    if (doc.taxSlabs.isNotEmpty) {
      alignCenter();
      setBold(true);
      rawLine('--- GST TAX SUMMARY ---');
      setBold(false);
      alignLeft();

      if (paperWidth == PaperWidth.mm58) {
        rawLine('GST%   Taxable   CGST   SGST');
        for (final slab in doc.taxSlabs) {
          final rate = '${slab.taxRatePercent}%'.padRight(6);
          final taxable = slab.taxableRupees.toStringAsFixed(0).padLeft(8);
          final cgst = slab.cgstRupees.toStringAsFixed(1).padLeft(7);
          final sgst = slab.sgstRupees.toStringAsFixed(1).padLeft(7);
          rawLine('$rate$taxable$cgst$sgst');
        }
      } else {
        rawLine('GST Slab   Taxable Value   CGST Tax   SGST Tax');
        for (final slab in doc.taxSlabs) {
          final rate = 'GST ${slab.taxRatePercent}%'.padRight(10);
          final taxable = 'Rs. ${slab.taxableRupees.toStringAsFixed(2)}'.padLeft(14);
          final cgst = 'Rs. ${slab.cgstRupees.toStringAsFixed(2)}'.padLeft(10);
          final sgst = 'Rs. ${slab.sgstRupees.toStringAsFixed(2)}'.padLeft(10);
          rawLine('$rate$taxable$cgst$sgst');
        }
      }
      divider(char: '-');
    }

    // 8. Dynamic UPI QR Code (if configured)
    if (doc.upiQrPayload != null && doc.upiQrPayload!.isNotEmpty) {
      addQrCode(doc.upiQrPayload!);
      textCentered('Scan & Pay via any UPI App');
      textCentered('(GPay, PhonePe, Paytm, BHIM)');
      divider(char: '-');
    }

    // 9. Footers
    for (final note in doc.footerNotes) {
      textCentered(note);
    }
    if (doc.header.tagline != null) {
      textCentered(doc.header.tagline!);
    }
    divider(char: '=');

    // Feed lines & cut
    feedLines(3);
    cut(partial: true);
  }
}
