import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

class AppConfig {
  /// Default server URL pointing to the hosted production server gateway.
  static const String defaultServerUrl = String.fromEnvironment(
    'SERVER_URL',
    defaultValue: 'https://pos.assistt.in',
  );

  static const String _keyServerUrl = 'custom_server_url';
  static const String _keyDeviceId = 'installed_device_uuid';

  /// Retrieve the persistent RFC4122 v4 UUID for this terminal installation.
  static Future<String> getDeviceId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      var id = prefs.getString(_keyDeviceId);
      if (id == null || id.trim().isEmpty) {
        id = const Uuid().v4();
        await prefs.setString(_keyDeviceId, id);
      }
      return id;
    } catch (_) {
      return '11111111-1111-4111-8111-111111111111';
    }
  }

  /// Retrieve the active server URL (custom stored URL or default hosted endpoint).
  static Future<String> getServerUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_keyServerUrl);
      if (saved != null && saved.trim().isNotEmpty) {
        return saved.trim();
      }
    } catch (_) {
      // Fallback cleanly to default if storage is unavailable
    }
    return defaultServerUrl;
  }

  /// Store a custom server URL for branch network or custom domain routing.
  static Future<void> setServerUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyServerUrl, url.trim());
  }

  /// Reset the server URL back to the default hosted production setup.
  static Future<void> resetServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyServerUrl);
  }
}
