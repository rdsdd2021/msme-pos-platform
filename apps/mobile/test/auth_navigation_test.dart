import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/core/providers/auth_provider.dart';
import 'package:pos_mobile/features/auth/login_screen.dart';
import 'package:pos_mobile/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('Mobile Authentication & Role Navigation Tests', () {
    testWidgets('starts on MobileLoginScreen when unauthenticated on cold boot', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: KiranaPosApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Starts unauthenticated: Login screen is displayed
      expect(find.byType(MobileLoginScreen), findsOneWidget);
      expect(find.text('Sign in to your Store'), findsOneWidget);
      expect(find.byKey(const Key('login_email_input')), findsOneWidget);
      expect(find.byKey(const Key('login_password_input')), findsOneWidget);
      expect(find.byKey(const Key('login_submit_btn')), findsOneWidget);
      expect(find.byKey(const Key('mobile_register_store_btn')), findsOneWidget);
    });

    testWidgets('allows navigation between POS and Store Owner Analytics for Owner after login', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: KiranaPosApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Store Owner demo button to prefill admin@kirana.dev
      await tester.tap(find.byKey(const Key('demo_owner_btn')));
      await tester.pumpAndSettle();

      // Sign In
      await tester.tap(find.byKey(const Key('login_submit_btn')));
      await tester.pumpAndSettle();

      // In POS header
      expect(find.text('Kirana Supermart'), findsOneWidget);
      expect(find.textContaining('Rajesh Store Owner'), findsOneWidget);

      // Bottom Navigation has both Kirana POS and Store Owner tabs
      expect(find.text('Kirana POS'), findsOneWidget);
      expect(find.text('Store Owner'), findsOneWidget);

      // Tap Store Owner tab
      await tester.tap(find.text('Store Owner'));
      await tester.pumpAndSettle();

      expect(find.text('Store Owner Analytics'), findsOneWidget);
      expect(find.text('Gross Sales'), findsOneWidget);
      expect(find.text('Cash In Register'), findsOneWidget);
    });

    testWidgets('logout from POS displays confirmation dialog and navigates to LoginScreen', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const ProviderScope(
          child: KiranaPosApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Log in first as Owner
      await tester.tap(find.byKey(const Key('demo_owner_btn')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('login_submit_btn')));
      await tester.pumpAndSettle();

      // Tap logout button in POS screen
      final logoutBtn = find.byKey(const Key('pos_logout_btn'));
      expect(logoutBtn, findsOneWidget);
      await tester.tap(logoutBtn);
      await tester.pumpAndSettle();

      // Confirmation dialog appears
      expect(find.text('Sign Out'), findsWidgets);
      expect(find.textContaining('Are you sure you want to sign out'), findsOneWidget);

      // Tap 'Sign Out' in dialog
      final dialogSignOut = find.widgetWithText(ElevatedButton, 'Sign Out');
      expect(dialogSignOut, findsOneWidget);
      await tester.tap(dialogSignOut);
      await tester.pumpAndSettle();

      // Now on MobileLoginScreen
      expect(find.byType(MobileLoginScreen), findsOneWidget);
      expect(find.text('Sign in to your Store'), findsOneWidget);
      expect(find.byKey(const Key('login_email_input')), findsOneWidget);
    });

    testWidgets('logs in as Cashier and enforces Rule 11 (hides Store Owner tab)', (WidgetTester tester) async {
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
                initialState: const AuthState(isInitialized: true),
              ),
            ),
          ],
          child: const KiranaPosApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Verify unauthenticated on LoginScreen
      expect(find.byType(MobileLoginScreen), findsOneWidget);

      // Tap 'Cashier' quick demo button
      await tester.tap(find.byKey(const Key('demo_cashier_btn')));
      await tester.pumpAndSettle();

      // Tap 'Sign In to Terminal'
      await tester.tap(find.byKey(const Key('login_submit_btn')));
      await tester.pumpAndSettle();

      // Cashier is now logged in: verify POS screen
      expect(find.text('Kirana Supermart'), findsOneWidget);
      expect(find.textContaining('Suresh Cashier'), findsOneWidget);

      // Rule 11 Enforcement: NavigationBar and 'Store Owner' tab MUST NOT exist for cashier
      expect(find.byType(NavigationBar), findsNothing);
      expect(find.text('Store Owner'), findsNothing);
    });

    testWidgets('shows error banner when invalid credentials are submitted', (WidgetTester tester) async {
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
                initialState: const AuthState(isInitialized: true),
              ),
            ),
          ],
          child: const KiranaPosApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Clear & enter invalid credentials
      await tester.enterText(find.byKey(const Key('login_email_input')), 'unknown@kirana.dev');
      await tester.enterText(find.byKey(const Key('login_password_input')), 'WrongPassword999');
      await tester.pumpAndSettle();

      // Submit
      await tester.tap(find.byKey(const Key('login_submit_btn')));
      await tester.pumpAndSettle();

      // Error banner is displayed
      expect(find.byKey(const Key('login_error_banner')), findsOneWidget);
    });

    testWidgets('logs in as Restaurant Owner and navigates to RestaurantTablesScreen with Tables and Orders tabs', (WidgetTester tester) async {
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
                initialState: const AuthState(isInitialized: true),
              ),
            ),
          ],
          child: const KiranaPosApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Tap 'Restaurant / Cafe' quick demo button
      await tester.tap(find.byKey(const Key('demo_restaurant_btn')));
      await tester.pumpAndSettle();

      // Tap 'Sign In to Register'
      await tester.tap(find.byKey(const Key('login_submit_btn')));
      await tester.pumpAndSettle();

      // Verify Restaurant Tables screen is displayed
      expect(find.text('Tables'), findsOneWidget);
      expect(find.text('Occupied Tables'), findsOneWidget);
      expect(find.text('AC Dining'), findsOneWidget);
    });
  });
}
