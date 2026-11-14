import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/repositories/auth_repository.dart';
import 'package:pos_mobile/core/repositories/sync_repository.dart';
import 'package:pos_mobile/core/services/sync_worker.dart';

class RealHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback = (cert, host, port) => true;
  }
}

void main() {
  setUpAll(() {
    HttpOverrides.global = RealHttpOverrides();
  });

  test('Reverse Sync: Create Product on Cloud Backend -> Pull Delta to Mobile SQLite', () async {
    final credFile = File(r'C:\Users\Ramanuj Dey Sarkar\.gemini\antigravity\brain\cd2fd5f9-7e12-4a88-bf69-18633b2aafaa\scratch\live-test-data.json');
    expect(credFile.existsSync(), isTrue);
    final testData = jsonDecode(await credFile.readAsString()) as Map<String, dynamic>;

    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    final db = AppDatabase.inMemory();
    final dio = Dio();
    final authRepo = AuthRepository(dio: dio, prefs: prefs, baseUrl: 'https://pos.assistt.in');
    final syncRepo = SyncRepository(dio: dio, authRepo: authRepo, baseUrl: 'https://pos.assistt.in');
    final syncWorker = SyncWorker(db: db, syncRepo: syncRepo, prefs: prefs);

    print('STEP 1: Logging in as registered merchant...');
    final loggedInUser = await authRepo.login(testData['email'] as String, testData['password'] as String);
    expect(loggedInUser, isNotNull);
    final tenantId = testData['tenantId'] as String;
    final token = await authRepo.getAccessToken();

    print('STEP 2: Creating a new product on the Cloud Backend API (Tata Salt 1kg)...');
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final reverseSku = 'SALT-TATA-$timestamp';
    final reverseBarcode = '8901${timestamp % 100000000}';
    Response prodResponse;
    try {
      prodResponse = await dio.post(
        'https://pos.assistt.in/api/v1/tenants/$tenantId/catalog/products',
        data: {
          'name': 'Tata Salt Vacuum Evaporated 1kg',
          'sku': reverseSku,
          'barcodePrimary': reverseBarcode,
          'sellingPrice': '28.00',
          'purchaseCost': '24.00',
          'mrp': '30.00',
          'gstRatePercent': '0.00',
          'hsnCode': '2501',
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
        ),
      );
    } on DioException catch (e) {
      print('Product create error response: ${e.response?.data}');
      rethrow;
    }
    expect(prodResponse.statusCode, anyOf([200, 201]));
    print('Product created on Cloud Backend: ${prodResponse.data['id']}');

    print('STEP 3: Triggering SyncWorker.syncNow on mobile app...');
    final syncResult = await syncWorker.synchronize(tenantId: tenantId, deviceId: 'mobile-pos-reverse-01');
    print('Sync cycle completed: Pulled ${syncResult.pulledProductsCount} products, success: ${syncResult.isSuccess}');
    expect(syncResult.pulledProductsCount, greaterThanOrEqualTo(1));

    print('STEP 4: Querying local SQLite database to verify pulled product...');
    final localProducts = await (db.select(db.localProducts)..where((p) => p.sku.equals(reverseSku))).get();
    expect(localProducts.length, equals(1));
    final pulledItem = localProducts.first;
    print('VERIFIED in local SQLite: ${pulledItem.name} | SKU: ${pulledItem.sku} | Barcode: ${pulledItem.barcode} | Price: ₹${(pulledItem.sellingPricePaisa / 100).toStringAsFixed(2)}');
    expect(pulledItem.name, equals('Tata Salt Vacuum Evaporated 1kg'));
    expect(pulledItem.sellingPricePaisa, equals(2800)); // ₹28.00 in paisa
    expect(pulledItem.barcode, equals(reverseBarcode));

    await db.close();
  });
}
