import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'escpos_builder.dart';
import '../models/receipt_document.dart';

enum PrinterStatus {
  disconnected,
  connecting,
  connected,
  printing,
  error;

  String get label {
    switch (this) {
      case PrinterStatus.disconnected:
        return 'Disconnected';
      case PrinterStatus.connecting:
        return 'Connecting...';
      case PrinterStatus.connected:
        return 'Ready';
      case PrinterStatus.printing:
        return 'Printing...';
      case PrinterStatus.error:
        return 'Error';
    }
  }
}

class PrintResult {
  final bool success;
  final String? invoiceNumber;
  final String? errorMessage;
  final int bytesSent;
  final DateTime timestamp;
  final String? textPreview;

  const PrintResult({
    required this.success,
    this.invoiceNumber,
    this.errorMessage,
    this.bytesSent = 0,
    required this.timestamp,
    this.textPreview,
  });

  factory PrintResult.ok({
    required String invoiceNumber,
    required int bytesSent,
    String? textPreview,
  }) {
    return PrintResult(
      success: true,
      invoiceNumber: invoiceNumber,
      bytesSent: bytesSent,
      timestamp: DateTime.now(),
      textPreview: textPreview,
    );
  }

  factory PrintResult.failure({
    required String errorMessage,
    String? invoiceNumber,
  }) {
    return PrintResult(
      success: false,
      invoiceNumber: invoiceNumber,
      errorMessage: errorMessage,
      bytesSent: 0,
      timestamp: DateTime.now(),
    );
  }
}

abstract class PrinterTransport {
  String get id;
  String get name;
  bool get isConnected;

  Future<bool> connect();
  Future<void> sendBytes(List<int> bytes);
  Future<void> disconnect();
}

/// Simulated in-memory thermal printer transport for offline Kirana POS testing and verification
class MockPrinterTransport implements PrinterTransport {
  @override
  final String id;
  @override
  final String name;

  bool _connected = false;
  bool simulatePaperOut = false;
  bool simulateConnectionFailure = false;
  int simulateDelayMs = 0;

  final List<Uint8List> printedByteJobs = [];
  final List<String> printedTextJobs = [];

  MockPrinterTransport({
    this.id = 'mock-thermal-01',
    this.name = 'Simulated 58mm Bluetooth Printer',
    bool startConnected = true,
  }) : _connected = startConnected;

  @override
  bool get isConnected => _connected;

  @override
  Future<bool> connect() async {
    if (simulateConnectionFailure) {
      _connected = false;
      return false;
    }
    if (simulateDelayMs > 0) {
      await Future.delayed(Duration(milliseconds: simulateDelayMs));
    }
    _connected = true;
    return true;
  }

  @override
  Future<void> sendBytes(List<int> bytes) async {
    if (!_connected) {
      throw const SocketException('Printer is disconnected');
    }
    if (simulatePaperOut) {
      throw Exception('Printer error: Paper roll out / cover open');
    }
    if (simulateDelayMs > 0) {
      await Future.delayed(Duration(milliseconds: simulateDelayMs));
    }

    final data = Uint8List.fromList(bytes);
    printedByteJobs.add(data);
  }

  @override
  Future<void> disconnect() async {
    _connected = false;
  }

  void clearHistory() {
    printedByteJobs.clear();
    printedTextJobs.clear();
  }
}

/// Network ESC/POS TCP Socket transport (default port 9100)
class NetworkPrinterTransport implements PrinterTransport {
  @override
  final String id;
  @override
  final String name;

  final String host;
  final int port;
  final Duration timeout;

  Socket? _socket;

  NetworkPrinterTransport({
    required this.host,
    this.port = 9100,
    this.timeout = const Duration(seconds: 4),
  })  : id = 'net-$host:$port',
        name = 'LAN Printer ($host:$port)';

  @override
  bool get isConnected => _socket != null;

  @override
  Future<bool> connect() async {
    try {
      _socket = await Socket.connect(host, port, timeout: timeout);
      return true;
    } catch (_) {
      _socket = null;
      return false;
    }
  }

  @override
  Future<void> sendBytes(List<int> bytes) async {
    if (_socket == null) {
      final ok = await connect();
      if (!ok || _socket == null) {
        throw SocketException('Failed to connect to network printer at $host:$port');
      }
    }
    _socket!.add(bytes);
    await _socket!.flush();
  }

