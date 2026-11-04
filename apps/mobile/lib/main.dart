import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/config/app_config.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/sync_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/owner/owner_screen.dart';
import 'features/pos/pos_screen.dart';

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

  final List<Widget> _screens = const [
    MobilePosScreen(),
    MobileOwnerScreen(),
  ];

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
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isCashier = authState.isCashier;

    // Rule 11: Scoped cashiers cannot access store owner analytics or switch branches
    if (isCashier) {
      return const MobilePosScreen();
    }

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex >= _screens.length ? 0 : _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex >= _screens.length ? 0 : _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.point_of_sale_outlined),
            selectedIcon: Icon(Icons.point_of_sale, color: Color(0xFF10B981)),
            label: 'Kirana POS',
          ),
          NavigationDestination(
            icon: Icon(Icons.storefront_outlined),
            selectedIcon: Icon(Icons.storefront, color: Color(0xFF10B981)),
            label: 'Store Owner',
          ),
        ],
      ),
    );
  }
}
