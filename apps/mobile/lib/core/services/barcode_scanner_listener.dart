import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Handler for hardware HID keyboard-wedge barcode scanners (USB OTG / Bluetooth).
/// Captures rapid keystroke bursts terminated by Enter/Tab and fires onBarcodeScanned.
class BarcodeScannerController {
  final void Function(String barcode) onBarcodeScanned;
  final Duration maxInterKeystrokeInterval;
  final Duration debounceDuration;
  final int minBarcodeLength;

  final StringBuffer _buffer = StringBuffer();
  DateTime? _lastKeystrokeTime;
  String? _lastScannedBarcode;
  DateTime? _lastScanCompletedTime;

  BarcodeScannerController({
    required this.onBarcodeScanned,
    this.maxInterKeystrokeInterval = const Duration(milliseconds: 100),
    this.debounceDuration = const Duration(milliseconds: 400),
    this.minBarcodeLength = 3,
  });

  /// Process an incoming hardware key event.
  /// Returns true if the key event was consumed by the scanner handler.
  bool handleKeyEvent(KeyEvent event) {
    if (event is! KeyDownEvent) {
      return false;
    }

    final now = DateTime.now();

    // Check if previous keystroke was too long ago (reset buffer if human slow typing)
    if (_lastKeystrokeTime != null &&
        now.difference(_lastKeystrokeTime!) > maxInterKeystrokeInterval) {
      _buffer.clear();
    }
    _lastKeystrokeTime = now;

    // Check for Enter or Tab termination
    if (event.logicalKey == LogicalKeyboardKey.enter ||
        event.logicalKey == LogicalKeyboardKey.numpadEnter ||
        event.logicalKey == LogicalKeyboardKey.tab) {
      final barcode = _buffer.toString().trim();
      _buffer.clear();

      if (barcode.length >= minBarcodeLength) {
        // Debounce duplicate scans
        if (_lastScannedBarcode == barcode &&
            _lastScanCompletedTime != null &&
            now.difference(_lastScanCompletedTime!) < debounceDuration) {
          return true; // Debounced
        }

        _lastScannedBarcode = barcode;
        _lastScanCompletedTime = now;
        onBarcodeScanned(barcode);
        return true;
      }
      return false;
    }

    // Capture alphanumeric and symbol characters
    final character = event.character;
    if (character != null && character.isNotEmpty && character.codeUnitAt(0) >= 32) {
      _buffer.write(character);
    }

    return false;
  }

  /// Manually dispatch a scanned barcode (e.g. from camera scanner, manual input, or test)
  void dispatchBarcode(String barcode) {
    final trimmed = barcode.trim();
    if (trimmed.length < minBarcodeLength) return;

    final now = DateTime.now();
    if (_lastScannedBarcode == trimmed &&
        _lastScanCompletedTime != null &&
        now.difference(_lastScanCompletedTime!) < debounceDuration) {
      return;
    }

    _lastScannedBarcode = trimmed;
    _lastScanCompletedTime = now;
    onBarcodeScanned(trimmed);
  }

  void reset() {
    _buffer.clear();
    _lastKeystrokeTime = null;
    _lastScannedBarcode = null;
    _lastScanCompletedTime = null;
  }
}

/// Widget that wraps a view (such as MobilePosScreen) and listens for hardware
/// barcode scans globally across the application lifecycle.
class HardwareBarcodeScannerListener extends StatefulWidget {
  final Widget child;
  final void Function(String barcode) onBarcodeScanned;
  final bool enabled;

  const HardwareBarcodeScannerListener({
    super.key,
    required this.child,
    required this.onBarcodeScanned,
    this.enabled = true,
  });

  @override
  State<HardwareBarcodeScannerListener> createState() =>
      _HardwareBarcodeScannerListenerState();
}

class _HardwareBarcodeScannerListenerState
    extends State<HardwareBarcodeScannerListener> {
  late final BarcodeScannerController _controller;

  @override
  void initState() {
    super.initState();
    _controller = BarcodeScannerController(
      onBarcodeScanned: (barcode) {
        if (widget.enabled && mounted) {
          widget.onBarcodeScanned(barcode);
        }
      },
    );
    HardwareKeyboard.instance.addHandler(_handleKeyEvent);
  }

  @override
  void dispose() {
    HardwareKeyboard.instance.removeHandler(_handleKeyEvent);
    super.dispose();
  }

  bool _handleKeyEvent(KeyEvent event) {
    if (!widget.enabled) return false;
    return _controller.handleKeyEvent(event);
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}

