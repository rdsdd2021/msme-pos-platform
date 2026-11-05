import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum HardwarePermission {
  bluetooth,
  camera,
  storage,
}

class PermissionStatusState {
  final bool bluetooth;
  final bool camera;
  final bool storage;

  const PermissionStatusState({
    this.bluetooth = false,
    this.camera = false,
    this.storage = false,
  });

  PermissionStatusState copyWith({
    bool? bluetooth,
    bool? camera,
    bool? storage,
  }) {
    return PermissionStatusState(
      bluetooth: bluetooth ?? this.bluetooth,
      camera: camera ?? this.camera,
      storage: storage ?? this.storage,
    );
  }
}

class PermissionService extends StateNotifier<PermissionStatusState> {
  static const _channel = MethodChannel('in.assistt.pos/hardware');

  PermissionService() : super(const PermissionStatusState()) {
    checkAllPermissions();
  }

  Future<void> checkAllPermissions() async {
    final bt = await checkPermission(HardwarePermission.bluetooth);
    final cam = await checkPermission(HardwarePermission.camera);
    final stor = await checkPermission(HardwarePermission.storage);
    state = PermissionStatusState(
      bluetooth: bt,
      camera: cam,
      storage: stor,
    );
  }

  Future<bool> checkPermission(HardwarePermission permission) async {
    try {
      final granted = await _channel.invokeMethod<bool>('checkPermission', {
        'permission': permission.name,
      });
      return granted ?? false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> requestPermission(HardwarePermission permission) async {
    try {
      final granted = await _channel.invokeMethod<bool>('requestPermission', {
        'permission': permission.name,
      });
      final isGranted = granted ?? false;
      switch (permission) {
        case HardwarePermission.bluetooth:
          state = state.copyWith(bluetooth: isGranted);
          break;
        case HardwarePermission.camera:
          state = state.copyWith(camera: isGranted);
          break;
        case HardwarePermission.storage:
          state = state.copyWith(storage: isGranted);
          break;
      }
      return isGranted;
    } catch (_) {
      return false;
    }
  }

  Future<void> setScreenWakeLock(bool enabled) async {
    try {
      await _channel.invokeMethod('setScreenWakeLock', {'enabled': enabled});
    } catch (_) {}
  }

  Future<void> triggerHaptic({String type = 'light'}) async {
    try {
      await _channel.invokeMethod('triggerHaptic', {'type': type});
    } catch (_) {
      // Fallback to Flutter default haptics
      if (type == 'success') {
        await HapticFeedback.mediumImpact();
      } else if (type == 'error') {
        await HapticFeedback.heavyImpact();
      } else {
        await HapticFeedback.selectionClick();
      }
    }
  }
}

final permissionServiceProvider = StateNotifierProvider<PermissionService, PermissionStatusState>((ref) {
  return PermissionService();
});

