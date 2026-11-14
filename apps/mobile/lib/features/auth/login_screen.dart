import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/config/app_config.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/sync_provider.dart';
import '../../core/repositories/auth_repository.dart';
import '../../core/theme/shadcn_colors.dart';
import '../../core/theme/shadcn_typography.dart';
import '../../core/widgets/shadcn_card.dart';
import '../../core/widgets/shadcn_button.dart';
import '../../core/widgets/shadcn_input.dart';

class MobileLoginScreen extends ConsumerStatefulWidget {
  const MobileLoginScreen({super.key});

  @override
  ConsumerState<MobileLoginScreen> createState() => _MobileLoginScreenState();
}

class _MobileLoginScreenState extends ConsumerState<MobileLoginScreen> {
  final _emailController = TextEditingController(text: 'admin@kirana.dev');
  final _passwordController = TextEditingController(text: 'Password@123');
  bool _obscurePassword = true;
  String? _localError;

  @override
  void initState() {
    super.initState();
    _initServerUrl();
  }

  Future<void> _initServerUrl() async {
    final url = await AppConfig.getServerUrl();
    ref.read(authRepositoryProvider).updateBaseUrl(url);
    ref.read(syncRepositoryProvider).updateBaseUrl(url);
  }

  Future<void> _showServerConfigDialog() async {
    final currentUrl = await AppConfig.getServerUrl();
    final urlController = TextEditingController(text: currentUrl);

    if (!mounted) return;

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: ShadcnColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: ShadcnColors.border),
        ),
        title: const Row(
          children: [
            Icon(Icons.dns_outlined, color: ShadcnColors.primary, size: 22),
            SizedBox(width: 8),
            Text('Server Settings', style: ShadcnTypography.h3),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Backend API & Sync Endpoint:',
              style: ShadcnTypography.caption,
            ),
            const SizedBox(height: 8),
            ShadcnInput(
              controller: urlController,
              placeholder: 'e.g. https://pos.assistt.in',
              keyboardType: TextInputType.url,
            ),
            const SizedBox(height: 6),
            const Text(
              'Default Hosted Server: https://pos.assistt.in',
              style: TextStyle(fontSize: 10, color: ShadcnColors.mutedForeground),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () async {
              await AppConfig.resetServerUrl();
              final reset = await AppConfig.getServerUrl();
              ref.read(authRepositoryProvider).updateBaseUrl(reset);
              ref.read(syncRepositoryProvider).updateBaseUrl(reset);
              if (ctx.mounted) Navigator.pop(ctx);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Reset to default hosted server URL')),
                );
              }
            },
            child: const Text('Reset Default', style: TextStyle(color: ShadcnColors.destructive)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: ShadcnColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            onPressed: () async {
              final newUrl = urlController.text.trim();
              if (newUrl.isNotEmpty) {
                await AppConfig.setServerUrl(newUrl);
                ref.read(authRepositoryProvider).updateBaseUrl(newUrl);
                ref.read(syncRepositoryProvider).updateBaseUrl(newUrl);
              }
              if (ctx.mounted) Navigator.pop(ctx);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Server endpoint set to: $newUrl')),
                );
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty) {
      setState(() => _localError = 'Please enter your email address');
      return;
    }
    if (password.isEmpty) {
      setState(() => _localError = 'Please enter your password');
      return;
    }

    setState(() => _localError = null);

    try {
      await ref.read(authProvider.notifier).login(email, password);
    } catch (e) {
      if (mounted) {
        if (e is AuthException) {
          setState(() => _localError = e.message);
        } else {
          setState(() => _localError = e.toString().replaceFirst('Exception: ', ''));
        }
      }
    }
  }

  void _fillDemoCredentials({required bool isOwner, bool isRestaurant = false}) {
    HapticFeedback.selectionClick();
    setState(() {
      if (isRestaurant) {
        _emailController.text = 'cafe@kirana.dev';
      } else {
        _emailController.text = isOwner ? 'admin@kirana.dev' : 'cashier@kirana.dev';
      }
      _passwordController.text = 'Password@123';
      _localError = null;
    });
  }

  Future<void> _showRegisterBottomSheet() async {
    final regNameController = TextEditingController();
    final regStoreController = TextEditingController();
    final regEmailController = TextEditingController();
    final regPasswordController = TextEditingController();
    String selectedVertical = 'grocery';
    String? regError;
    bool isConflict = false;
    String? conflictEmail;
    bool isSubmitting = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          decoration: const BoxDecoration(
            color: ShadcnColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          ),
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Register New Store', style: ShadcnTypography.h3),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20, color: ShadcnColors.mutedForeground),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const Text(
                  'Clean setup for production commerce. No dummy items seeded.',
                  style: ShadcnTypography.caption,
                ),
                if (regError != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isConflict ? const Color(0xFFFEF3C7) : ShadcnColors.destructiveLight,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isConflict ? const Color(0xFFF59E0B) : ShadcnColors.destructive.withOpacity(0.3),
                        width: 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              isConflict ? Icons.account_circle_outlined : Icons.error_outline,
                              size: 18,
                              color: isConflict ? const Color(0xFFB45309) : ShadcnColors.destructive,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                regError!,
                                style: TextStyle(
                                  color: isConflict ? const Color(0xFF92400E) : ShadcnColors.destructive,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (isConflict && conflictEmail != null) ...[
                          const SizedBox(height: 10),
                          ElevatedButton.icon(
                            key: const Key('sign_in_with_conflict_email_btn'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFD97706),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                            ),
                            icon: const Icon(Icons.login, size: 16),
                            label: Text(
                              'Sign In as $conflictEmail',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              overflow: TextOverflow.ellipsis,
                            ),
                            onPressed: () {
                              final emailToFill = conflictEmail!;
                              Navigator.pop(ctx);
                              _emailController.text = emailToFill;
                              _passwordController.clear();
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Please enter your password for $emailToFill to sign in'),
                                  backgroundColor: ShadcnColors.primary,
                                  duration: const Duration(seconds: 4),
                                ),
                              );
                            },
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Or enter a different email address below to create a new store.',
                            style: TextStyle(color: Color(0xFF92400E), fontSize: 11),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                ShadcnInput(
                  controller: regStoreController,
                  label: 'Store Name (e.g. Rana General Store)',
                  placeholder: 'Store name',
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: selectedVertical,
                  isExpanded: true,
                  decoration: InputDecoration(
                    labelText: 'Retail Vertical',
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'grocery', child: Text('Kirana & Grocery POS')),
                    DropdownMenuItem(value: 'restaurant', child: Text('Restaurant & Cafe POS')),
                    DropdownMenuItem(value: 'pharmacy', child: Text('Pharmacy & Chemist')),
                  ],
                  onChanged: (val) {
                    if (val != null) setModalState(() => selectedVertical = val);
                  },
                ),
                const SizedBox(height: 12),
                ShadcnInput(
                  controller: regNameController,
                  label: 'Owner Full Name',
                  placeholder: 'Full name',
                ),
                const SizedBox(height: 12),
                ShadcnInput(
                  controller: regEmailController,
                  label: 'Email Address (Login)',
                  placeholder: 'owner@store.in',
                  keyboardType: TextInputType.emailAddress,
                  onChanged: (_) {
                    if (regError != null) {
                      setModalState(() {
                        regError = null;
                        isConflict = false;
                        conflictEmail = null;
                      });
                    }
                  },
                ),
                const SizedBox(height: 12),
                ShadcnInput(
                  controller: regPasswordController,
                  label: 'Password',
                  placeholder: 'min 8 characters',
                  obscureText: true,
                ),
                const SizedBox(height: 20),
                ShadcnButton(
                  text: 'COMPLETE REGISTRATION',
                  size: ShadcnButtonSize.lg,
                  variant: ShadcnButtonVariant.primary,
                  isLoading: isSubmitting,
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          final storeName = regStoreController.text.trim();
                          final fullName = regNameController.text.trim();
                          final email = regEmailController.text.trim();
                          final password = regPasswordController.text;

                          if (storeName.isEmpty || fullName.isEmpty || email.isEmpty || password.isEmpty) {
                            setModalState(() {
                              regError = 'Please fill in all required fields';
                              isConflict = false;
                              conflictEmail = null;
                            });
                            return;
                          }
                          if (password.length < 8) {
                            setModalState(() {
                              regError = 'Password must be at least 8 characters';
                              isConflict = false;
                              conflictEmail = null;
                            });
                            return;
                          }

                          setModalState(() {
                            isSubmitting = true;
                            regError = null;
                            isConflict = false;
                            conflictEmail = null;
                          });

                          try {
                            await ref.read(authRepositoryProvider).registerMerchant(
                                  storeName: storeName,
                                  fullName: fullName,
                                  email: email,
                                  password: password,
                                  businessType: selectedVertical,
                                  stateCode: '27',
                                );
                            await ref.read(authProvider.notifier).login(email, password);
                            if (ctx.mounted) Navigator.pop(ctx);
                          } catch (e) {
                            setModalState(() {
                              isSubmitting = false;
                              if (e is AuthException) {
                                regError = e.message;
                                isConflict = e.isConflict;
                                conflictEmail = e.email ?? email;
                              } else {
                                regError = e.toString().replaceFirst('Exception: ', '');
                                isConflict = false;
                                conflictEmail = null;
                              }
                            });
                          }
                        },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final errorMessage = _localError ?? authState.error;

    return Scaffold(
      backgroundColor: ShadcnColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Server config trigger
                  Align(
                    alignment: Alignment.topRight,
                    child: IconButton(
                      icon: const Icon(Icons.settings_outlined, size: 20, color: ShadcnColors.mutedForeground),
                      tooltip: 'Server Settings',
                      onPressed: _showServerConfigDialog,
                    ),
                  ),

                  // Brand Icon & Header
                  Center(
                    child: Column(
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: ShadcnColors.primaryLight,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: ShadcnColors.primary.withOpacity(0.3)),
                          ),
                          alignment: Alignment.center,
                          child: const Icon(Icons.point_of_sale_rounded, size: 28, color: ShadcnColors.primary),
                        ),
                        const SizedBox(height: 12),
                        Text('Kirana POS', style: ShadcnTypography.h1),
                        const SizedBox(height: 4),
                        const Text(
                          'Enterprise Offline-First Retail POS & ERP',
                          style: ShadcnTypography.caption,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Login Form Card
                  ShadcnCard(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text('Sign in to your Store', style: ShadcnTypography.h3),
                        const SizedBox(height: 4),
                        const Text('Enter your credentials to access the POS register', style: ShadcnTypography.caption),

                        if (errorMessage != null) ...[
                          const SizedBox(height: 16),
                          Container(
                            key: const Key('login_error_banner'),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: ShadcnColors.destructiveLight,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: ShadcnColors.destructive.withOpacity(0.3)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline, size: 16, color: ShadcnColors.destructive),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    errorMessage,
                                    style: const TextStyle(color: ShadcnColors.destructive, fontSize: 12),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 20),

                        // Email Field
                        ShadcnInput(
                          textFieldKey: const Key('login_email_input'),
                          controller: _emailController,
                          label: 'Email Address',
                          placeholder: 'admin@kirana.dev',
                          prefixIcon: const Icon(Icons.email_outlined, size: 18, color: ShadcnColors.mutedForeground),
                          keyboardType: TextInputType.emailAddress,
                        ),

                        const SizedBox(height: 14),

                        // Password Field
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Password', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: ShadcnColors.foreground)),
                            const SizedBox(height: 6),
                            Container(
                              height: 44,
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              decoration: BoxDecoration(
                                color: ShadcnColors.surface,
                                borderRadius: BorderRadius.circular(8.0),
                                border: Border.all(color: ShadcnColors.border),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.lock_outline, size: 18, color: ShadcnColors.mutedForeground),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: TextField(
                                      key: const Key('login_password_input'),
                                      controller: _passwordController,
                                      obscureText: _obscurePassword,
                                      style: ShadcnTypography.bodyMedium,
                                      decoration: const InputDecoration(
                                        hintText: '••••••••••••',
                                        border: InputBorder.none,
                                        isDense: true,
                                        contentPadding: EdgeInsets.zero,
                                      ),
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () => setState(() => _obscurePassword = !_obscurePassword),
                                    child: Icon(
                                      _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                      size: 18,
                                      color: ShadcnColors.mutedForeground,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 20),

                        // Login Action Button
                        ShadcnButton(
                          key: const Key('login_submit_btn'),
                          text: 'Sign In to Register',
                          size: ShadcnButtonSize.lg,
                          variant: ShadcnButtonVariant.primary,
                          isLoading: authState.isLoading,
                          isFullWidth: true,
                          leadingIcon: const Icon(Icons.login, size: 18),
                          onPressed: authState.isLoading ? null : _handleLogin,
                        ),

                        const SizedBox(height: 20),
                        const Divider(height: 1, color: ShadcnColors.border),
                        const SizedBox(height: 14),

                        // Quick Demo Fill Credentials
                        const Center(child: Text('Evaluation Demo Accounts', style: ShadcnTypography.caption)),
                        const SizedBox(height: 10),

                        Row(
                          children: [
                            Expanded(
                              child: InkWell(
                                key: const Key('demo_owner_btn'),
                                onTap: () => _fillDemoCredentials(isOwner: true),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: ShadcnColors.secondary,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: ShadcnColors.border),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Store Owner', style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.bold, color: ShadcnColors.primary)),
                                      const SizedBox(height: 2),
                                      const Text('admin@kirana.dev', style: TextStyle(fontSize: 10, color: ShadcnColors.mutedForeground), overflow: TextOverflow.ellipsis),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: InkWell(
                                key: const Key('demo_cashier_btn'),
                                onTap: () => _fillDemoCredentials(isOwner: false),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: ShadcnColors.secondary,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: ShadcnColors.border),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Cashier (POS Only)', style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.bold, color: ShadcnColors.info)),
                                      const SizedBox(height: 2),
                                      const Text('cashier@kirana.dev', style: TextStyle(fontSize: 10, color: ShadcnColors.mutedForeground), overflow: TextOverflow.ellipsis),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        InkWell(
                          key: const Key('demo_restaurant_btn'),
                          onTap: () => _fillDemoCredentials(isOwner: true, isRestaurant: true),
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: ShadcnColors.secondary,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: ShadcnColors.border),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.restaurant, size: 16, color: ShadcnColors.warning),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Restaurant & Cafe (Tables & KDS)', style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.bold, color: ShadcnColors.warning)),
                                      const SizedBox(height: 2),
                                      const Text('cafe@kirana.dev (Password@123)', style: TextStyle(fontSize: 10, color: ShadcnColors.mutedForeground)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Register New Store Button
                  Center(
                    child: TextButton.icon(
                      key: const Key('mobile_register_store_btn'),
                      onPressed: _showRegisterBottomSheet,
                      icon: const Icon(Icons.add_business_outlined, size: 16, color: ShadcnColors.foreground),
                      label: const Text(
                        'New Merchant? Register Store',
                        style: TextStyle(color: ShadcnColors.foreground, fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
