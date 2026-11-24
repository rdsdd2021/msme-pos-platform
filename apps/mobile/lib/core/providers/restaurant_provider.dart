import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/cart_item.dart';
import '../models/product.dart';
import '../repositories/local_restaurant_repository.dart';
import 'auth_provider.dart';
import 'sync_provider.dart';

final localRestaurantRepoProvider = Provider<LocalRestaurantRepository>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return LocalRestaurantRepository(db);
});

enum TableStatus {
  vacant,
  seated,
  ordered,
  billed,
  dirty;

  String get label {
    switch (this) {
      case TableStatus.vacant:
        return 'Vacant';
      case TableStatus.seated:
        return 'Seated';
      case TableStatus.ordered:
        return 'Ordered';
      case TableStatus.billed:
        return 'Billed';
      case TableStatus.dirty:
        return 'Needs Cleaning';
    }
  }

  bool get isOccupied => this != TableStatus.vacant && this != TableStatus.dirty;
}

class RestaurantTable {
  final String id;
  final String? tableNumber;
  final String name;
  final String section;
  final int capacity;
  final int currentGuestCount;
  final TableStatus status;
  final List<CartItem> activeOrderLines;
  final List<CartItem> confirmedLines;
  final int confirmedItemCount;
  final DateTime? seatedAt;
  final String? captainNotes;

  const RestaurantTable({
    required this.id,
    this.tableNumber,
    required this.name,
    this.section = 'Main Dining',
    this.capacity = 4,
    this.currentGuestCount = 2,
    this.status = TableStatus.vacant,
    this.activeOrderLines = const [],
    this.confirmedLines = const [],
    this.confirmedItemCount = 0,
    this.seatedAt,
    this.captainNotes,
  });

  int get subtotalPaisa => activeOrderLines.fold(0, (sum, i) => sum + i.subtotalPaisa);
  int get runningTotalPaisa => activeOrderLines.fold(0, (sum, i) => sum + i.totalPaisa);
  int get itemCount => activeOrderLines.fold(0, (sum, i) => sum + i.quantity);

  List<CartItem> get newDeltaLines {
    if (activeOrderLines.isEmpty) return const [];
    if (confirmedLines.isEmpty) return activeOrderLines;

    final Map<String, int> confirmedQtyMap = {};
    for (final c in confirmedLines) {
      final key = '${c.lineKey}_${c.notes ?? ""}';
      confirmedQtyMap[key] = (confirmedQtyMap[key] ?? 0) + c.quantity;
    }

    final List<CartItem> delta = [];
    for (final active in activeOrderLines) {
      final key = '${active.lineKey}_${active.notes ?? ""}';
      final confirmedQty = confirmedQtyMap[key] ?? 0;
      final deltaQty = active.quantity - confirmedQty;
      if (deltaQty > 0) {
        delta.add(active.copyWith(quantity: deltaQty));
      }
    }
    return delta;
  }

  bool get hasNewItems {
    if (activeOrderLines.isEmpty) return false;
    if (newDeltaLines.isNotEmpty) return true;
    return itemCount > confirmedItemCount;
  }

  int get newItemsCount {
    if (newDeltaLines.isNotEmpty) {
      return newDeltaLines.fold<int>(0, (sum, i) => sum + i.quantity);
    }
    final diff = itemCount - confirmedItemCount;
    return diff > 0 ? diff : 0;
  }

