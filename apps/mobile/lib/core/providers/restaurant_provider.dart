import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/cart_item.dart';
import '../models/product.dart';
import '../repositories/local_restaurant_repository.dart';
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
  final String name;
  final String section;
  final int capacity;
  final int currentGuestCount;
  final TableStatus status;
  final List<CartItem> activeOrderLines;
  final int confirmedItemCount;
  final DateTime? seatedAt;
  final String? captainNotes;

  const RestaurantTable({
    required this.id,
    required this.name,
    this.section = 'Main Dining',
    this.capacity = 4,
    this.currentGuestCount = 2,
    this.status = TableStatus.vacant,
    this.activeOrderLines = const [],
    this.confirmedItemCount = 0,
    this.seatedAt,
    this.captainNotes,
  });

  int get runningTotalPaisa => activeOrderLines.fold(0, (sum, i) => sum + i.totalPaisa);
  int get itemCount => activeOrderLines.fold(0, (sum, i) => sum + i.quantity);

  bool get hasNewItems {
    if (activeOrderLines.isEmpty) return false;
    return itemCount > confirmedItemCount;
  }

  int get newItemsCount {
    final diff = itemCount - confirmedItemCount;
    return diff > 0 ? diff : 0;
  }

  RestaurantTable copyWith({
    String? id,
    String? name,
    String? section,
    int? capacity,
    int? currentGuestCount,
    TableStatus? status,
    List<CartItem>? activeOrderLines,
    int? confirmedItemCount,
    DateTime? seatedAt,
    String? captainNotes,
  }) {
    return RestaurantTable(
      id: id ?? this.id,
      name: name ?? this.name,
      section: section ?? this.section,
      capacity: capacity ?? this.capacity,
      currentGuestCount: currentGuestCount ?? this.currentGuestCount,
      status: status ?? this.status,
      activeOrderLines: activeOrderLines ?? this.activeOrderLines,
      confirmedItemCount: confirmedItemCount ?? this.confirmedItemCount,
      seatedAt: seatedAt ?? this.seatedAt,
      captainNotes: captainNotes ?? this.captainNotes,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
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
        },
      }).toList(),
    };
  }

  static RestaurantTable fromJson(Map<String, dynamic> json) {
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
      final product = Product(
        id: pMap['id'] as String,
        name: pMap['name'] as String,
        sku: pMap['sku'] as String? ?? '',
        barcode: pMap['barcode'] as String?,
        category: pMap['category'] as String? ?? 'General',
        unit: pMap['unit'] as String? ?? 'PCS',
        sellingPricePaisa: pMap['sellingPricePaisa'] as int? ?? 0,
        purchaseCostPaisa: pMap['purchaseCostPaisa'] as int? ?? 0,
        gstRate: pMap['gstRate'] as int? ?? 5,
        currentStock: (pMap['currentStock'] as num?)?.toDouble() ?? 100.0,
        hsnCode: pMap['hsnCode'] as String?,
        imageUrl: pMap['imageUrl'] as String?,
      );
      return CartItem(
        product: product,
        quantity: lineMap['quantity'] as int? ?? 1,
        notes: lineMap['notes'] as String?,
      );
    }).toList();

    return RestaurantTable(
      id: json['id'] as String,
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

  const RestaurantState({
    required this.tables,
    this.selectedSection = 'All',
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
  int get totalDineInRunningPaisa => tables.fold(0, (sum, t) => sum + t.runningTotalPaisa);

  RestaurantState copyWith({
    List<RestaurantTable>? tables,
    String? selectedSection,
  }) {
    return RestaurantState(
      tables: tables ?? this.tables,
      selectedSection: selectedSection ?? this.selectedSection,
    );
  }
}

class RestaurantNotifier extends StateNotifier<RestaurantState> {
  static const _storageKey = 'cached_restaurant_tables_v1';
  final LocalRestaurantRepository? _repo;
  dynamic _tablesSubscription;

  static final List<RestaurantTable> _defaultTables = [
    const RestaurantTable(id: 't-1', name: 'Table 1', section: 'AC Dining', capacity: 4),
    const RestaurantTable(id: 't-2', name: 'Table 2', section: 'AC Dining', capacity: 2),
    const RestaurantTable(id: 't-3', name: 'Table 3', section: 'Main Hall', capacity: 6),
    const RestaurantTable(id: 't-4', name: 'Table 4', section: 'Main Hall', capacity: 4),
    const RestaurantTable(id: 't-5', name: 'Table 5', section: 'Terrace', capacity: 4),
    const RestaurantTable(id: 't-6', name: 'Table 6', section: 'Terrace', capacity: 2),
    const RestaurantTable(id: 'takeaway-1', name: 'Takeaway 1', section: 'Takeaway', capacity: 1),
    const RestaurantTable(id: 'takeaway-2', name: 'Takeaway 2', section: 'Takeaway', capacity: 1),
  ];

  RestaurantNotifier([this._repo]) : super(RestaurantState(tables: _defaultTables)) {
    if (_repo != null) {
      _initFromRepo();
    } else {
      _loadFromCache();
    }
  }

  void _initFromRepo() {
    _loadFromCache();
    refreshFromDb();
  }

  Future<void> refreshFromDb() async {
    try {
      final dbTables = await _repo?.getAllTables();
      if (dbTables != null && dbTables.isNotEmpty) {
        await _syncTablesFromDb(dbTables);
      }
    } catch (_) {}
  }

  Future<void> _syncTablesFromDb(List<dynamic> dbTables) async {
    final currentMap = {for (final t in state.tables) t.id: t};

    final List<RestaurantTable> merged = [];
    for (final tbl in dbTables) {
      final tblId = tbl.id as String;
      final existing = currentMap[tblId] ?? currentMap[tbl.tableNumber];

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

      var activeLines = existing?.activeOrderLines ?? [];
      if (activeLines.isEmpty && (parsedStatus == TableStatus.ordered || parsedStatus == TableStatus.billed)) {
        final dbLines = await _repo?.getTableActiveCartItems(tblId) ?? [];
        if (dbLines.isNotEmpty) {
          activeLines = dbLines;
        }
      }

      final isFired = parsedStatus == TableStatus.ordered || parsedStatus == TableStatus.billed;
      final int existingConfirmed = existing?.confirmedItemCount ?? (isFired ? activeLines.fold<int>(0, (sum, i) => sum + i.quantity) : 0);

      merged.add(
        RestaurantTable(
          id: tblId,
          name: tbl.name ?? tbl.tableNumber ?? existing?.name ?? 'Table',
          section: tbl.section ?? existing?.section ?? 'Main Dining',
          capacity: tbl.seatingCapacity ?? existing?.capacity ?? 4,
          currentGuestCount: tbl.currentGuestCount > 0 ? tbl.currentGuestCount : (existing?.currentGuestCount ?? 2),
          status: parsedStatus,
          activeOrderLines: activeLines,
          confirmedItemCount: existingConfirmed,
          seatedAt: tbl.occupiedAt ?? existing?.seatedAt,
          captainNotes: existing?.captainNotes,
        ),
      );
    }

    state = state.copyWith(tables: merged);
    await _saveToCache();
  }

  @override
  void dispose() {
    _tablesSubscription?.cancel();
    super.dispose();
  }

  Future<void> _loadFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedJson = prefs.getString(_storageKey);
      if (cachedJson != null && cachedJson.isNotEmpty) {
        final decoded = jsonDecode(cachedJson) as List<dynamic>;
        final loaded = decoded.map((e) => RestaurantTable.fromJson(e as Map<String, dynamic>)).toList();
        if (loaded.isNotEmpty) {
          // Merge any default tables that may be missing from an older cache version
          final loadedIds = {for (final t in loaded) t.id};
          final missing = _defaultTables.where((t) => !loadedIds.contains(t.id)).toList();
          state = state.copyWith(tables: [...loaded, ...missing]);
        }
      }
    } catch (_) {}
  }

  Future<void> _saveToCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encoded = jsonEncode(state.tables.map((t) => t.toJson()).toList());
      await prefs.setString(_storageKey, encoded);
    } catch (_) {}
  }

  void selectSection(String section) {
    state = state.copyWith(selectedSection: section);
  }

  void setGuestCount(String tableId, int count) {
    final valid = count.clamp(1, 20);
    final updated = state.tables.map((t) {
      if (t.id != tableId) return t;
      return t.copyWith(currentGuestCount: valid);
    }).toList();
    state = state.copyWith(tables: updated);
    _saveToCache();
  }

  void setCaptainNotes(String tableId, String notes) {
    final updated = state.tables.map((t) {
      if (t.id != tableId) return t;
      return t.copyWith(captainNotes: notes);
    }).toList();
    state = state.copyWith(tables: updated);
    _saveToCache();
  }

  void addItemToTable(String tableId, Product product, {int qty = 1, String? notes}) {
    final updated = state.tables.map((t) {
      if (t.id != tableId) return t;

      final lines = List<CartItem>.from(t.activeOrderLines);
      final idx = lines.indexWhere((l) => l.product.id == product.id);

      if (idx >= 0) {
        lines[idx] = lines[idx].copyWith(
          quantity: lines[idx].quantity + qty,
          notes: notes ?? lines[idx].notes,
        );
      } else {
        lines.add(CartItem(product: product, quantity: qty, notes: notes));
      }

      return t.copyWith(
        activeOrderLines: lines,
        status: t.status == TableStatus.ordered ? TableStatus.ordered : TableStatus.seated,
        seatedAt: t.seatedAt ?? DateTime.now(),
      );
    }).toList();

    state = state.copyWith(tables: updated);
    _saveToCache();
  }

  void markOrderConfirmed(String tableId) {
    final updated = state.tables.map((t) {
      if (t.id != tableId) return t;
      return t.copyWith(
        status: TableStatus.ordered,
        confirmedItemCount: t.itemCount,
      );
    }).toList();
    state = state.copyWith(tables: updated);
    _saveToCache();
  }

  void removeItemFromTable(String tableId, String productId) {
    final updated = state.tables.map((t) {
      if (t.id != tableId) return t;

      final lines = List<CartItem>.from(t.activeOrderLines);
      final idx = lines.indexWhere((l) => l.product.id == productId);

      if (idx >= 0) {
        if (lines[idx].quantity > 1) {
          lines[idx] = lines[idx].copyWith(quantity: lines[idx].quantity - 1);
        } else {
          lines.removeAt(idx);
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
  }

  void updateLineNotes(String tableId, String productId, String notes) {
    final updated = state.tables.map((t) {
      if (t.id != tableId) return t;

      final lines = List<CartItem>.from(t.activeOrderLines);
      final idx = lines.indexWhere((l) => l.product.id == productId);
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
    return true;
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
  return RestaurantNotifier(repo);
});
