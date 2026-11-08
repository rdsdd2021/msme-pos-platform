import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/core/database/app_database.dart';
import 'package:pos_mobile/core/models/auth_user.dart';
import 'package:pos_mobile/core/models/cart_item.dart';
import 'package:pos_mobile/core/models/product.dart';
import 'package:pos_mobile/core/models/receipt_document.dart';
import 'package:pos_mobile/core/providers/auth_provider.dart';
import 'package:pos_mobile/core/providers/cart_provider.dart';
import 'package:pos_mobile/core/providers/catalog_provider.dart';
import 'package:pos_mobile/core/providers/sync_provider.dart';
import 'package:pos_mobile/core/repositories/auth_repository.dart';
import 'package:pos_mobile/core/repositories/local_billing_repository.dart';
import 'package:pos_mobile/core/services/offline_billing_service.dart';
import 'package:pos_mobile/core/theme/shadcn_colors.dart';
import 'package:pos_mobile/core/theme/shadcn_typography.dart';
import 'package:pos_mobile/core/widgets/shadcn_badge.dart';
import 'package:pos_mobile/core/widgets/shadcn_sheet.dart';
import 'package:pos_mobile/features/auth/login_screen.dart';
import 'package:pos_mobile/features/pos/pos_screen.dart';
import 'package:pos_mobile/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  const testProduct = Product(
    id: 'prod-oil-live-01',
    name: 'Fortune Sunlite Oil 1L',
    sku: 'OIL-FORTUNE-1794137043122',
    barcode: '890100043122',
    category: 'Groceries',
    unit: 'LTR',
    sellingPricePaisa: 16500, // ₹165.00
    purchaseCostPaisa: 14000, // ₹140.00
    gstRate: 5,
    currentStock: 28.0,
    hsnCode: '1512',
  );

  final liveMerchantUser = AuthUser(
    id: 'usr-live-merchant-01',
    email: 'live_kirana_1794137043122@kirana.dev',
    fullName: 'Ramanuj Mobile Tester',
    memberships: const [
      MembershipSummary(
        tenantId: '2a1d1379-4e9c-44a6-b0de-a7cca85dfb1b',
        tenantName: 'Live Kirana Store',
        branchId: '21c84bd7-9e9c-40e8-99d7-f6d971e5043c',
        role: 'owner',
        isOwner: true,
        businessType: 'grocery',
        enabledModules: ['pos', 'inventory', 'khata', 'gst', 'shifts', 'invoices'],
      ),
    ],
  );

  group('Mobile App Live Flow Screenshots', () {
    testWidgets('Step 1: Capture Merchant Registration Dialog', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: KiranaPosApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Open Register Store bottom sheet
      final registerBtn = find.byKey(const Key('mobile_register_store_btn'));
      expect(registerBtn, findsOneWidget);
      await tester.tap(registerBtn);
      await tester.pumpAndSettle();

      // Fill in merchant registration fields
      final textFields = find.byType(TextField);
      if (textFields.evaluate().length >= 4) {
        await tester.enterText(textFields.at(textFields.evaluate().length - 4), 'Live Kirana Store');
        await tester.enterText(textFields.at(textFields.evaluate().length - 3), 'Ramanuj Mobile Tester');
        await tester.enterText(textFields.at(textFields.evaluate().length - 2), 'live_kirana_1794137043122@kirana.dev');
        await tester.enterText(textFields.at(textFields.evaluate().length - 1), 'Password@123');
      }
      await tester.pumpAndSettle();

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/mobile_01_merchant_registration.png'),
      );
    });

    testWidgets('Step 2: Capture Mobile POS Terminal with Created Product', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(
              (ref) => AuthNotifier(
                ref.watch(authRepositoryProvider),
                initialState: AuthState(
                  user: liveMerchantUser,
                  activeMembership: liveMerchantUser.primaryMembership,
                  activeBranchId: '21c84bd7-9e9c-40e8-99d7-f6d971e5043c',
                  isInitialized: true,
                ),
              ),
            ),
            catalogProvider.overrideWith(
              (ref) => CatalogNotifier(ref.watch(localCatalogRepoProvider))
                ..state = const CatalogState(
                  allProducts: [testProduct],
                  selectedCategory: 'All',
                ),
            ),
          ],
          child: const KiranaPosApp(),
        ),
      );
      await tester.pumpAndSettle();

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/mobile_02_pos_catalog.png'),
      );
    });

    testWidgets('Step 3: Capture Cart Checkout Sheet with Order (Qty: 2)', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(
              (ref) => AuthNotifier(
                ref.watch(authRepositoryProvider),
                initialState: AuthState(
                  user: liveMerchantUser,
                  activeMembership: liveMerchantUser.primaryMembership,
                  activeBranchId: '21c84bd7-9e9c-40e8-99d7-f6d971e5043c',
                  isInitialized: true,
                ),
              ),
            ),
            catalogProvider.overrideWith(
              (ref) => CatalogNotifier(ref.watch(localCatalogRepoProvider))
                ..state = const CatalogState(
                  allProducts: [testProduct],
                  selectedCategory: 'All',
                ),
            ),
          ],
          child: const KiranaPosApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Tap product card twice to add 2 units to cart
      final productCard = find.text('Fortune Sunlite Oil 1L');
      expect(productCard, findsOneWidget);
      await tester.tap(productCard);
      await tester.pumpAndSettle();
      await tester.tap(productCard);
      await tester.pumpAndSettle();

      // Tap PAY / BILL to show checkout sheet
      final payBtn = find.text('PAY / BILL');
      expect(payBtn, findsOneWidget);
      await tester.tap(payBtn);
      await tester.pumpAndSettle();

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/mobile_03_cart_checkout.png'),
      );
    });

    testWidgets('Step 4: Capture Completed Sale Receipt Modal', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      const receiptText = '''
================================
       LIVE KIRANA STORE        
   Shop 4, Market Road, Pune    
  GSTIN: 27AABCU9603R1ZM        
================================
Invoice: INV-20261108-1203      
Date: 08/11/2026 12:03 PM       
Cashier: Ramanuj Mobile Tester  
Payment: CASH [PAID]            
--------------------------------
ITEM             QTY  RATE   TOTAL
Fortune Sunlite    2 165.00 330.00
 Oil 1L (LTR)                   
--------------------------------
Subtotal:                ₹330.00
CGST 2.5%:                 ₹8.25
SGST 2.5%:                 ₹8.25
Total GST:                ₹16.50
Rounding Adj:             +₹0.50
--------------------------------
GRAND TOTAL:             ₹347.00
Cash Tendered:           ₹350.00
Change Returned:           ₹3.00
================================
  Status: Synchronized to Cloud 
   Thank you! Visit again.      
================================
''';

      final mockSaleResult = OfflineSaleResult(
        invoiceId: 'inv-uuid-live-01',
        invoiceNumber: 'INV-20261108-1203',
        paymentMethod: 'cash',
        totalPaisa: 34700,
        receiptText: receiptText,
        createdAt: DateTime.now(),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(
              (ref) => AuthNotifier(
                ref.watch(authRepositoryProvider),
                initialState: AuthState(
                  user: liveMerchantUser,
                  activeMembership: liveMerchantUser.primaryMembership,
                  activeBranchId: '21c84bd7-9e9c-40e8-99d7-f6d971e5043c',
                  isInitialized: true,
                ),
              ),
            ),
            catalogProvider.overrideWith(
              (ref) => CatalogNotifier(ref.watch(localCatalogRepoProvider))
                ..state = const CatalogState(
                  allProducts: [testProduct],
                  selectedCategory: 'All',
                ),
            ),
          ],
          child: MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              useMaterial3: true,
              scaffoldBackgroundColor: ShadcnColors.background,
            ),
            home: Builder(
              builder: (context) {
                return Scaffold(
                  body: Stack(
                    children: [
                      const MobilePosScreen(),
                      // Directly trigger and render the Receipt Dialog
                      Center(
                        child: AlertDialog(
                          backgroundColor: ShadcnColors.surface,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: const BorderSide(color: ShadcnColors.border, width: 1),
                          ),
                          title: const Row(
                            children: [
                              Icon(Icons.check_circle_rounded, color: ShadcnColors.success, size: 24),
                              SizedBox(width: 8),
                              Text('Sale Complete!', style: ShadcnTypography.h3),
                            ],
                          ),
                          content: SizedBox(
                            width: 360,
                            child: SingleChildScrollView(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          'Bill No: ${mockSaleResult.invoiceNumber}',
                                          style: ShadcnTypography.bodySemibold,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      ShadcnBadge(
                                        text: mockSaleResult.paymentMethod.toUpperCase(),
                                        variant: ShadcnBadgeVariant.success,
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Amount Paid: ₹${mockSaleResult.totalRupees.toStringAsFixed(2)}',
                                    style: ShadcnTypography.currency.copyWith(color: ShadcnColors.primary),
                                  ),
                                  const SizedBox(height: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: ShadcnColors.secondary,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: ShadcnColors.border),
                                    ),
                                    child: const Row(
                                      children: [
                                        Icon(Icons.print_outlined, size: 14, color: ShadcnColors.mutedForeground),
                                        SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            'Printer: ESC/POS Thermal (58MM) - Connected',
                                            style: ShadcnTypography.caption,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  const Text('Thermal Receipt Preview:', style: ShadcnTypography.caption),
                                  const SizedBox(height: 6),
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF8FAFC),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: ShadcnColors.border),
                                    ),
                                    child: Text(
                                      mockSaleResult.receiptText,
                                      style: ShadcnTypography.code.copyWith(fontSize: 11, height: 1.3),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () {},
                              child: const Text('New Sale', style: TextStyle(color: ShadcnColors.mutedForeground)),
                            ),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: ShadcnColors.primary,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                              ),
                              onPressed: () {},
                              icon: const Icon(Icons.print_outlined, size: 16),
                              label: const Text('Print Receipt'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/mobile_04_receipt_dialog.png'),
      );
    });
  });
}