  RestaurantTable copyWith({
    String? id,
    String? tableNumber,
    String? name,
    String? section,
    int? capacity,
    int? currentGuestCount,
    TableStatus? status,
    List<CartItem>? activeOrderLines,
    List<CartItem>? confirmedLines,
    int? confirmedItemCount,
    DateTime? seatedAt,
    String? captainNotes,
  }) {
    return RestaurantTable(
      id: id ?? this.id,
      tableNumber: tableNumber ?? this.tableNumber,
      name: name ?? this.name,
      section: section ?? this.section,
      capacity: capacity ?? this.capacity,
      currentGuestCount: currentGuestCount ?? this.currentGuestCount,
      status: status ?? this.status,
      activeOrderLines: activeOrderLines ?? this.activeOrderLines,
      confirmedLines: confirmedLines ?? this.confirmedLines,
      confirmedItemCount: confirmedItemCount ?? this.confirmedItemCount,
      seatedAt: seatedAt ?? this.seatedAt,
      captainNotes: captainNotes ?? this.captainNotes,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tableNumber': tableNumber ?? id,
      'name': name,
      'section': section,
      'capacity': capacity,
      'currentGuestCount': currentGuestCount,
      'status': status.name,
      'confirmedItemCount': confirmedItemCount,
      'seatedAt': seatedAt?.toIso8601String(),
      'captainNotes': captainNotes,
      'activeOrderLines': activeOrderLines.map((line) => {
        'quantity': line.quantity,
        'notes': line.notes,
        'variantName': line.variantName,
        'variantPricePaisa': line.variantPricePaisa,
        'product': {
          'id': line.product.id,
          'name': line.product.name,
          'sku': line.product.sku,
          'barcode': line.product.barcode,
          'category': line.product.category,
          'unit': line.product.unit,
          'sellingPricePaisa': line.product.sellingPricePaisa,
          'purchaseCostPaisa': line.product.purchaseCostPaisa,
          'gstRate': line.product.gstRate,
          'currentStock': line.product.currentStock,
          'hsnCode': line.product.hsnCode,
          'imageUrl': line.product.imageUrl,
          'foodType': line.product.foodType,
          'kitchenStation': line.product.kitchenStation,
          'prepTimeMinutes': line.product.prepTimeMinutes,
          'isAvailable': line.product.isAvailable,
          'isMadeToOrder': line.product.isMadeToOrder,
          'variants': line.product.variants?.map((v) => v.toJson()).toList(),
        },
      }).toList(),
    };
  }

  static RestaurantTable fromJson(Map<String, dynamic> json, {bool isGstEnabled = true}) {
    TableStatus parsedStatus;
    try {
      final statusStr = (json['status'] as String? ?? '').toLowerCase();
      if (statusStr == 'occupied') {
        parsedStatus = TableStatus.seated;
      } else {
        parsedStatus = TableStatus.values.byName(statusStr);
      }
    } catch (_) {
      parsedStatus = TableStatus.vacant;
    }

    final rawLines = json['activeOrderLines'] as List<dynamic>? ?? [];
    final lines = rawLines.map((l) {
      final lineMap = l as Map<String, dynamic>;
      final pMap = lineMap['product'] as Map<String, dynamic>;
      List<ProductVariant>? variants;
      if (pMap['variants'] != null) {
        try {
          variants = (pMap['variants'] as List<dynamic>)
              .map((v) => ProductVariant.fromJson(v as Map<String, dynamic>))
              .toList();
        } catch (_) {}
      }
      final rawGst = pMap['gstRate'] as int? ?? 5;
      final productGst = isGstEnabled ? rawGst : 0;
      final product = Product(
        id: pMap['id'] as String,
        name: pMap['name'] as String,
        sku: pMap['sku'] as String? ?? '',
        barcode: pMap['barcode'] as String?,
        category: pMap['category'] as String? ?? 'General',
        unit: pMap['unit'] as String? ?? 'PCS',
        sellingPricePaisa: pMap['sellingPricePaisa'] as int? ?? 0,
        purchaseCostPaisa: pMap['purchaseCostPaisa'] as int? ?? 0,
        gstRate: productGst,
        currentStock: (pMap['currentStock'] as num?)?.toDouble() ?? 100.0,
        hsnCode: pMap['hsnCode'] as String?,
        imageUrl: pMap['imageUrl'] as String?,
        foodType: pMap['foodType'] as String?,
        kitchenStation: pMap['kitchenStation'] as String?,
        prepTimeMinutes: pMap['prepTimeMinutes'] as int?,
        isAvailable: pMap['isAvailable'] as bool? ?? true,
        isMadeToOrder: pMap['isMadeToOrder'] as bool? ?? false,
        variants: variants,
      );
      return CartItem(
        product: product,
        quantity: lineMap['quantity'] as int? ?? 1,
        notes: lineMap['notes'] as String?,
        variantName: lineMap['variantName'] as String?,
        variantPricePaisa: lineMap['variantPricePaisa'] as int?,
      );
    }).toList();

    return RestaurantTable(
      id: json['id'] as String,
      tableNumber: json['tableNumber'] as String? ?? json['id'] as String?,
      name: json['name'] as String,
      section: json['section'] as String? ?? 'Main Dining',
      capacity: json['capacity'] as int? ?? 4,
      currentGuestCount: json['currentGuestCount'] as int? ?? 2,
      status: parsedStatus,
      confirmedItemCount: json['confirmedItemCount'] as int? ?? 0,
      seatedAt: json['seatedAt'] != null ? DateTime.tryParse(json['seatedAt'] as String) : null,
      captainNotes: json['captainNotes'] as String?,
      activeOrderLines: lines,
    );
  }
}

