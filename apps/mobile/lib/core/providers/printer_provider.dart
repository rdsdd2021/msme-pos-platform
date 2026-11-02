import 'package:flutter_riverpod/flutter_riverpod.dart';
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

  PrinterNotifier(this._service)
      : super(
          PrinterState(
            status: _service.status,
            activeTransportName: _service.transport.name,
            paperWidth: _service.paperWidth,
          ),
        );

  PrinterService get service => _service;

  void setPaperWidth(PaperWidth width) {
    _service.setPaperWidth(width);
    state = state.copyWith(paperWidth: width);
  }

  void setTransport(PrinterTransport transport) {
    _service.setTransport(transport);
    state = state.copyWith(
      activeTransportName: transport.name,
      status: _service.status,
    );
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
