import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/receipt_document.dart';
import '../services/escpos_builder.dart';
import '../services/printer_service.dart';

class PrinterState {
  final PrinterStatus status;
  final String activeTransportName;
  final PaperWidth paperWidth;
  final PrintResult? lastResult;
  final String? lastError;
  final bool isDrawerSupported;

  const PrinterState({
    required this.status,
    required this.activeTransportName,
    this.paperWidth = PaperWidth.mm58,
    this.lastResult,
    this.lastError,
    this.isDrawerSupported = true,
  });

  bool get isReady => status == PrinterStatus.connected;
  bool get isPrinting => status == PrinterStatus.printing;
  bool get hasError => status == PrinterStatus.error;

  PrinterState copyWith({
    PrinterStatus? status,
    String? activeTransportName,
    PaperWidth? paperWidth,
    PrintResult? lastResult,
    String? lastError,
    bool? isDrawerSupported,
  }) {
    return PrinterState(
      status: status ?? this.status,
      activeTransportName: activeTransportName ?? this.activeTransportName,
      paperWidth: paperWidth ?? this.paperWidth,
      lastResult: lastResult ?? this.lastResult,
      lastError: lastError ?? this.lastError,
      isDrawerSupported: isDrawerSupported ?? this.isDrawerSupported,
    );
  }
}

class PrinterNotifier extends StateNotifier<PrinterState> {
  final PrinterService _service;

  static const String _keyType = 'pos_printer_type';
  static const String _keyAddress = 'pos_printer_address';
  static const String _keyName = 'pos_printer_name';
  static const String _keyWidth = 'pos_printer_width';

  PrinterNotifier(this._service)
      : super(
          PrinterState(
            status: _service.status,
            activeTransportName: _service.transport.name,
            paperWidth: _service.paperWidth,
          ),
        ) {
    loadSavedPrinter();
  }

  PrinterService get service => _service;

  Future<void> loadSavedPrinter() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final type = prefs.getString(_keyType);
      final address = prefs.getString(_keyAddress);
      final name = prefs.getString(_keyName);
      final width = prefs.getInt(_keyWidth);

      if (width == 80) {
        _service.setPaperWidth(PaperWidth.mm80);
        state = state.copyWith(paperWidth: PaperWidth.mm80);
      }

      if (type == 'bluetooth' && address != null && address.isNotEmpty) {
        final transport = BluetoothPrinterTransport(address: address, name: name);
        _service.setTransport(transport);
        state = state.copyWith(
          activeTransportName: transport.name,
          status: _service.status,
        );
        await reconnect();
      } else if (type == 'network' && address != null && address.isNotEmpty) {
        final parts = address.split(':');
        final host = parts[0];
        final port = parts.length > 1 ? (int.tryParse(parts[1]) ?? 9100) : 9100;
        final transport = NetworkPrinterTransport(host: host, port: port);
        _service.setTransport(transport);
        state = state.copyWith(
          activeTransportName: transport.name,
          status: _service.status,
        );
        await reconnect();
      }
    } catch (_) {}
  }

  void setPaperWidth(PaperWidth width) {
    _service.setPaperWidth(width);
    state = state.copyWith(paperWidth: width);
    SharedPreferences.getInstance().then((prefs) {
      prefs.setInt(_keyWidth, width == PaperWidth.mm80 ? 80 : 58);
    }).catchError((_) {});
  }

  void setTransport(PrinterTransport transport) {
    _service.setTransport(transport);
    state = state.copyWith(
      activeTransportName: transport.name,
      status: _service.status,
    );

    SharedPreferences.getInstance().then((prefs) {
      if (transport is BluetoothPrinterTransport) {
        prefs.setString(_keyType, 'bluetooth');
        prefs.setString(_keyAddress, transport.address);
        prefs.setString(_keyName, transport.name);
      } else if (transport is NetworkPrinterTransport) {
        prefs.setString(_keyType, 'network');
        prefs.setString(_keyAddress, '${transport.host}:${transport.port}');
        prefs.setString(_keyName, transport.name);
      }
    }).catchError((_) {});
  }

  Future<bool> reconnect() async {
    state = state.copyWith(status: PrinterStatus.connecting);
    final ok = await _service.connect();
    state = state.copyWith(
      status: _service.status,
      lastError: _service.lastError,
    );
    return ok;
  }

  Future<PrintResult> printReceipt(
    ReceiptDocument doc, {
    bool openCashDrawer = false,
  }) async {
    state = state.copyWith(status: PrinterStatus.printing);
    final result = await _service.printReceipt(doc, openCashDrawer: openCashDrawer);
    state = state.copyWith(
      status: _service.status,
      lastResult: result,
      lastError: _service.lastError,
    );
    return result;
  }

  Future<PrintResult> reprintReceipt(ReceiptDocument doc) async {
    state = state.copyWith(status: PrinterStatus.printing);
    final result = await _service.reprintReceipt(doc);
    state = state.copyWith(
      status: _service.status,
      lastResult: result,
      lastError: _service.lastError,
    );
    return result;
  }

  Future<PrintResult> printTestPage() async {
    state = state.copyWith(status: PrinterStatus.printing);
    final result = await _service.printTestPage();
    state = state.copyWith(
      status: _service.status,
      lastResult: result,
      lastError: _service.lastError,
    );
    return result;
  }

  Future<bool> kickCashDrawer() async {
    return _service.kickCashDrawer();
  }
}

final printerServiceProvider = Provider<PrinterService>((ref) {
  return PrinterService();
});

final printerProvider = StateNotifierProvider<PrinterNotifier, PrinterState>((ref) {
  final service = ref.watch(printerServiceProvider);
  return PrinterNotifier(service);
});
