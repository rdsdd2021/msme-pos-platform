import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/config/app_config.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/cart_provider.dart';
import 'core/providers/sync_provider.dart';
import 'core/services/realtime_sync_service.dart';
import 'core/theme/shadcn_colors.dart';
import 'core/theme/shadcn_typography.dart';
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
        useMaterial3: true,
        scaffoldBackgroundColor: ShadcnColors.background,
        colorScheme: const ColorScheme(
          brightness: Brightness.light,
          primary: ShadcnColors.primary,
          onPrimary: ShadcnColors.primaryForeground,
          secondary: ShadcnColors.secondary,
          onSecondary: ShadcnColors.secondaryForeground,
          error: ShadcnColors.destructive,
          onError: ShadcnColors.destructiveForeground,
          surface: ShadcnColors.surface,
          onSurface: ShadcnColors.foreground,
        ),
        dividerColor: ShadcnColors.border,
        dividerTheme: const DividerThemeData(
          color: ShadcnColors.border,
          thickness: 1,
          space: 1,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: ShadcnColors.surface,
          foregroundColor: ShadcnColors.foreground,
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: false,
          titleTextStyle: ShadcnTypography.h3,
          iconTheme: IconThemeData(color: ShadcnColors.foreground, size: 20),
        ),
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
    final membership = authState.activeMembership;
    final isCashier = authState.isCashier;
    final isRestaurant = membership?.hasRestaurantModule ?? false;
    final hasKhata = membership?.hasKhataModule ?? true;
    final hasInventory = membership?.hasInventoryModule ?? true;
    final cartState = ref.watch(cartProvider);

    // Rule 11: Scoped cashiers cannot access store owner analytics or inventory management
    if (isCashier) {
      if (isRestaurant) {
        return const RestaurantTablesScreen();
      }
      return const MobilePosScreen();
    }

    // Build screens and navigation items dynamically based on active tenant's authorized modules
    final screens = <Widget>[];
    final items = <_NavItem>[];

    if (isRestaurant) {
      screens.add(const RestaurantTablesScreen());
      items.add(const _NavItem(
        icon: Icons.table_restaurant_outlined,
        activeIcon: Icons.table_restaurant,
        label: 'Tables',
      ));

      screens.add(const OrderHistoryScreen());
      items.add(const _NavItem(
        icon: Icons.receipt_long_outlined,
        activeIcon: Icons.receipt_long,
        label: 'Orders',
      ));

      if (hasInventory) {
        screens.add(const MobileInventoryScreen());
        items.add(const _NavItem(
          icon: Icons.restaurant_menu_outlined,
          activeIcon: Icons.restaurant_menu,
          label: 'Menu',
        ));
      }

      if (hasKhata) {
        screens.add(const MobileKhataScreen());
        items.add(const _NavItem(
          icon: Icons.menu_book_outlined,
          activeIcon: Icons.menu_book,
          label: 'Khata',
        ));
      }

      screens.add(const MobileOwnerScreen());
      items.add(const _NavItem(
        icon: Icons.storefront_outlined,
        activeIcon: Icons.storefront,
        label: 'Store Owner',
      ));
    } else {
      screens.add(const MobilePosScreen());
      items.add(_NavItem(
        icon: Icons.point_of_sale_outlined,
        activeIcon: Icons.point_of_sale,
        label: 'Kirana POS',
        badgeCount: cartState.totalItemsCount,
      ));

      screens.add(const OrderHistoryScreen());
      items.add(const _NavItem(
        icon: Icons.receipt_long_outlined,
        activeIcon: Icons.receipt_long,
        label: 'Orders',
      ));

      if (hasInventory) {
        screens.add(const MobileInventoryScreen());
        items.add(const _NavItem(
          icon: Icons.inventory_2_outlined,
          activeIcon: Icons.inventory_2,
          label: 'Inventory',
        ));
      }

      if (hasKhata) {
        screens.add(const MobileKhataScreen());
        items.add(const _NavItem(
          icon: Icons.menu_book_outlined,
          activeIcon: Icons.menu_book,
          label: 'Khata',
        ));
      }

      screens.add(const MobileOwnerScreen());
      items.add(const _NavItem(
        icon: Icons.storefront_outlined,
        activeIcon: Icons.storefront,
        label: 'Store Owner',
      ));
    }

    final safeIndex = _currentIndex >= screens.length ? 0 : _currentIndex;

    return Scaffold(
      body: IndexedStack(
        index: safeIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: ShadcnColors.surface,
          border: Border(
            top: BorderSide(color: ShadcnColors.border, width: 1.0),
          ),
          boxShadow: [
            BoxShadow(
              color: Color(0x06000000),
              blurRadius: 8,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 56,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(items.length, (index) {
                final item = items[index];
                final isSelected = safeIndex == index;

                return Expanded(
                  child: InkWell(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() {
                        _currentIndex = index;
                      });
                    },
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Icon(
                              isSelected ? item.activeIcon : item.icon,
                              size: 22,
                              color: isSelected
                                  ? ShadcnColors.primary
                                  : ShadcnColors.mutedForeground,
                            ),
                            if (item.badgeCount != null && item.badgeCount! > 0)
                              Positioned(
                                right: -8,
                                top: -4,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: ShadcnColors.primary,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  constraints: const BoxConstraints(minWidth: 14, minHeight: 14),
                                  child: Text(
                                    '${item.badgeCount}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          item.label,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                            color: isSelected
                                ? ShadcnColors.primary
                                : ShadcnColors.mutedForeground,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final int? badgeCount;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    this.badgeCount,
  });
}
