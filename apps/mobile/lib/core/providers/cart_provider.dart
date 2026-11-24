import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/cart_item.dart';
import '../models/product.dart';
import 'restaurant_provider.dart';

class CartState {
  final List<CartItem> items;
  final bool isGstEnabled;

  const CartState({this.items = const [], this.isGstEnabled = true});

  int get totalItemsCount => items.fold(0, (sum, item) => sum + item.quantity);

  int get subtotalPaisa => items.fold(0, (sum, item) => sum + item.subtotalPaisa);

  int get taxPaisa => isGstEnabled ? items.fold(0, (sum, item) => sum + item.taxPaisa) : 0;

  int get grandTotalPaisa => isGstEnabled ? items.fold(0, (sum, item) => sum + item.totalPaisa) : subtotalPaisa;

  double get subtotalRupees => subtotalPaisa / 100.0;
  double get taxRupees => taxPaisa / 100.0;
  double get grandTotalRupees => grandTotalPaisa / 100.0;

  bool get isEmpty => items.isEmpty;

  CartState copyWith({List<CartItem>? items, bool? isGstEnabled}) {
    return CartState(
      items: items ?? this.items,
      isGstEnabled: isGstEnabled ?? this.isGstEnabled,
    );
  }
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier({bool isGstEnabled = true}) : super(CartState(isGstEnabled: isGstEnabled));

  void setGstEnabled(bool enabled) {
    final updatedItems = state.items.map((it) {
      if (!enabled && it.product.gstRate > 0) {
        return it.copyWith(product: it.product.copyWith(gstRate: 0));
      }
      return it;
    }).toList();
    state = CartState(items: updatedItems, isGstEnabled: enabled);
  }

  bool addProduct(Product product, {bool allowNegativeStock = false}) {
    final existingIndex = state.items.indexWhere((item) => item.product.id == product.id);
    final currentQty = existingIndex >= 0 ? state.items[existingIndex].quantity : 0;

    // Stock Ceiling Enforcement (Rule 15: Cannot add more than on-hand stock for inventory-tracked items)
    // Made-to-order dishes or culinary items prepared on demand are not restricted by warehouse stock
    if (!product.isMadeToOrder && !allowNegativeStock && (currentQty + 1) > product.currentStock) {
      return false;
    }

    final effectiveProduct = !state.isGstEnabled && product.gstRate > 0
        ? product.copyWith(gstRate: 0)
        : product;

    if (existingIndex >= 0) {
      final updated = List<CartItem>.from(state.items);
      final current = updated[existingIndex];
      updated[existingIndex] = current.copyWith(
        quantity: current.quantity + 1,
        product: !state.isGstEnabled ? current.product.copyWith(gstRate: 0) : current.product,
      );
      state = CartState(items: updated, isGstEnabled: state.isGstEnabled);
    } else {
      state = CartState(
        items: [...state.items, CartItem(product: effectiveProduct, quantity: 1)],
        isGstEnabled: state.isGstEnabled,
      );
    }
    return true;
  }

  void decrementProduct(String productId) {
    final existingIndex = state.items.indexWhere((item) => item.product.id == productId);
    if (existingIndex < 0) return;

    final updated = List<CartItem>.from(state.items);
    final current = updated[existingIndex];

    if (current.quantity > 1) {
      updated[existingIndex] = current.copyWith(quantity: current.quantity - 1);
      state = CartState(items: updated, isGstEnabled: state.isGstEnabled);
    } else {
      updated.removeAt(existingIndex);
      state = CartState(items: updated, isGstEnabled: state.isGstEnabled);
    }
  }

  void removeItem(String productId) {
    state = CartState(
      items: state.items.where((item) => item.product.id != productId).toList(),
      isGstEnabled: state.isGstEnabled,
    );
  }

  void clearCart() {
    state = CartState(items: const [], isGstEnabled: state.isGstEnabled);
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  final isGstEnabled = ref.watch(restaurantProvider.select((s) => s.isGstEnabled));
  return CartNotifier(isGstEnabled: isGstEnabled);
});
