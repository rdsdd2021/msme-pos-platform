import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/core/models/product.dart';
import 'package:pos_mobile/core/providers/auth_provider.dart';
import 'package:pos_mobile/core/providers/catalog_provider.dart';
import 'package:pos_mobile/core/repositories/auth_repository.dart';
import 'package:pos_mobile/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('KiranaPosApp', () {
    testWidgets('renders Kirana Supermart header and search bar', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(
              (ref) => AuthNotifier(
                ref.watch(authRepositoryProvider),
                initialState: AuthState(
                  user: AuthRepository.demoOwner,
                  activeMembership: AuthRepository.demoOwner.primaryMembership,
                  isInitialized: true,
                ),
              ),
            ),
            catalogProvider.overrideWith(
              (ref) => CatalogNotifier(ref.watch(localCatalogRepoProvider))
                ..state = const CatalogState(
                  allProducts: [
                    Product(
                      id: 'test-salt',
                      name: 'Tata Salt 1kg',
                      sku: 'GROC-002',
                      category: 'Groceries',
                      unit: 'PKT',
                      sellingPricePaisa: 2800,
                      purchaseCostPaisa: 2200,
                      currentStock: 100.0,
                      gstRate: 0,
                    ),
                  ],
                ),
            ),
          ],
          child: const KiranaPosApp(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Kirana Supermart'), findsOneWidget);
      expect(find.text('Scan Barcode / Search Product...'), findsOneWidget);
      expect(find.text('Offline Ready'), findsOneWidget);
    });

    testWidgets('adds grocery product to cart and updates bottom bar total', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(
              (ref) => AuthNotifier(
                ref.watch(authRepositoryProvider),
                initialState: AuthState(
                  user: AuthRepository.demoOwner,
                  activeMembership: AuthRepository.demoOwner.primaryMembership,
                  isInitialized: true,
                ),
              ),
            ),
            catalogProvider.overrideWith(
              (ref) => CatalogNotifier(ref.watch(localCatalogRepoProvider))
                ..state = const CatalogState(
                  allProducts: [
                    Product(
                      id: 'test-salt',
                      name: 'Tata Salt 1kg',
                      sku: 'GROC-002',
                      category: 'Groceries',
                      unit: 'PKT',
                      sellingPricePaisa: 2800,
                      purchaseCostPaisa: 2200,
                      currentStock: 100.0,
                      gstRate: 0,
                    ),
                  ],
                ),
            ),
          ],
          child: const KiranaPosApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Tap on 'Tata Salt 1kg'
      final saltFinder = find.text('Tata Salt 1kg');
      expect(saltFinder, findsOneWidget);
      await tester.tap(saltFinder);
      await tester.pumpAndSettle();

      // Bottom cart bar should now show 1 item and ₹28.00 (with 0% GST)
      expect(find.text('1 items | Tax: ₹0.00'), findsOneWidget);
      expect(find.text('₹28.00'), findsOneWidget);
      expect(find.text('PAY / BILL'), findsOneWidget);
    });

    testWidgets('switches to Store Owner Analytics screen', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(
              (ref) => AuthNotifier(
                ref.watch(authRepositoryProvider),
                initialState: AuthState(
                  user: AuthRepository.demoOwner,
                  activeMembership: AuthRepository.demoOwner.primaryMembership,
                  isInitialized: true,
                ),
              ),
            ),
            catalogProvider.overrideWith(
              (ref) => CatalogNotifier(ref.watch(localCatalogRepoProvider))
                ..state = const CatalogState(
                  allProducts: [
                    Product(
                      id: 'test-salt',
                      name: 'Tata Salt 1kg',
                      sku: 'GROC-002',
                      category: 'Groceries',
                      unit: 'PKT',
                      sellingPricePaisa: 2800,
                      purchaseCostPaisa: 2200,
                      currentStock: 100.0,
                      gstRate: 0,
                    ),
                  ],
                ),
            ),
          ],
          child: const KiranaPosApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Tap 'Store Owner' tab in NavigationBar
      final ownerTab = find.text('Store Owner');
      expect(ownerTab, findsOneWidget);
      await tester.tap(ownerTab);
      await tester.pumpAndSettle();

      expect(find.text('Store Owner Analytics'), findsOneWidget);
      expect(find.text('Gross Sales'), findsOneWidget);
      expect(find.text('Cash In Register'), findsOneWidget);
      expect(find.text('Low Stock Alerts (< 5 units)'), findsOneWidget);
      expect(find.text('Customer Khata Balances'), findsOneWidget);
    });
  });
}