class RestaurantState {
  final List<RestaurantTable> tables;
  final String selectedSection;
  final bool isGstEnabled;
  final double defaultGstPercent;

  const RestaurantState({
    required this.tables,
    this.selectedSection = 'All',
    this.isGstEnabled = true,
    this.defaultGstPercent = 5.0,
  });

  List<String> get sections {
    final s = <String>{'All'};
    for (final t in tables) {
      s.add(t.section);
    }
    return s.toList();
  }

  List<RestaurantTable> get filteredTables {
    if (selectedSection == 'All') return tables;
    return tables.where((t) => t.section == selectedSection).toList();
  }

  int get occupiedCount => tables.where((t) => t.status != TableStatus.vacant && t.status != TableStatus.dirty).length;
  int get activeDinersCount => tables
      .where((t) => t.status.isOccupied || t.status == TableStatus.billed)
      .fold(0, (sum, t) => sum + t.currentGuestCount);
  int get totalDineInRunningPaisa => tables.fold(0, (sum, t) => sum + (isGstEnabled ? t.runningTotalPaisa : t.subtotalPaisa));

  RestaurantState copyWith({
    List<RestaurantTable>? tables,
    String? selectedSection,
    bool? isGstEnabled,
    double? defaultGstPercent,
  }) {
    return RestaurantState(
      tables: tables ?? this.tables,
      selectedSection: selectedSection ?? this.selectedSection,
      isGstEnabled: isGstEnabled ?? this.isGstEnabled,
      defaultGstPercent: defaultGstPercent ?? this.defaultGstPercent,
    );
  }
}

class RestaurantNotifier extends StateNotifier<RestaurantState> {
  final LocalRestaurantRepository? _repo;
  final Ref? _ref;

  String _getStorageKey() {
    final tenantId = _ref?.read(authProvider).activeMembership?.tenantId;
    if (tenantId != null && tenantId.isNotEmpty) {
      return 'cached_restaurant_tables_${tenantId}_v2';
    }
    return 'cached_restaurant_tables_default_v2';
  }

  static final List<RestaurantTable> _defaultTables = [
    // Main Dining (8 tables)
    const RestaurantTable(id: 'T-01', tableNumber: 'T-01', name: 'Table 1', section: 'Main Dining', capacity: 2),
    const RestaurantTable(id: 'T-02', tableNumber: 'T-02', name: 'Table 2', section: 'Main Dining', capacity: 4),
    const RestaurantTable(id: 'T-03', tableNumber: 'T-03', name: 'Table 3', section: 'Main Dining', capacity: 4),
    const RestaurantTable(id: 'T-04', tableNumber: 'T-04', name: 'Table 4 (Window)', section: 'Main Dining', capacity: 4),
    const RestaurantTable(id: 'T-05', tableNumber: 'T-05', name: 'Table 5 (Corner)', section: 'Main Dining', capacity: 6),
    const RestaurantTable(id: 'T-06', tableNumber: 'T-06', name: 'Table 6', section: 'Main Dining', capacity: 6),
    const RestaurantTable(id: 'T-07', tableNumber: 'T-07', name: 'Table 7', section: 'Main Dining', capacity: 8),
    const RestaurantTable(id: 'T-08', tableNumber: 'T-08', name: 'Table 8', section: 'Main Dining', capacity: 2),
    // AC Hall (4 tables)
    const RestaurantTable(id: 'AC-01', tableNumber: 'AC-01', name: 'AC Table 1', section: 'AC Hall', capacity: 4),
    const RestaurantTable(id: 'AC-02', tableNumber: 'AC-02', name: 'AC Table 2', section: 'AC Hall', capacity: 4),
    const RestaurantTable(id: 'AC-03', tableNumber: 'AC-03', name: 'AC Table 3', section: 'AC Hall', capacity: 6),
    const RestaurantTable(id: 'AC-04', tableNumber: 'AC-04', name: 'AC Table 4', section: 'AC Hall', capacity: 8),
    // Terrace (2 tables)
    const RestaurantTable(id: 'TR-01', tableNumber: 'TR-01', name: 'Terrace 1', section: 'Terrace', capacity: 4),
    const RestaurantTable(id: 'TR-02', tableNumber: 'TR-02', name: 'Terrace 2', section: 'Terrace', capacity: 4),
    // Takeaway / Delivery Counters (2 counters)
    const RestaurantTable(id: 'TAK-01', tableNumber: 'TAK-01', name: 'Takeaway Counter 1', section: 'Takeaway', capacity: 1),
    const RestaurantTable(id: 'TAK-02', tableNumber: 'TAK-02', name: 'Takeaway Counter 2', section: 'Takeaway', capacity: 1),
  ];

