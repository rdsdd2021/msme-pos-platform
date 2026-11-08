import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/repositories/auth_repository.dart';
import 'package:pos_mobile/core/repositories/local_catalog_repository.dart';
import 'package:pos_mobile/core/repositories/local_billing_repository.dart';
import 'package:pos_mobile/core/repositories/sync_repository.dart';
import 'package:pos_mobile/core/models/cart_item.dart';

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

  test('Live Mobile App E2E: Register Merchant -> Add Product -> Complete Sale -> Sync to Central Cloud', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    final db = AppDatabase.inMemory();
    final dio = Dio();
    final authRepo = AuthRepository(dio: dio, prefs: prefs, baseUrl: 'https://pos.assistt.in');
    final catalogRepo = LocalCatalogRepository(db);
    final billingRepo = LocalBillingRepository(db);
    final syncRepo = SyncRepository(dio: dio, authRepo: authRepo, baseUrl: 'https://pos.assistt.in');

    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final email = 'live_kirana_$timestamp@kirana.dev';
    final storeName = 'Live Kirana $timestamp';
    final fullName = 'Ramanuj Mobile Tester';
    final password = 'Password@123';

    print('STEP 1: Registering new merchant from mobile app...');
    final regUser = await authRepo.registerMerchant(
      storeName: storeName,
      fullName: fullName,
      email: email,
      password: password,
      businessType: 'grocery',
      stateCode: '27',
    );
    expect(regUser, isNotNull);
    print('Merchant registered: ${regUser.id}');

    print('STEP 2: Logging in to establish active session and token on mobile...');
    final loggedInUser = await authRepo.login(email, password);
    expect(loggedInUser, isNotNull);
    final membership = loggedInUser!.memberships.first;
    final tenantId = membership.tenantId;
    final branchId = membership.branchId;
    print('Active Tenant: $tenantId, Branch: $branchId');

    print('STEP 3: Creating an item from the mobile app (Fortune Sunlite Oil 1L)...');
    final product = await catalogRepo.createProduct(
      name: 'Fortune Sunlite Oil 1L',
      sku: 'OIL-FORTUNE-$timestamp',
      barcode: '8901000${timestamp % 100000}',
      category: 'Groceries',
      sellingPricePaisa: 16500, // ₹165.00
      purchaseCostPaisa: 14000, // ₹140.00
      mrpPaisa: 17500, // ₹175.00
      gstRate: 5.0,
      hsnCode: '1512',
      unit: 'LTR',
      initialStock: 30.0,
      tenantId: tenantId,
      deviceId: 'mobile-pos-live-01',
    );
    expect(product.id, isNotEmpty);
    print('Product created locally in SQLite: ${product.name} (ID: ${product.id})');

    print('STEP 4: Completing an order from mobile app (Qty: 2, Cash: ₹330.00)...');
    final cartItem = CartItem(
      product: product,
      quantity: 2,
    );
    final sale = await billingRepo.createSaleAtomic(
      items: [cartItem],
      paymentMethod: 'cash',
      tenantId: tenantId,
      branchId: branchId ?? 'branch-1',
      deviceId: 'mobile-pos-live-01',
    );
    expect(sale.invoiceNumber, isNotEmpty);
    print('Sale completed: Invoice ${sale.invoiceNumber}, Grand Total: ₹${sale.totalRupees}');

    print('STEP 5: Pushing outbox mutations from mobile app to central cloud...');
    final pendingOps = await (db.select(db.syncOutbox)..where((o) => o.status.equals('pending'))).get();
    print('Found ${pendingOps.length} pending operations in local SQLite outbox');

    final pushResult = await syncRepo.pushBatch(
      tenantId,
      'mobile-pos-live-01',
      pendingOps,
    );
    print('Sync Push Processed Count: ${pushResult.processedCount}');
    expect(pushResult.processedCount, equals(pendingOps.length));

    // Save test outputs to scratch file for Playwright web verification
    final credFile = File(r'C:\Users\Ramanuj Dey Sarkar\.gemini\antigravity\brain\cd2fd5f9-7e12-4a88-bf69-18633b2aafaa\scratch\live-test-data.json');
    final testData = {
      'email': email,
      'password': password,
      'storeName': storeName,
      'tenantId': tenantId,
      'branchId': branchId,
      'productName': 'Fortune Sunlite Oil 1L',
      'productSku': 'OIL-FORTUNE-$timestamp',
      'sellingPrice': '165.00',
      'expectedStock': '28',
      'invoiceNumber': sale.invoiceNumber,
      'grandTotal': '330.00',
    };
    await credFile.writeAsString(jsonEncode(testData));
    print('SUCCESS: Saved live test metadata to scratch/live-test-data.json');
    await db.close();
  });
}
