class MembershipSummary {
  final String tenantId;
  final String tenantName;
  final String? branchId;
  final String role;
  final List<String> roles;
  final List<String> permissions;
  final bool isOwner;
  final String businessType;
  final List<String> enabledModules;

  const MembershipSummary({
    required this.tenantId,
    required this.tenantName,
    this.branchId,
    required this.role,
    this.roles = const [],
    this.permissions = const [],
    this.isOwner = false,
    this.businessType = 'grocery',
    this.enabledModules = const ['pos', 'inventory', 'khata', 'gst', 'shifts', 'invoices'],
  });

  factory MembershipSummary.fromJson(Map<String, dynamic> json) {
    return MembershipSummary(
      tenantId: json['tenantId'] as String? ?? '',
      tenantName: json['tenantName'] as String? ?? 'Kirana Supermart',
      branchId: json['branchId'] as String?,
      role: json['role'] as String? ?? 'cashier',
      roles: (json['roles'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      permissions: (json['permissions'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      isOwner: json['isOwner'] as bool? ?? false,
      businessType: json['businessType'] as String? ?? 'grocery',
      enabledModules: (json['enabledModules'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          const ['pos', 'inventory', 'khata', 'gst', 'shifts', 'invoices'],
    );
  }

  Map<String, dynamic> toJson() => {
    'tenantId': tenantId,
    'tenantName': tenantName,
    'branchId': branchId,
    'role': role,
    'roles': roles,
    'permissions': permissions,
    'isOwner': isOwner,
    'businessType': businessType,
    'enabledModules': enabledModules,
  };

  bool get canAccessAdmin => isOwner || role == 'owner' || role == 'branch_manager' || role == 'accountant';
  bool get canAccessPos => isOwner || role == 'owner' || role == 'cashier' || role == 'branch_manager';
  bool get isCashierOnly => role == 'cashier' && !isOwner;

  bool get hasRestaurantModule => enabledModules.contains('restaurant') || businessType == 'restaurant';
  bool get hasKhataModule => enabledModules.contains('khata');
  bool get hasInventoryModule => enabledModules.contains('inventory');
}

class AuthUser {
  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final List<MembershipSummary> memberships;

  const AuthUser({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    this.memberships = const [],
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final membershipsList = (json['memberships'] as List<dynamic>?)
            ?.map((e) => MembershipSummary.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return AuthUser(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      fullName: json['fullName'] as String? ?? 'Store Cashier',
      phone: json['phone'] as String?,
      memberships: membershipsList,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'fullName': fullName,
    'phone': phone,
    'memberships': memberships.map((m) => m.toJson()).toList(),
  };

  MembershipSummary? get primaryMembership => memberships.isNotEmpty ? memberships.first : null;
}