  @override
  Future<void> disconnect() async {
    await _socket?.close();
    _socket?.destroy();
    _socket = null;
  }
}

class BluetoothDeviceItem {
  final String name;
  final String address;

  const BluetoothDeviceItem({required this.name, required this.address});
}

/// Real Android Bluetooth ESC/POS SPP Transport (RFCOMM UUID 00001101-0000-1000-8000-00805F9B34FB)
class BluetoothPrinterTransport implements PrinterTransport {
  static const MethodChannel _channel = MethodChannel('in.assistt.pos/bluetooth_printer');

  @override
  final String id;
  @override
  final String name;
  final String address;

  bool _connected = false;

  BluetoothPrinterTransport({
    required this.address,
    String? name,
  })  : id = 'bt-$address',
        name = name ?? 'Bluetooth Printer ($address)';

  @override
  bool get isConnected => _connected;

  @override
  Future<bool> connect() async {
    try {
      final ok = await _channel.invokeMethod<bool>('connect', {'address': address});
      _connected = ok ?? false;
      return _connected;
    } catch (_) {
      _connected = false;
      return false;
    }
  }

  @override
  Future<void> sendBytes(List<int> bytes) async {
    if (!_connected) {
      final ok = await connect();
      if (!ok) {
        throw const SocketException('Bluetooth printer disconnected');
      }
    }
    await _channel.invokeMethod('sendBytes', {'bytes': Uint8List.fromList(bytes)});
  }

  @override
  Future<void> disconnect() async {
    try {
      await _channel.invokeMethod('disconnect');
    } catch (_) {}
    _connected = false;
  }

  /// Query bonded/paired Bluetooth thermal printers from Android OS
  static Future<List<BluetoothDeviceItem>> getPairedDevices() async {
    try {
      final list = await _channel.invokeListMethod<dynamic>('getPairedDevices');
      if (list == null) return [];
      return list.map((item) {
        final map = Map<String, dynamic>.from(item as Map);
        return BluetoothDeviceItem(
          name: map['name']?.toString() ?? 'Thermal Printer',
          address: map['address']?.toString() ?? '',
        );
      }).toList();
    } catch (_) {
      return [];
    }
  }
}

/// Main Hardware Printer Service managing ESC/POS encoding, transport lifecycle,
/// print operations, and duplicate reprint handling.
///
/// Invariant: Rule 14 (Printer failure must never create or duplicate a sale).
class PrinterService {
  PrinterTransport _transport;
  PaperWidth _paperWidth;
  PrinterStatus _status = PrinterStatus.disconnected;
  String? _lastError;
  PrintResult? _lastPrintResult;

  PrinterService({
    PrinterTransport? transport,
    PaperWidth paperWidth = PaperWidth.mm58,
  })  : _transport = transport ?? MockPrinterTransport(),
        _paperWidth = paperWidth {
    if (_transport.isConnected) {
      _status = PrinterStatus.connected;
    }
  }

  PrinterStatus get status => _status;
  PrinterTransport get transport => _transport;
  PaperWidth get paperWidth => _paperWidth;
  String? get lastError => _lastError;
  PrintResult? get lastPrintResult => _lastPrintResult;

  void setPaperWidth(PaperWidth width) {
    _paperWidth = width;
  }

  void setTransport(PrinterTransport newTransport) {
    if (_transport != newTransport) {
      _transport.disconnect();
      _transport = newTransport;
      _status = _transport.isConnected ? PrinterStatus.connected : PrinterStatus.disconnected;
    }
  }

  Future<bool> connect() async {
    _status = PrinterStatus.connecting;
    _lastError = null;
    try {
      final success = await _transport.connect();
      _status = success ? PrinterStatus.connected : PrinterStatus.disconnected;
      if (!success) {
        _lastError = 'Could not establish connection to ${_transport.name}';
      }
      return success;
    } catch (e) {
      _status = PrinterStatus.error;
      _lastError = e.toString();
      return false;
    }
  }

  Future<void> disconnect() async {
    await _transport.disconnect();
    _status = PrinterStatus.disconnected;
  }