  RestaurantNotifier([this._repo, this._ref]) : super(RestaurantState(tables: _defaultTables)) {
    if (_repo != null) {
      _initFromRepo();
    } else {
      _loadFromCache();
    }
  }

  void _initFromRepo() {
    _loadFromCache();
    refreshFromDb();
    fetchDiningSettings();
  }

  Future<void> refreshFromDb() async {
    try {
      final auth = _ref?.read(authProvider);
      final tenantId = auth?.activeMembership?.tenantId;
      final branchId = auth?.activeBranchId;
      final dbTables = await _repo?.getAllTables(tenantId: tenantId, branchId: branchId);
      if (dbTables != null && dbTables.isNotEmpty) {
        await _syncTablesFromDb(dbTables);
      }
    } catch (_) {}
  }

  Future<void> _syncTablesFromDb(List<dynamic> dbTables) async {
    final currentById = {for (final t in state.tables) t.id: t};
    final currentByNumber = {for (final t in state.tables) if (t.tableNumber != null) t.tableNumber!: t};
    final currentByName = {for (final t in state.tables) t.name: t};

    final List<RestaurantTable> merged = [];
    for (final tbl in dbTables) {
      final tblId = tbl.id as String;
      final existing = currentById[tblId] ?? currentByNumber[tbl.tableNumber] ?? currentByName[tbl.name ?? ''] ?? currentByName[tbl.tableNumber];

      TableStatus parsedStatus;
      try {
        final s = (tbl.status as String? ?? '').toLowerCase();
        if (s == 'occupied') {
          parsedStatus = TableStatus.seated;
        } else {
          parsedStatus = TableStatus.values.byName(s);
        }
      } catch (_) {
        parsedStatus = TableStatus.vacant;
      }

      List<CartItem> activeLines;
      List<CartItem> confirmedLines;
      int confirmedCount;

      // If the table is vacant or dirty in SQLite, BUT the waiter currently has active uncommitted draft items in memory on this device,
      // we must preserve those draft lines. Otherwise, if there are no uncommitted draft lines, accept the vacant state.
      final hasLocalDraft = existing != null && existing.newDeltaLines.isNotEmpty;

      if ((parsedStatus == TableStatus.vacant || parsedStatus == TableStatus.dirty) && !hasLocalDraft) {
        // Table is legitimately vacant or dirty with no active local order: reset active lines and confirmed count
        activeLines = const [];
        confirmedLines = const [];
        confirmedCount = 0;
      } else {
        if (hasLocalDraft && (parsedStatus == TableStatus.vacant || parsedStatus == TableStatus.dirty)) {
          parsedStatus = existing?.status == TableStatus.ordered ? TableStatus.ordered : TableStatus.seated;
        }

        // Query committed lines from local SQLite (populated by sync pull or local KOT outbox)
        final auth = _ref?.read(authProvider);
        final tenantId = auth?.activeMembership?.tenantId;
        final branchId = auth?.activeBranchId;
        final dbLines = await _repo?.getTableActiveCartItems(tblId, tenantId: tenantId, branchId: branchId, isGstEnabled: state.isGstEnabled) ?? [];
        if (dbLines.isNotEmpty) {
          activeLines = dbLines;
          confirmedLines = dbLines;
          confirmedCount = dbLines.fold<int>(0, (sum, i) => sum + i.quantity);

          // If waiter has uncommitted local draft items added in-memory, accurately preserve the delta
          if (existing != null && existing.hasNewItems) {
            final committedMap = <String, int>{};
            for (final l in dbLines) {
              final k = '${l.lineKey}_${l.notes ?? ""}';
              committedMap[k] = (committedMap[k] ?? 0) + l.quantity;
            }
            final uncommittedLines = <CartItem>[];
            for (final localLine in existing.activeOrderLines) {
              final k = '${localLine.lineKey}_${localLine.notes ?? ""}';
              final committedQty = committedMap[k] ?? 0;
              final diff = localLine.quantity - committedQty;
              if (diff > 0) {
                uncommittedLines.add(localLine.copyWith(quantity: diff));
              }
            }
            if (uncommittedLines.isNotEmpty) {
              activeLines = [...dbLines, ...uncommittedLines];
            }
          }
        } else {
          activeLines = existing?.activeOrderLines ?? [];
          confirmedLines = existing?.confirmedLines ?? [];
          final isFired = parsedStatus == TableStatus.ordered || parsedStatus == TableStatus.billed;
          confirmedCount = existing?.confirmedItemCount ??
              (isFired ? activeLines.fold<int>(0, (sum, i) => sum + i.quantity) : 0);
          if (isFired && confirmedLines.isEmpty) {
            confirmedLines = activeLines;
          }
        }
      }

      merged.add(
        RestaurantTable(
          id: tblId,
          tableNumber: tbl.tableNumber ?? existing?.tableNumber ?? tblId,
          name: tbl.name ?? tbl.tableNumber ?? existing?.name ?? 'Table',
          section: tbl.section ?? existing?.section ?? 'Main Dining',
          capacity: tbl.seatingCapacity ?? existing?.capacity ?? 4,
          currentGuestCount: tbl.currentGuestCount > 0 ? tbl.currentGuestCount : (existing?.currentGuestCount ?? 2),
          status: parsedStatus,
          activeOrderLines: activeLines,
          confirmedLines: confirmedLines,
          confirmedItemCount: confirmedCount,
          seatedAt: tbl.occupiedAt ?? existing?.seatedAt,
          captainNotes: existing?.captainNotes,
        ),
      );
    }

    state = state.copyWith(tables: merged);
    await _saveToCache();
  }

