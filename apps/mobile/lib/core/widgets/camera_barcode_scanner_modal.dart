import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../services/permission_service.dart';
import '../theme/shadcn_colors.dart';
import 'shadcn_button.dart';
import 'shadcn_input.dart';

/// Modal bottom sheet or full-screen dialog for scanning barcodes and SKUs using the device camera.
class CameraBarcodeScannerModal extends ConsumerStatefulWidget {
  final String title;
  final String promptText;
  final ValueChanged<String> onBarcodeScanned;
  final bool isTestMode;

  const CameraBarcodeScannerModal({
    super.key,
    this.title = 'Scan Barcode',
    this.promptText = 'Align barcode or QR code within frame',
    required this.onBarcodeScanned,
    this.isTestMode = false,
  });

  /// Static helper to display scanner as a full bottom sheet
  static Future<String?> show(
    BuildContext context, {
    String title = 'Scan Barcode',
    String promptText = 'Align barcode or QR code within frame',
    bool isTestMode = false,
  }) async {
    String? result;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CameraBarcodeScannerModal(
        title: title,
        promptText: promptText,
        isTestMode: isTestMode,
        onBarcodeScanned: (code) {
          result = code;
          Navigator.of(ctx).pop();
        },
      ),
    );
    return result;
  }

  @override
  ConsumerState<CameraBarcodeScannerModal> createState() => _CameraBarcodeScannerModalState();
}

