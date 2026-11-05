import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/cart_item.dart';
import '../models/product.dart';

enum TableStatus {
  vacant,
  occupied,
  billed;

  String get label {
    switch (this) {
      case TableStatus.vacant:
        return 'Vacant';
      case TableStatus.occupied:
        return 'Occupied';
      case TableStatus.billed:
        return 'Billed';
    }
  }
}

class RestaurantTable {
  final String id;
  final String name;
  final String section;
  final int capacity;
  final TableStatus status;
  final List<CartItem> activeOrderLines;
  final DateTime? seatedAt;

  const RestaurantTable({
    required this.id,
    required this.name,
    this.section = 'Main Dining',
    this.capacity = 4,
    this.status = TableStatus.vacant,
    this.activeOrderLines = const [],
    this.seatedAt,
  });

  int get runningTotalPaisa => activeOrderLines.fold(0, (sum, i) => sum + i.totalPaisa);
  int get itemCount => activeOrderLines.fold(0, (sum, i) => sum + i.quantity);

  RestaurantTable copyWith({
    String? id,
    String? name,
    String? section,
    int? capacity,
    TableStatus? status,
    List<CartItem>? activeOrderLines,
    DateTime? seatedAt,
  }) {
    return RestaurantTable(
      id: id ?? this.id,
      name: name ?? this.name,
      section: section ?? this.section,
      capacity: capacity ?? this.capacity,
      status: status ?? this.status,
      activeOrderLines: activeOrderLines ?? this.activeOrderLines,
      seatedAt: seatedAt ?? this.seatedAt,
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

  int get occupiedCount => tables.where((t) => t.status != TableStatus.vacant).length;
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
  RestaurantNotifier()
      : super(
          RestaurantState(
            tables: [
              const RestaurantTable(id: 't-1', name: 'Table 1', section: 'AC Dining', capacity: 4),
              const RestaurantTable(id: 't-2', name: 'Table 2', section: 'AC Dining', capacity: 2),
              const RestaurantTable(id: 't-3', name: 'Table 3', section: 'Main Hall', capacity: 6),
              const RestaurantTable(id: 't-4', name: 'Table 4', section: 'Main Hall', capacity: 4),
              const RestaurantTable(id: 't-5', name: 'Table 5', section: 'Terrace', capacity: 4),
              const RestaurantTable(id: 't-6', name: 'Table 6', section: 'Terrace', capacity: 2),
              const RestaurantTable(id: 'takeaway-1', name: 'Takeaway 1', section: 'Takeaway', capacity: 1),
              const RestaurantTable(id: 'takeaway-2', name: 'Takeaway 2', section: 'Takeaway', capacity: 1),
            ],
          ),
        );

  void selectSection(String section) {
    state = state.copyWith(selectedSection: section);
  }

  void addItemToTable(String tableId, Product product, {int qty = 1}) {
    final updated = state.tables.map((t) {
      if (t.id != tableId) return t;

      final lines = List<CartItem>.from(t.activeOrderLines);
      final idx = lines.indexWhere((l) => l.product.id == product.id);

      if (idx >= 0) {
        lines[idx] = lines[idx].copyWith(quantity: lines[idx].quantity + qty);
      } else {
        lines.add(CartItem(product: product, quantity: qty));
      }

      return t.copyWith(
        activeOrderLines: lines,
        status: TableStatus.occupied,
        seatedAt: t.seatedAt ?? DateTime.now(),
      );
    }).toList();

    state = state.copyWith(tables: updated);
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
        status: lines.isEmpty ? TableStatus.vacant : TableStatus.occupied,
        seatedAt: lines.isEmpty ? null : t.seatedAt,
      );
    }).toList();

    state = state.copyWith(tables: updated);
  }

  void markTableBilled(String tableId) {
    final updated = state.tables.map((t) {
      if (t.id == tableId) {
        return t.copyWith(status: TableStatus.billed);
      }
      return t;
    }).toList();
    state = state.copyWith(tables: updated);
  }

  void clearAndVacateTable(String tableId) {
    final updated = state.tables.map((t) {
      if (t.id == tableId) {
        return t.copyWith(
          status: TableStatus.vacant,
          activeOrderLines: const [],
          seatedAt: null,
        );
      }
      return t;
    }).toList();
    state = state.copyWith(tables: updated);
  }
}

final restaurantProvider = StateNotifierProvider<RestaurantNotifier, RestaurantState>((ref) {
  return RestaurantNotifier();
});

