import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum StoreVerticalMode {
  retail,
  restaurant;

  String get label {
    switch (this) {
      case StoreVerticalMode.retail:
        return 'Kirana & Retail POS';
      case StoreVerticalMode.restaurant:
        return 'Restaurant & Cafe POS';
    }
  }
}

class StoreModeNotifier extends StateNotifier<StoreVerticalMode> {
  static const String _keyMode = 'pos_store_vertical_mode';

  StoreModeNotifier() : super(StoreVerticalMode.retail) {
    _load();
  }

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final modeStr = prefs.getString(_keyMode);
      if (modeStr == 'restaurant') {
        state = StoreVerticalMode.restaurant;
      } else {
        state = StoreVerticalMode.retail;
      }
    } catch (_) {}
  }

  Future<void> setMode(StoreVerticalMode mode) async {
    state = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyMode, mode == StoreVerticalMode.restaurant ? 'restaurant' : 'retail');
  }

  void toggleMode() {
    final next = state == StoreVerticalMode.retail ? StoreVerticalMode.restaurant : StoreVerticalMode.retail;
    setMode(next);
  }
}

final storeModeProvider = StateNotifierProvider<StoreModeNotifier, StoreVerticalMode>((ref) {
  return StoreModeNotifier();
});