  Future<void> _loadFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = _getStorageKey();

      final gstKey = '${key}_gst_enabled';
      final gstPercentKey = '${key}_gst_percent';
      final cachedGst = prefs.getBool(gstKey);
      final cachedGstPercent = prefs.getDouble(gstPercentKey);
      bool isGst = true;
      if (cachedGst != null) {
        isGst = cachedGst;
        state = state.copyWith(
          isGstEnabled: cachedGst,
          defaultGstPercent: cachedGstPercent ?? (cachedGst ? 5.0 : 0.0),
        );
      }

      final cachedJson = prefs.getString(key);
      if (cachedJson != null && cachedJson.isNotEmpty) {
        final decoded = jsonDecode(cachedJson) as List<dynamic>;
        final loaded = decoded.map((e) => RestaurantTable.fromJson(e as Map<String, dynamic>, isGstEnabled: isGst)).toList();
        if (loaded.isNotEmpty) {
          // Filter out legacy tables (e.g. 't-1' or 'takeaway-1') so defaults are unified with backend
          final validLoaded = loaded.where((t) => !t.id.startsWith('t-') && t.id != 'takeaway-1' && t.id != 'takeaway-2').toList();
          final loadedCodes = <String>{};
          for (final t in validLoaded) {
            loadedCodes.add(t.id);
            if (t.tableNumber != null && t.tableNumber!.isNotEmpty) {
              loadedCodes.add(t.tableNumber!);
            }
            loadedCodes.add(t.name);
          }
          final missing = _defaultTables.where((t) {
            return !loadedCodes.contains(t.id) &&
                   !loadedCodes.contains(t.tableNumber ?? '') &&
                   !loadedCodes.contains(t.name);
          }).toList();

          final allTables = [...validLoaded, ...missing];
          final sanitizedTables = !isGst
              ? allTables.map((t) {
                  if (t.activeOrderLines.isEmpty) return t;
                  final zeroLines = t.activeOrderLines.map((l) => l.copyWith(product: l.product.copyWith(gstRate: 0))).toList();
                  return t.copyWith(activeOrderLines: zeroLines);
                }).toList()
              : allTables;

          state = state.copyWith(tables: sanitizedTables);
        }
      }
    } catch (_) {}
  }

  /// Fetch authoritative dining and GST settings from cloud backend
  Future<void> fetchDiningSettings() async {
    try {
      final authRepo = _ref?.read(authRepositoryProvider);
      final authState = _ref?.read(authProvider);
      final tenantId = authState?.activeMembership?.tenantId ?? authState?.user?.primaryMembership?.tenantId;
      final branchId = authState?.activeBranchId ?? authState?.activeMembership?.branchId;
      if (authRepo == null || tenantId == null || tenantId.isEmpty) return;

      final res = await authRepo.getRestaurantDiningSettings(tenantId, branchId);
      if (res != null) {
        final enableGst = res['enableGst'] as bool? ?? (res['defaultGstPercent'] != '0.00');
        final percentStr = res['defaultGstPercent'] as String? ?? (enableGst ? '5.00' : '0.00');
        final rate = double.tryParse(percentStr) ?? (enableGst ? 5.0 : 0.0);
        state = state.copyWith(
          isGstEnabled: enableGst,
          defaultGstPercent: rate,
        );

        final prefs = await SharedPreferences.getInstance();
        final key = _getStorageKey();
        await prefs.setBool('${key}_gst_enabled', enableGst);
        await prefs.setDouble('${key}_gst_percent', rate);

        // Sanitize active lines immediately across all tables
        final updatedTables = state.tables.map((t) {
          if (t.activeOrderLines.isEmpty) return t;
          final updatedLines = t.activeOrderLines.map((l) {
            return l.copyWith(
              product: l.product.copyWith(
                gstRate: enableGst ? (l.product.gstRate > 0 ? l.product.gstRate : 5) : 0,
              ),
            );
          }).toList();
          return t.copyWith(activeOrderLines: updatedLines);
        }).toList();

        state = state.copyWith(tables: updatedTables);
      }
    } catch (_) {}
  }

  /// Toggle or update GST active state across local state, cache and cloud
  Future<void> setGstEnabled(bool enabled) async {
    final effectivePercent = enabled ? (state.defaultGstPercent > 0 ? state.defaultGstPercent : 5.0) : 0.0;

    // Update active tables lines' products to reflect new gstRate
    final updatedTables = state.tables.map((t) {
      if (t.activeOrderLines.isEmpty) return t;
      final updatedLines = t.activeOrderLines.map((l) {
        return l.copyWith(
          product: l.product.copyWith(
            gstRate: enabled ? (l.product.gstRate > 0 ? l.product.gstRate : 5) : 0,
          ),
        );
      }).toList();
      return t.copyWith(activeOrderLines: updatedLines);
    }).toList();

    state = state.copyWith(
      tables: updatedTables,
      isGstEnabled: enabled,
      defaultGstPercent: effectivePercent,
    );

    // Save to SharedPreferences
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = _getStorageKey();
      await prefs.setBool('${key}_gst_enabled', enabled);
      await prefs.setDouble('${key}_gst_percent', effectivePercent);
      await _saveToCache();
    } catch (_) {}

    // Synchronize to backend if authenticated
    try {
      final authRepo = _ref?.read(authRepositoryProvider);
      final authState = _ref?.read(authProvider);
      final tenantId = authState?.activeMembership?.tenantId ?? authState?.user?.primaryMembership?.tenantId;
      final branchId = authState?.activeBranchId ?? authState?.activeMembership?.branchId;
      if (authRepo != null && tenantId != null && tenantId.isNotEmpty) {
        await authRepo.updateRestaurantDiningSettings(
          tenantId: tenantId,
          branchId: branchId,
          settings: {
            'enableGst': enabled,
            'defaultGstPercent': enabled ? effectivePercent.toStringAsFixed(2) : '0.00',
          },
        );
      }
    } catch (_) {}
  }

  Future<void> _saveToCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = _getStorageKey();
      final encoded = jsonEncode(state.tables.map((t) => t.toJson()).toList());
      await prefs.setString(key, encoded);
    } catch (_) {}
  }

  /// Completely clears local cache and resets tables to default
  Future<void> resetAndPurgeLocalCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('cached_restaurant_tables_v1');
      await prefs.remove(_getStorageKey());
      final tenantId = _ref?.read(authProvider).activeMembership?.tenantId;
      if (tenantId != null && tenantId.isNotEmpty) {
        await _repo?.clearAllTenantData(tenantId);
      }
      await _repo?.clearAllTablesGlobally();
      state = state.copyWith(tables: _defaultTables);
    } catch (_) {}
  }

  void selectSection(String section) {
    state = state.copyWith(selectedSection: section);
  }

  Future<void> _syncTableStatusToOutbox(String tableId, String status, {int? guestCount}) async {
    try {
      final auth = _ref?.read(authProvider);
      final tenantId = auth?.activeMembership?.tenantId ?? auth?.user?.primaryMembership?.tenantId ?? '';
      final branchId = (auth?.activeBranchId != null && auth!.activeBranchId!.isNotEmpty && auth.activeBranchId != 'branch-1')
          ? auth.activeBranchId!
          : (auth?.activeMembership?.branchId ?? auth?.user?.primaryMembership?.branchId ?? '');
      if (tenantId.isEmpty || _repo == null) return;
      final deviceId = await AppConfig.getDeviceId();
      await _repo!.markTableStatusAtomic(
        tableId: tableId,
        status: status,
        tenantId: tenantId,
        branchId: branchId,
        deviceId: deviceId,
        guestCount: guestCount,
      );
      _ref?.read(syncStateProvider.notifier).syncNow();
    } catch (e) {
      debugPrint('[RestaurantNotifier] Error syncing table status: $e');
    }
  }

  void setGuestCount(String tableId, int count) {
    final valid = count.clamp(1, 20);
    final updated = state.tables.map((t) {
      if (t.id != tableId) return t;
      return t.copyWith(currentGuestCount: valid);
    }).toList();
    state = state.copyWith(tables: updated);
    _saveToCache();
    final currentTable = updated.firstWhere((t) => t.id == tableId, orElse: () => state.tables.first);
    _syncTableStatusToOutbox(tableId, currentTable.status.name, guestCount: valid);
  }

  void setCaptainNotes(String tableId, String notes) {
    final updated = state.tables.map((t) {
      if (t.id != tableId) return t;
      return t.copyWith(captainNotes: notes);
    }).toList();
    state = state.copyWith(tables: updated);
    _saveToCache();
  }

  void addItemToTable(
    String tableId,
    Product product, {
    int qty = 1,
    String? notes,
    String? variantName,
    int? variantPricePaisa,
  }) {
    final effectiveProduct = state.isGstEnabled
        ? product
        : product.copyWith(gstRate: 0);

    final updated = state.tables.map((t) {
      if (t.id != tableId) return t;

      final lines = List<CartItem>.from(t.activeOrderLines);
      final targetKey = variantName != null ? '${effectiveProduct.id}__$variantName' : effectiveProduct.id;
      final idx = lines.indexWhere((l) => l.lineKey == targetKey);

      if (idx >= 0) {
        lines[idx] = lines[idx].copyWith(
          product: effectiveProduct,
          quantity: lines[idx].quantity + qty,
          notes: notes ?? lines[idx].notes,
        );
      } else {
        lines.add(CartItem(
          product: effectiveProduct,
          quantity: qty,
          notes: notes,
          variantName: variantName,
          variantPricePaisa: variantPricePaisa,
        ));
      }

      return t.copyWith(
        activeOrderLines: lines,
        status: t.status == TableStatus.ordered ? TableStatus.ordered : TableStatus.seated,
        seatedAt: t.seatedAt ?? DateTime.now(),
      );
    }).toList();

    state = state.copyWith(tables: updated);
    _saveToCache();
    _syncTableStatusToOutbox(tableId, 'seated');
  }

  void markOrderConfirmed(String tableId) {
    final updated = state.tables.map((t) {
      if (t.id != tableId) return t;
      return t.copyWith(
        status: TableStatus.ordered,
        confirmedLines: t.activeOrderLines,
        confirmedItemCount: t.itemCount,
      );
    }).toList();
    state = state.copyWith(tables: updated);
    _saveToCache();
  }

  void removeItemFromTable(String tableId, String targetKey) {
    final updated = state.tables.map((t) {
      if (t.id != tableId) return t;

      final lines = List<CartItem>.from(t.activeOrderLines);
      final idx = lines.indexWhere((l) => l.lineKey == targetKey || l.product.id == targetKey);

      if (idx >= 0) {
        final lineKeyToMatch = lines[idx].lineKey;
        final confirmedQty = t.confirmedLines
            .where((c) => c.lineKey == lineKeyToMatch || c.product.id == targetKey)
            .fold<int>(0, (sum, c) => sum + c.quantity);

        if (lines[idx].quantity > confirmedQty) {
          if (lines[idx].quantity > 1) {
            lines[idx] = lines[idx].copyWith(quantity: lines[idx].quantity - 1);
          } else {
            lines.removeAt(idx);
          }
        }
      }

      return t.copyWith(
        activeOrderLines: lines,
        status: lines.isEmpty ? TableStatus.vacant : (t.status == TableStatus.ordered ? TableStatus.ordered : TableStatus.seated),
        seatedAt: lines.isEmpty ? null : t.seatedAt,
      );
    }).toList();

    state = state.copyWith(tables: updated);
    _saveToCache();
    if (updated.firstWhere((t) => t.id == tableId, orElse: () => state.tables.first).status == TableStatus.vacant) {
      _syncTableStatusToOutbox(tableId, 'vacant');
    }
  }

  void updateLineNotes(String tableId, String targetKey, String notes) {
    final updated = state.tables.map((t) {
      if (t.id != tableId) return t;

      final lines = List<CartItem>.from(t.activeOrderLines);
      final idx = lines.indexWhere((l) => l.lineKey == targetKey || l.product.id == targetKey);
      if (idx >= 0) {
        lines[idx] = lines[idx].copyWith(notes: notes.trim().isEmpty ? null : notes.trim());
      }
      return t.copyWith(activeOrderLines: lines);
    }).toList();

    state = state.copyWith(tables: updated);
    _saveToCache();
  }

  bool transferTable(String sourceTableId, String targetTableId) {
    final source = state.tables.firstWhere((t) => t.id == sourceTableId, orElse: () => state.tables.first);
    final target = state.tables.firstWhere((t) => t.id == targetTableId, orElse: () => state.tables.first);

    if (source.id == target.id || source.activeOrderLines.isEmpty) {
      return false;
    }

    final updated = state.tables.map((t) {
      if (t.id == sourceTableId) {
        return t.copyWith(
          status: TableStatus.vacant,
          activeOrderLines: const [],
          seatedAt: null,
          captainNotes: null,
        );
      }
      if (t.id == targetTableId) {
        return t.copyWith(
          status: source.status == TableStatus.ordered ? TableStatus.ordered : TableStatus.seated,
          activeOrderLines: source.activeOrderLines,
          currentGuestCount: source.currentGuestCount,
          seatedAt: source.seatedAt ?? DateTime.now(),
          captainNotes: source.captainNotes,
        );
      }
      return t;
    }).toList();

    state = state.copyWith(tables: updated);
    _saveToCache();

    // Asynchronously queue atomic database update and outbox mutation
    _syncTransferToOutbox(sourceTableId, targetTableId);
    return true;
  }

  Future<void> _syncTransferToOutbox(String sourceTableId, String targetTableId) async {
    try {
      final auth = _ref?.read(authProvider);
      final tenantId = auth?.activeMembership?.tenantId ?? auth?.user?.primaryMembership?.tenantId ?? '';
      final branchId = (auth?.activeBranchId != null && auth!.activeBranchId!.isNotEmpty && auth.activeBranchId != 'branch-1')
          ? auth.activeBranchId!
          : (auth?.activeMembership?.branchId ?? auth?.user?.primaryMembership?.branchId ?? '');
      if (tenantId.isNotEmpty && _repo != null) {
        final deviceId = await AppConfig.getDeviceId();
        await _repo!.transferTableAtomic(
          sourceTableId: sourceTableId,
          targetTableId: targetTableId,
          tenantId: tenantId,
          branchId: branchId,
          deviceId: deviceId,
        );
        _ref?.read(syncStateProvider.notifier).syncNow();
      }
    } catch (e) {
      debugPrint('[RestaurantNotifier] Error transferring table: $e');
    }
  }

  void markTableBilled(String tableId) {
    final updated = state.tables.map((t) {
      if (t.id == tableId) {
        return t.copyWith(status: TableStatus.billed);
      }
      return t;
    }).toList();
    state = state.copyWith(tables: updated);
    _saveToCache();
  }

  void markTableOrdered(String tableId) {
    final updated = state.tables.map((t) {
      if (t.id == tableId) {
        return t.copyWith(status: TableStatus.ordered);
      }
      return t;
    }).toList();
    state = state.copyWith(tables: updated);
    _saveToCache();
  }

  void markTableDirty(String tableId) {
    final updated = state.tables.map((t) {
      if (t.id == tableId) {
        return t.copyWith(
          status: TableStatus.dirty,
          activeOrderLines: const [],
          seatedAt: null,
          captainNotes: null,
        );
      }
      return t;
    }).toList();
    state = state.copyWith(tables: updated);
    _saveToCache();
    _syncTableStatusToOutbox(tableId, 'dirty');
  }

  void markTableClean(String tableId) {
    final updated = state.tables.map((t) {
      if (t.id == tableId) {
        return t.copyWith(status: TableStatus.vacant);
      }
      return t;
    }).toList();
    state = state.copyWith(tables: updated);
    _saveToCache();
    _syncTableStatusToOutbox(tableId, 'vacant');
  }

  void clearAndVacateTable(String tableId, {bool markDirty = false}) {
    final updated = state.tables.map((t) {
      if (t.id == tableId) {
        return t.copyWith(
          status: markDirty ? TableStatus.dirty : TableStatus.vacant,
          activeOrderLines: const [],
          confirmedItemCount: 0,
          seatedAt: null,
          captainNotes: null,
        );
      }
      return t;
    }).toList();
    state = state.copyWith(tables: updated);
    _saveToCache();
  }
}

final restaurantProvider = StateNotifierProvider<RestaurantNotifier, RestaurantState>((ref) {
  final repo = ref.watch(localRestaurantRepoProvider);
  return RestaurantNotifier(repo, ref);
});