class _CameraBarcodeScannerModalState extends ConsumerState<CameraBarcodeScannerModal>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  MobileScannerController? _scannerController;
  late AnimationController _laserAnimController;
  late Animation<double> _laserAnimation;

  bool _isTorchOn = false;
  bool _isFrontCamera = false;
  bool _hasScanned = false;
  bool _showManualInput = false;
  bool _isStartingCamera = false;
  MobileScannerException? _scannerError;
  final TextEditingController _manualTextController = TextEditingController();

  bool get _isTestingEnvironment =>
      widget.isTestMode || !kIsWeb && Platform.environment.containsKey('FLUTTER_TEST');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    _laserAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );

    _laserAnimation = Tween<double>(begin: 0.08, end: 0.92).animate(
      CurvedAnimation(parent: _laserAnimController, curve: Curves.easeInOut),
    );

    if (!_isTestingEnvironment) {
      _laserAnimController.repeat(reverse: true);
      _initScanner();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _checkAndStartCamera();
      });
    }
  }

  void _initScanner() {
    _scannerController?.dispose();
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      facing: CameraFacing.back,
      torchEnabled: false,
      autoStart: false,
    );
  }

  Future<void> _checkAndStartCamera() async {
    if (_isTestingEnvironment || !mounted || _isStartingCamera) return;

    setState(() => _isStartingCamera = true);

    try {
      final permissions = ref.read(permissionServiceProvider);
      bool hasPermission = permissions.camera;

      if (!hasPermission) {
        hasPermission = await ref
            .read(permissionServiceProvider.notifier)
            .requestPermission(HardwarePermission.camera);
      }

      if (hasPermission && mounted) {
        try {
          await _scannerController?.stop();
        } catch (_) {}
        await _scannerController?.start();
      }
    } catch (e) {
      debugPrint('Camera startup exception: $e');
    } finally {
      if (mounted) {
        setState(() => _isStartingCamera = false);
      }
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    if (_isTestingEnvironment || _scannerController == null) return;

    if (state == AppLifecycleState.resumed) {
      final isGranted = ref.read(permissionServiceProvider).camera;
      if (isGranted) {
        _scannerController?.start();
      }
    } else if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      _scannerController?.stop();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _laserAnimController.dispose();
    _scannerController?.dispose();
    _manualTextController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_hasScanned) return;

    for (final barcode in capture.barcodes) {
      final code = barcode.rawValue?.trim();
      if (code != null && code.isNotEmpty) {
        _hasScanned = true;
        // Trigger cashier haptic confirmation
        ref.read(permissionServiceProvider.notifier).triggerHaptic(type: 'success');
        widget.onBarcodeScanned(code);
        break;
      }
    }
  }

  void _submitManualCode() {
    final code = _manualTextController.text.trim();
    if (code.isNotEmpty) {
      _hasScanned = true;
      ref.read(permissionServiceProvider.notifier).triggerHaptic(type: 'light');
      widget.onBarcodeScanned(code);
    }
  }

  @override
  Widget build(BuildContext context) {
    final permissions = ref.watch(permissionServiceProvider);
    final isCameraGranted = permissions.camera || _isTestingEnvironment;

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: const BoxDecoration(
        color: Color(0xFF09090B), // Zinc 950 deep contrast
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            // Handle Bar
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 10, bottom: 8),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header Toolbar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  const Icon(Icons.qr_code_scanner, color: ShadcnColors.primary, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      widget.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ),
                  if (!_isTestingEnvironment && isCameraGranted && !_showManualInput) ...[
                    // Torch Toggle
                    IconButton(
                      icon: Icon(
                        _isTorchOn ? Icons.flash_on : Icons.flash_off,
                        color: _isTorchOn ? Colors.amberAccent : Colors.white70,
                        size: 20,
                      ),
                      tooltip: 'Toggle Flashlight',
                      onPressed: () async {
                        await _scannerController?.toggleTorch();
                        setState(() => _isTorchOn = !_isTorchOn);
                      },
                    ),
                    // Camera Switch
                    IconButton(
                      icon: const Icon(Icons.flip_camera_android, color: Colors.white70, size: 20),
                      tooltip: 'Switch Camera',
                      onPressed: () async {
                        await _scannerController?.switchCamera();
                        setState(() => _isFrontCamera = !_isFrontCamera);
                      },
                    ),
                  ],
                  // Close Button
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white70, size: 22),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            const Divider(color: Colors.white12, height: 1),

            // Main Body: Camera Viewfinder or Fallback
            Expanded(
              child: _showManualInput
                  ? _buildManualInputView()
                  : (!isCameraGranted
                      ? _buildPermissionDeniedView()
                      : _buildCameraViewfinder()),
            ),

            // Bottom Action Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: ShadcnButton(
                      text: _showManualInput ? 'Switch to Camera Viewfinder' : 'Enter Barcode Manually',
                      variant: ShadcnButtonVariant.secondary,
                      leadingIcon: Icon(_showManualInput ? Icons.camera_alt_outlined : Icons.keyboard_outlined, size: 16),
                      onPressed: () {
                        setState(() {
                          _showManualInput = !_showManualInput;
                        });
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Live Camera Viewfinder Overlay
  Widget _buildCameraViewfinder() {
    if (_isTestingEnvironment) {
      return _buildTestViewfinder();
    }

    if (_scannerError != null) {
      return _buildErrorView(_scannerError);
    }

    return Stack(
      alignment: Alignment.center,
      children: [
        // Camera Stream
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: MobileScanner(
            controller: _scannerController,
            onDetect: _onDetect,
            errorBuilder: (ctx, err, child) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (_scannerError == null && mounted) {
                  setState(() => _scannerError = err);
                }
              });
              return _buildErrorView(err);
            },
          ),
        ),

        // Reticle and overlay only shown when there is no error
        if (_scannerError == null) ...[
          // Dark Vignette Backdrop Cutout
          ColorFiltered(
            colorFilter: ColorFilter.mode(
              Colors.black.withOpacity(0.55),
              BlendMode.srcOut,
            ),
            child: Stack(
              fit: StackFit.expand,
              children: [
                Container(
                  decoration: const BoxDecoration(
                    color: Colors.black,
                    backgroundBlendMode: BlendMode.dstOut,
                  ),
                ),
                Center(
                  child: Container(
                    width: 250,
                    height: 250,
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Scanning Reticle & Corner Brackets
          Center(
            child: SizedBox(
              width: 250,
              height: 250,
              child: Stack(
                children: [
                  // Corner Reticle Decorator
                  CustomPaint(
                    size: const Size(250, 250),
                    painter: _ScannerReticlePainter(),
                  ),

                  // Animated Laser Scanline
                  AnimatedBuilder(
                    animation: _laserAnimation,
                    builder: (ctx, child) {
                      return Positioned(
                        top: 250 * _laserAnimation.value,
                        left: 12,
                        right: 12,
                        child: Container(
                          height: 2.5,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [
                                Colors.transparent,
                                ShadcnColors.primary,
                                Colors.white,
                                ShadcnColors.primary,
                                Colors.transparent,
                              ],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: ShadcnColors.primary.withOpacity(0.7),
                                blurRadius: 8,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),

          // Helper instruction text
          Positioned(
            bottom: 30,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white12),
              ),
              child: Text(
                widget.promptText,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildErrorView(MobileScannerException? err) {
    final isPermissionError = err?.errorCode == MobileScannerErrorCode.permissionDenied;
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
      child: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  color: isPermissionError
                      ? Colors.amber.withOpacity(0.15)
                      : Colors.redAccent.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isPermissionError ? Icons.camera_alt_outlined : Icons.videocam_off_outlined,
                  color: isPermissionError ? Colors.amberAccent : Colors.redAccent,
                  size: 34,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                isPermissionError ? 'Camera Permission Needed' : 'Camera Unavailable',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                isPermissionError
                    ? 'Allow camera access to scan barcodes and QR codes instantly at the checkout counter.'
                    : 'The camera could not be accessed (${err?.errorCode.name ?? 'genericError'}). Check that no other app is using the camera, then restart.',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12.5,
                  height: 1.35,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.refresh, size: 18, color: Colors.white),
                  label: Text(
                    isPermissionError ? 'Grant Permission & Retry' : 'Restart Camera',
                    style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ShadcnColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () async {
                    setState(() => _scannerError = null);
                    _initScanner();
                    await _checkAndStartCamera();
                  },
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.keyboard_outlined, size: 18, color: Colors.white70),
                  label: const Text(
                    'Enter Barcode Manually',
                    style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w500, color: Colors.white),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.white24),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () => setState(() => _showManualInput = true),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Headless / Test-safe Viewfinder for Automated Widget Tests
  Widget _buildTestViewfinder() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.qr_code_scanner, color: ShadcnColors.primary, size: 64),
            const SizedBox(height: 12),
            const Text(
              'Simulated Camera Viewfinder (Test Mode)',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Inject scan or type barcode below for tests',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ActionChip(
                  key: const Key('test_scan_chip_parle_g'),
                  label: const Text('Parle-G 800g'),
                  onPressed: () {
                    widget.onBarcodeScanned('890103000005');
                  },
                ),
                ActionChip(
                  key: const Key('test_scan_chip_atta'),
                  label: const Text('Aashirvaad Atta 5kg'),
                  onPressed: () {
                    widget.onBarcodeScanned('890103000001');
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _manualTextController,
                    decoration: const InputDecoration(
                      hintText: 'Enter barcode',
                      isDense: true,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: _submitManualCode,
                  child: const Text('Add to Cart'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Manual Text Input Screen View
  Widget _buildManualInputView() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Type Barcode or SKU',
            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 6),
          const Text(
            'Enter the numbers from the item packaging or SKU tag:',
            style: TextStyle(color: Colors.white70, fontSize: 13),
          ),
          const SizedBox(height: 16),
          ShadcnInput(
            key: const Key('manual_barcode_input_field'),
            controller: _manualTextController,
            autofocus: true,
            placeholder: 'e.g. 890103000005 or GROC-001',
            prefixIcon: const Icon(Icons.qr_code, size: 18, color: ShadcnColors.mutedForeground),
            onEditingComplete: _submitManualCode,
          ),
          const SizedBox(height: 16),
          ShadcnButton(
            key: const Key('submit_manual_barcode_btn'),
            text: 'Submit Barcode',
            leadingIcon: const Icon(Icons.check, size: 16),
            variant: ShadcnButtonVariant.primary,
            onPressed: _submitManualCode,
          ),
        ],
      ),
    );
  }

  /// Permission Denied Alert State
  Widget _buildPermissionDeniedView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.camera_alt_outlined, color: Colors.redAccent, size: 40),
            ),
            const SizedBox(height: 16),
            const Text(
              'Camera Permission Required',
              style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            const Text(
              'Camera access is required to scan retail barcodes and SKUs directly off product packaging.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 20),
            ShadcnButton(
              text: 'Grant Camera Permission',
              leadingIcon: const Icon(Icons.security, size: 16),
              variant: ShadcnButtonVariant.primary,
              onPressed: () async {
                final granted = await ref
                    .read(permissionServiceProvider.notifier)
                    .requestPermission(HardwarePermission.camera);
                if (granted) {
                  _initScanner();
                  await _checkAndStartCamera();
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

/// Custom Painter for 4-Corner Targeting Brackets
class _ScannerReticlePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const cornerLength = 26.0;
    const strokeWidth = 3.5;
    final paint = Paint()
      ..color = ShadcnColors.primary
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    // Top-Left
    canvas.drawLine(const Offset(0, 0), const Offset(cornerLength, 0), paint);
    canvas.drawLine(const Offset(0, 0), const Offset(0, cornerLength), paint);

    // Top-Right
    canvas.drawLine(Offset(size.width, 0), Offset(size.width - cornerLength, 0), paint);
    canvas.drawLine(Offset(size.width, 0), Offset(size.width, cornerLength), paint);

    // Bottom-Left
    canvas.drawLine(Offset(0, size.height), Offset(cornerLength, size.height), paint);
    canvas.drawLine(Offset(0, size.height), Offset(0, size.height - cornerLength), paint);

    // Bottom-Right
    canvas.drawLine(Offset(size.width, size.height), Offset(size.width - cornerLength, size.height), paint);
    canvas.drawLine(Offset(size.width, size.height), Offset(size.width, size.height - cornerLength), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