  /// Print a semantic receipt document.
  /// Post-commit operation: safe against printer disconnects / paper-out.
  Future<PrintResult> printReceipt(
    ReceiptDocument doc, {
    bool openCashDrawer = false,
  }) async {
    _status = PrinterStatus.printing;
    _lastError = null;

    final builder = EscPosBuilder(paperWidth: _paperWidth);
    builder.buildReceipt(doc, openCashDrawer: openCashDrawer);

    final bytes = builder.toBytes();
    final textPreview = builder.toTextPreview();

    try {
      if (!_transport.isConnected) {
        final connected = await _transport.connect();
        if (!connected) {
          throw Exception('Printer ${_transport.name} is offline or not reachable');
        }
      }

      await _transport.sendBytes(bytes);

      if (_transport is MockPrinterTransport) {
        (_transport as MockPrinterTransport).printedTextJobs.add(textPreview);
      }

      _status = PrinterStatus.connected;
      _lastPrintResult = PrintResult.ok(
        invoiceNumber: doc.meta.invoiceNumber,
        bytesSent: bytes.length,
        textPreview: textPreview,
      );
      return _lastPrintResult!;
    } catch (e) {
      _status = PrinterStatus.error;
      _lastError = e.toString();
      _lastPrintResult = PrintResult.failure(
        errorMessage: 'Print failed: ${e.toString()}',
        invoiceNumber: doc.meta.invoiceNumber,
      );
      return _lastPrintResult!;
    }
  }

  /// Reprint an existing invoice with clear [DUPLICATE COPY / REPRINT] watermark.
  /// Strictly references original invoice and does not touch sale ledger (Rule 14).
  Future<PrintResult> reprintReceipt(ReceiptDocument doc) async {
    final duplicateDoc = doc.copyWithReprint();
    return printReceipt(duplicateDoc, openCashDrawer: false);
  }

  /// Print a diagnostic test receipt verifying alignment, font, and cut
  Future<PrintResult> printTestPage() async {
    _status = PrinterStatus.printing;
    _lastError = null;

    final builder = EscPosBuilder(paperWidth: _paperWidth);
    builder.initialize();
    builder.divider(char: '=');
    builder.textCentered('KIRANA POS PRINTER TEST', bold: true);
    builder.divider(char: '-');
    builder.row2('Transport:', _transport.name);
    builder.row2('Paper Width:', '${_paperWidth.name} (${_paperWidth.columns} cols)');
    builder.row2('Date/Time:', DateTime.now().toIso8601String());
    builder.divider(char: '-');
    builder.textCentered('Text Styles Test:');
    builder.rawLine('Normal: ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    builder.setBold(true);
    builder.rawLine('Bold:   0123456789 (Bold Font)');
    builder.setBold(false);
    builder.divider(char: '=');
    builder.textCentered('ESC/POS HARDWARE READY!');
    builder.divider(char: '=');
    builder.feedLines(3);
    builder.cut(partial: true);

    final bytes = builder.toBytes();
    final textPreview = builder.toTextPreview();

    try {
      if (!_transport.isConnected) {
        final connected = await _transport.connect();
        if (!connected) {
          throw Exception('Printer ${_transport.name} is offline');
        }
      }

      await _transport.sendBytes(bytes);

      if (_transport is MockPrinterTransport) {
        (_transport as MockPrinterTransport).printedTextJobs.add(textPreview);
      }

      _status = PrinterStatus.connected;
      _lastPrintResult = PrintResult.ok(
        invoiceNumber: 'TEST-PAGE',
        bytesSent: bytes.length,
        textPreview: textPreview,
      );
      return _lastPrintResult!;
    } catch (e) {
      _status = PrinterStatus.error;
      _lastError = e.toString();
      _lastPrintResult = PrintResult.failure(
        errorMessage: 'Test print failed: ${e.toString()}',
        invoiceNumber: 'TEST-PAGE',
      );
      return _lastPrintResult!;
    }
  }

  /// Trigger cash drawer pulse on pin 2
  Future<bool> kickCashDrawer({int pin = 2}) async {
    final builder = EscPosBuilder();
    builder.kickDrawer(pin: pin);
    try {
      if (!_transport.isConnected) {
        await _transport.connect();
      }
      await _transport.sendBytes(builder.toBytes());
      return true;
    } catch (e) {
      _lastError = 'Failed to kick drawer: $e';
      return false;
    }
  }
}

