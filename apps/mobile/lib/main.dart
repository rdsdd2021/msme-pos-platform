import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/config/app_config.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/store_mode_provider.dart';
import 'core/providers/sync_provider.dart';
import 'core/services/realtime_sync_service.dart';
import 'features/auth/login_screen.dart';
import 'features/history/order_history_screen.dart';
import 'features/inventory/inventory_screen.dart';
import 'features/khata/khata_screen.dart';
import 'features/owner/owner_screen.dart';
import 'features/pos/pos_screen.dart';
import 'features/restaurant/restaurant_tables_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    const ProviderScope(
      child: KiranaPosApp(),
    ),
  );
}

class KiranaPosApp extends ConsumerWidget {
  const KiranaPosApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return MaterialApp(
      key: ValueKey(authState.isAuthenticated ? 'authenticated' : 'unauthenticated'),
      title: 'Kirana POS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF10B981), // Emerald Kirana green
          primary: const Color(0xFF10B981),
          surface: Colors.white,
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      ),
      home: !authState.isAuthenticated
          ? const MobileLoginScreen()
          : const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends ConsumerStatefulWidget {
  const MainNavigationShell({super.key});

  @override
  ConsumerState<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends ConsumerState<MainNavigationShell> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initDeviceAndSync();
    });
  }

  Future<void> _initDeviceAndSync() async {
    final authState = ref.read(authProvider);
    final tenantId = authState.activeMembership?.tenantId;
    final branchId = authState.activeBranchId ?? 'default';
    final deviceId = await AppConfig.getDeviceId();
    if (tenantId != null) {
      try {
        await ref.read(syncRepositoryProvider).registerDevice(
          tenantId: tenantId,
          branchId: branchId,
          deviceIdentifier: deviceId,
          deviceName: 'Android POS Terminal',
        );
      } catch (_) {}
    }
    // Trigger initial delta sync so latest products and categories appear
    await ref.read(syncStateProvider.notifier).syncNow(deviceId: deviceId);
    // Start persistent realtime event stream for live updates
    ref.read(realtimeSyncServiceProvider);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final verticalMode = ref.watch(storeModeProvider);
    final isCashier = authState.isCashier;

    // Rule 11: Scoped cashiers cannot access store owner analytics or switch branches
    if (isCashier) {
      if (verticalMode == StoreVerticalMode.restaurant) {
        return const RestaurantTablesScreen();
      }
      return const MobilePosScreen();
    }

    // Build screens and navigation destinations dynamically based on active store vertical
    final List<Widget> screens;
    final List<NavigationDestination> destinations;

    if (verticalMode == StoreVerticalMode.restaurant) {
      screens = const [
        RestaurantTablesScreen(),
        OrderHistoryScreen(),
        MobileInventoryScreen(),
        MobileKhataScreen(),
        MobileOwnerScreen(),
      ];
      destinations = const [
        NavigationDestination(
          icon: Icon(Icons.table_restaurant_outlined),
          selectedIcon: Icon(Icons.table_restaurant, color: Color(0xFF10B981)),
          label: 'Tables',
        ),
        NavigationDestination(
          icon: Icon(Icons.receipt_long_outlined),
          selectedIcon: Icon(Icons.receipt_long, color: Color(0xFF10B981)),
          label: 'Orders',
        ),
        NavigationDestination(
          icon: Icon(Icons.restaurant_menu_outlined),
          selectedIcon: Icon(Icons.restaurant_menu, color: Color(0xFF10B981)),
          label: 'Menu',
        ),
        NavigationDestination(
          icon: Icon(Icons.menu_book_outlined),
          selectedIcon: Icon(Icons.menu_book, color: Color(0xFF10B981)),
          label: 'Khata',
        ),
        NavigationDestination(
          icon: Icon(Icons.storefront_outlined),
          selectedIcon: Icon(Icons.storefront, color: Color(0xFF10B981)),
          label: 'Store Owner',
        ),
      ];
    } else {
      // Retail / Kirana POS
      screens = const [
        MobilePosScreen(),
        OrderHistoryScreen(),
        MobileInventoryScreen(),
        MobileKhataScreen(),
        MobileOwnerScreen(),
      ];
      destinations = const [
        NavigationDestination(
          icon: Icon(Icons.point_of_sale_outlined),
          selectedIcon: Icon(Icons.point_of_sale, color: Color(0xFF10B981)),
          label: 'Kirana POS',
        ),
        NavigationDestination(
          icon: Icon(Icons.receipt_long_outlined),
          selectedIcon: Icon(Icons.receipt_long, color: Color(0xFF10B981)),
          label: 'Orders',
        ),
        NavigationDestination(
          icon: Icon(Icons.inventory_2_outlined),
          selectedIcon: Icon(Icons.inventory_2, color: Color(0xFF10B981)),
          label: 'Inventory',
        ),
        NavigationDestination(
          icon: Icon(Icons.menu_book_outlined),
          selectedIcon: Icon(Icons.menu_book, color: Color(0xFF10B981)),
          label: 'Khata',
        ),
        NavigationDestination(
          icon: Icon(Icons.storefront_outlined),
          selectedIcon: Icon(Icons.storefront, color: Color(0xFF10B981)),
          label: 'Store Owner',
        ),
      ];
    }

    final safeIndex = _currentIndex >= screens.length ? 0 : _currentIndex;

    return Scaffold(
      body: IndexedStack(
        index: safeIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: safeIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        destinations: destinations,
      ),
    );
  }
}
