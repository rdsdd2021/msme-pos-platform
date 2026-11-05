import 'dart:io';
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
  final List<BluetoothDeviceItem> pairedDevices;
  final bool isScanning;

  const PrinterState({
    required this.status,
    required this.activeTransportName,
    this.paperWidth = PaperWidth.mm58,
    this.lastResult,
    this.lastError,
    this.isDrawerSupported = true,
    this.pairedDevices = const [],
    this.isScanning = false,
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
    List<BluetoothDeviceItem>? pairedDevices,
    bool? isScanning,
  }) {
    return PrinterState(
      status: status ?? this.status,
      activeTransportName: activeTransportName ?? this.activeTransportName,
      paperWidth: paperWidth ?? this.paperWidth,
      lastResult: lastResult ?? this.lastResult,
      lastError: lastError ?? this.lastError,
      isDrawerSupported: isDrawerSupported ?? this.isDrawerSupported,
      pairedDevices: pairedDevices ?? this.pairedDevices,
      isScanning: isScanning ?? this.isScanning,
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

  bool get _isTestEnv => Platform.environment.containsKey('FLUTTER_TEST');

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
      } else if (type == 'mock') {
        final transport = MockPrinterTransport(name: 'Demo Simulated Printer');
        _service.setTransport(transport);
        state = state.copyWith(
          activeTransportName: transport.name,
          status: _service.status,
        );
      } else if (!_isTestEnv && Platform.isAndroid) {
        // Cold boot on real Android device without saved config: Auto-detect bonded Bluetooth devices
        await scanPairedBluetoothDevices(autoConnectFirst: true);
      }
    } catch (_) {}
  }

  /// Scans bonded Bluetooth devices on Android and optionally auto-binds to the most likely printer
  Future<List<BluetoothDeviceItem>> scanPairedBluetoothDevices({bool autoConnectFirst = false}) async {
    state = state.copyWith(isScanning: true, lastError: null);
    try {
      // 1. Request Android runtime permissions
      final hasPerm = await BluetoothPrinterTransport.requestPermissions();
      if (!hasPerm && !_isTestEnv) {
        state = state.copyWith(
          isScanning: false,
          lastError: 'Bluetooth permission is required. Please grant permission in Phone Settings.',
        );
        return [];
      }

      // 2. Check if Bluetooth is enabled
      final isEnabled = await BluetoothPrinterTransport.isBluetoothEnabled();
      if (!isEnabled && !_isTestEnv) {
        state = state.copyWith(
          isScanning: false,
          lastError: 'Bluetooth is turned off. Please turn on Bluetooth in Android Settings.',
        );
        return [];
      }

      // 3. Scan bonded thermal printers
      final devices = await BluetoothPrinterTransport.getPairedDevices();
      state = state.copyWith(pairedDevices: devices, isScanning: false);

      if (devices.isNotEmpty && autoConnectFirst) {
        // Prefer devices with keywords indicating a thermal receipt printer
        final matched = devices.firstWhere(
          (d) {
            final n = d.name.toLowerCase();
            return n.contains('print') ||
                n.contains('pos') ||
                n.contains('rpp') ||
                n.contains('mpt') ||
                n.contains('bt') ||
                n.contains('thermal') ||
                n.contains('58') ||
                n.contains('80');
          },
          orElse: () => devices.first,
        );
        await connectToBluetoothDevice(matched);
      } else if (devices.isEmpty && !_isTestEnv) {
        final disconnected = DisconnectedPrinterTransport(name: 'No Bluetooth Printer Paired');
        _service.setTransport(disconnected);
        state = state.copyWith(
          activeTransportName: disconnected.name,
          status: PrinterStatus.disconnected,
          lastError: 'No paired Bluetooth printer found. Pair your printer in phone Bluetooth settings (PIN: 0000 or 1234), then tap Scan.',
        );
      }
      return devices;
    } catch (e) {
      state = state.copyWith(isScanning: false, lastError: e.toString());
      return [];
    }
  }

  /// Connects to a specific Bluetooth thermal printer and persists configuration
  Future<bool> connectToBluetoothDevice(BluetoothDeviceItem device) async {
    final transport = BluetoothPrinterTransport(address: device.address, name: device.name);
    setTransport(transport);
    final ok = await reconnect();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyType, 'bluetooth');
      await prefs.setString(_keyAddress, device.address);
      await prefs.setString(_keyName, device.name);
    } catch (_) {}
    return ok;
  }

  /// Explicitly enable demo simulation mode for testing or demonstration
  void enableDemoPrinter() {
    final mock = MockPrinterTransport(name: 'Simulated 58mm Virtual Printer');
    setTransport(mock);
    SharedPreferences.getInstance().then((prefs) {
      prefs.setString(_keyType, 'mock');
      prefs.setString(_keyName, mock.name);
    }).catchError((_) {});
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
