import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/restaurant_provider.dart';
import '../../core/providers/sync_provider.dart';
import '../../core/theme/shadcn_colors.dart';
import '../../core/theme/shadcn_typography.dart';
import '../../core/widgets/shadcn_badge.dart';
import '../../core/widgets/shadcn_button.dart';
import '../../core/widgets/shadcn_input.dart';

class StoreSettingsSheet extends ConsumerStatefulWidget {
  const StoreSettingsSheet({super.key});

  @override
  ConsumerState<StoreSettingsSheet> createState() => _StoreSettingsSheetState();
}

class _StoreSettingsSheetState extends ConsumerState<StoreSettingsSheet> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _taglineController;
  late TextEditingController _phoneController;
  late TextEditingController _gstinController;
  late TextEditingController _fssaiController;
  late TextEditingController _stateCodeController;
  late TextEditingController _address1Controller;
  late TextEditingController _address2Controller;
  late TextEditingController _cityController;
  late TextEditingController _postalCodeController;
  late TextEditingController _footer1Controller;
  late TextEditingController _footer2Controller;
  late TextEditingController _upiIdController;

  bool _isSaving = false;
  bool _chargeGst = true;
  String? _errorMessage;

  static const Map<String, String> _indianStates = {
    '01': '01 - Jammu & Kashmir',
    '02': '02 - Himachal Pradesh',
    '03': '03 - Punjab',
    '04': '04 - Chandigarh',
    '05': '05 - Uttarakhand',
    '06': '06 - Haryana',
    '07': '07 - Delhi',
    '08': '08 - Rajasthan',
    '09': '09 - Uttar Pradesh',
    '10': '10 - Bihar',
    '11': '11 - Sikkim',
    '12': '12 - Arunachal Pradesh',
    '13': '13 - Nagaland',
    '14': '14 - Manipur',
    '15': '15 - Mizoram',
    '16': '16 - Tripura',
    '17': '17 - Meghalaya',
    '18': '18 - Assam',
    '19': '19 - West Bengal',
    '20': '20 - Jharkhand',
    '21': '21 - Odisha',
    '22': '22 - Chhattisgarh',
    '23': '23 - Madhya Pradesh',
    '24': '24 - Gujarat',
    '26': '26 - Dadra & Nagar Haveli and Daman & Diu',
    '27': '27 - Maharashtra',
    '29': '29 - Karnataka',
    '30': '30 - Goa',
    '31': '31 - Lakshadweep',
    '32': '32 - Kerala',
    '33': '33 - Tamil Nadu',
    '34': '34 - Puducherry',
    '35': '35 - Andaman & Nicobar',
    '36': '36 - Telangana',
    '37': '37 - Andhra Pradesh',
    '38': '38 - Ladakh',
  };

  @override
  void initState() {
    super.initState();
    final auth = ref.read(authProvider);
    final rest = ref.read(restaurantProvider);
    final details = auth.branchDetails;

    _nameController = TextEditingController(
      text: rest.storeName.isNotEmpty
          ? rest.storeName
          : (details?['name'] as String? ?? auth.activeMembership?.tenantName ?? ''),
    );
    _taglineController = TextEditingController(text: rest.storeTagline);
    _phoneController = TextEditingController(text: rest.storePhone);
    _gstinController = TextEditingController(
      text: rest.storeGstin.isNotEmpty ? rest.storeGstin : (details?['gstin'] as String? ?? ''),
    );
    _fssaiController = TextEditingController(text: rest.storeFssai);
    _stateCodeController = TextEditingController(
      text: details?['stateCode'] as String? ?? '27',
    );
    _address1Controller = TextEditingController(
      text: (details?['addressLine1'] as String? ?? '').isNotEmpty
          ? details!['addressLine1'] as String
          : rest.storeAddress,
    );
    _address2Controller = TextEditingController(
      text: details?['addressLine2'] as String? ?? '',
    );
    _cityController = TextEditingController(
      text: details?['city'] as String? ?? '',
    );
    _postalCodeController = TextEditingController(
      text: details?['postalCode'] as String? ?? '',
    );
    _footer1Controller = TextEditingController(text: rest.receiptFooterLine1);
    _footer2Controller = TextEditingController(text: rest.receiptFooterLine2);
    _upiIdController = TextEditingController(text: rest.upiId);
    _chargeGst = rest.isGstEnabled;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _taglineController.dispose();
    _phoneController.dispose();
    _gstinController.dispose();
    _fssaiController.dispose();
    _stateCodeController.dispose();
    _address1Controller.dispose();
    _address2Controller.dispose();
    _cityController.dispose();
    _postalCodeController.dispose();
    _footer1Controller.dispose();
    _footer2Controller.dispose();
    _upiIdController.dispose();
    super.dispose();
  }

  bool get _isGstinValid {
    final g = _gstinController.text.trim().toUpperCase();
    if (g.isEmpty) return false;
    return RegExp(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$').hasMatch(g);
  }

  Future<void> _handleSave() async {
    setState(() {
      _errorMessage = null;
    });

    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() {
        _errorMessage = 'Store name cannot be empty.';
      });
      return;
    }

    final rawGstin = _gstinController.text.trim().toUpperCase();
    String? stateCode = _stateCodeController.text.trim();

    if (rawGstin.isNotEmpty) {
      if (!_isGstinValid) {
        setState(() {
          _errorMessage = 'Invalid 15-character GSTIN format (e.g. 27AABCU9603R1ZM).';
        });
        return;
      }
      final gstinPrefix = rawGstin.substring(0, 2);
      if (stateCode.isEmpty) {
        stateCode = gstinPrefix;
      } else if (stateCode != gstinPrefix) {
        setState(() {
          _errorMessage = 'State code ($stateCode) does not match GSTIN prefix ($gstinPrefix).';
        });
        return;
      }
    }

    setState(() {
      _isSaving = true;
    });

    try {
      await ref.read(authProvider.notifier).updateStoreProfile(
            name: name,
            gstin: rawGstin.isNotEmpty ? rawGstin : null,
            stateCode: stateCode.isNotEmpty ? stateCode : null,
            addressLine1: _address1Controller.text.trim(),
            addressLine2: _address2Controller.text.trim(),
            city: _cityController.text.trim(),
            postalCode: _postalCodeController.text.trim(),
          );

      // Save restaurant dining GST preference & customizable receipt header/footer
      await ref.read(restaurantProvider.notifier).setGstEnabled(_chargeGst);
      final combinedAddress = [
        _address1Controller.text.trim(),
        _address2Controller.text.trim(),
        _cityController.text.trim(),
        _postalCodeController.text.trim(),
      ].where((s) => s.isNotEmpty).join(', ');

      await ref.read(restaurantProvider.notifier).updateReceiptProfile(
            storeName: name,
            storeTagline: _taglineController.text.trim(),
            storePhone: _phoneController.text.trim(),
            storeGstin: rawGstin,
            storeFssai: _fssaiController.text.trim(),
            storeAddress: combinedAddress,
            receiptFooterLine1: _footer1Controller.text.trim(),
            receiptFooterLine2: _footer2Controller.text.trim(),
            upiId: _upiIdController.text.trim(),
          );

      // Trigger background sync to refresh state
      ref.read(syncStateProvider.notifier).syncNow();

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Store settings and GSTIN updated successfully!'),
            backgroundColor: ShadcnColors.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.90,
      ),
      margin: EdgeInsets.only(bottom: bottomInset),
      decoration: const BoxDecoration(
        color: ShadcnColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(
          top: BorderSide(color: ShadcnColors.border, width: 1.0),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: ShadcnColors.border, width: 1.0)),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: ShadcnColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.storefront_outlined,
                    color: ShadcnColors.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Store & Branch Settings', style: ShadcnTypography.h3),
                      const SizedBox(height: 2),
                      Text(
                        'Details printed on tax invoices, KOTs, and receipts',
                        style: ShadcnTypography.caption,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20, color: ShadcnColors.mutedForeground),
                  onPressed: () => Navigator.pop(context),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
              ],
            ),
          ),

          // Form Body
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: ShadcnColors.destructiveLight,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: ShadcnColors.destructive.withOpacity(0.4)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, size: 16, color: ShadcnColors.destructive),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: ShadcnTypography.caption.copyWith(
                                  color: ShadcnColors.destructive,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Store Trading Name
                    ShadcnInput(
                      controller: _nameController,
                      label: 'Store / Cafe Name *',
                      placeholder: 'e.g. Spice Garden Cafe',
                      prefixIcon: const Icon(Icons.business_outlined, size: 16, color: ShadcnColors.mutedForeground),
                    ),
                    const SizedBox(height: 16),

                    // Tagline & Phone
                    ShadcnInput(
                      controller: _taglineController,
                      label: 'Tagline / Subtitle (Optional)',
                      placeholder: 'e.g. Fresh Coffee & Snacks',
                    ),
                    const SizedBox(height: 16),

                    ShadcnInput(
                      controller: _phoneController,
                      label: 'Store Phone Number (Optional)',
                      placeholder: 'e.g. +91 98765 43210',
                      keyboardType: TextInputType.phone,
                      prefixIcon: const Icon(Icons.phone_outlined, size: 16, color: ShadcnColors.mutedForeground),
                    ),
                    const SizedBox(height: 16),

                    // GSTIN Registration
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('GSTIN Registration', style: ShadcnTypography.bodySemibold),
                        ShadcnBadge(
                          text: _isGstinValid
                              ? 'Registered'
                              : (_gstinController.text.trim().isEmpty ? 'Unregistered' : 'Invalid Format'),
                          variant: _isGstinValid
                              ? ShadcnBadgeVariant.success
                              : (_gstinController.text.trim().isEmpty
                                  ? ShadcnBadgeVariant.secondary
                                  : ShadcnBadgeVariant.destructive),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ShadcnInput(
                      controller: _gstinController,
                      placeholder: 'e.g. 27AABCU9603R1ZM (15 chars)',
                      prefixIcon: const Icon(Icons.shield_outlined, size: 16, color: ShadcnColors.mutedForeground),
                      onChanged: (val) {
                        setState(() {
                          final upper = val.toUpperCase();
                          if (upper.length >= 2 && RegExp(r'^\d{2}').hasMatch(upper)) {
                            _stateCodeController.text = upper.substring(0, 2);
                          }
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    // State Code Selector
                    Text('State Code (GST Jurisdiction)', style: ShadcnTypography.bodySemibold),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: ShadcnColors.surface,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: ShadcnColors.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _indianStates.containsKey(_stateCodeController.text)
                              ? _stateCodeController.text
                              : '27',
                          isExpanded: true,
                          dropdownColor: ShadcnColors.surface,
                          items: _indianStates.entries.map((e) {
                            return DropdownMenuItem(
                              value: e.key,
                              child: Text(e.value, style: ShadcnTypography.body),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setState(() {
                                _stateCodeController.text = val;
                              });
                            }
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Restaurant GST Toggle Switch
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: ShadcnColors.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: ShadcnColors.border),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text('Charge Restaurant GST', style: ShadcnTypography.bodySemibold),
                                    const SizedBox(width: 8),
                                    ShadcnBadge(
                                      text: _chargeGst ? '5.00%' : '0% Off',
                                      variant: _chargeGst ? ShadcnBadgeVariant.success : ShadcnBadgeVariant.secondary,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _chargeGst
                                      ? '5% GST will be added on dine-in food orders, bills, and tax invoices.'
                                      : 'Turn OFF if you are an unregistered eatery (<₹20L turnover). No GST will be added on orders.',
                                  style: ShadcnTypography.caption,
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: _chargeGst,
                            activeColor: ShadcnColors.primary,
                            onChanged: (val) {
                              setState(() {
                                _chargeGst = val;
                              });
                              ref.read(restaurantProvider.notifier).setGstEnabled(val);
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Address Line 1
                    ShadcnInput(
                      controller: _address1Controller,
                      label: 'Address Line 1',
                      placeholder: 'e.g. Shop 4, Market Complex',
                      prefixIcon: const Icon(Icons.location_on_outlined, size: 16, color: ShadcnColors.mutedForeground),
                    ),
                    const SizedBox(height: 16),

                    // Address Line 2
                    ShadcnInput(
                      controller: _address2Controller,
                      label: 'Address Line 2 (Optional)',
                      placeholder: 'e.g. Near Railway Station',
                    ),
                    const SizedBox(height: 16),

                    // City and Pincode
                    Row(
                      children: [
                        Expanded(
                          child: ShadcnInput(
                            controller: _cityController,
                            label: 'City',
                            placeholder: 'e.g. Mumbai',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ShadcnInput(
                            controller: _postalCodeController,
                            label: 'Pincode',
                            placeholder: 'e.g. 400058',
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    ShadcnInput(
                      controller: _fssaiController,
                      label: 'FSSAI License No. (Optional)',
                      placeholder: 'Leave blank if not applicable',
                    ),
                    const SizedBox(height: 16),

                    ShadcnInput(
                      controller: _upiIdController,
                      label: 'UPI ID for Bill QR (Optional)',
                      placeholder: 'e.g. mycafe@okicici',
                    ),
                    const SizedBox(height: 16),

                    // Customizable Bill Footer
                    ShadcnInput(
                      controller: _footer1Controller,
                      label: 'Bill Footer Line 1 (Greeting)',
                      placeholder: 'e.g. Thank You! Visit Again!',
                    ),
                    const SizedBox(height: 16),

                    ShadcnInput(
                      controller: _footer2Controller,
                      label: 'Bill Footer Line 2 (Custom Note / Terms)',
                      placeholder: 'Leave blank to hide second footer line',
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Bottom Action Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: ShadcnColors.surface,
              border: Border(top: BorderSide(color: ShadcnColors.border, width: 1.0)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: ShadcnButton(
                    text: 'Cancel',
                    variant: ShadcnButtonVariant.outline,
                    onPressed: _isSaving ? null : () => Navigator.pop(context),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ShadcnButton(
                    text: _isSaving ? 'Saving...' : 'Save Settings',
                    onPressed: _isSaving ? null : _handleSave,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

