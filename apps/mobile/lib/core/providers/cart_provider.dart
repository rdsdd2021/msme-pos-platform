import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/cart_item.dart';
import '../models/product.dart';

class CartState {
  final List<CartItem> items;

  const CartState({this.items = const []});

  int get totalItemsCount => items.fold(0, (sum, item) => sum + item.quantity);

  int get subtotalPaisa => items.fold(0, (sum, item) => sum + item.subtotalPaisa);

  int get taxPaisa => items.fold(0, (sum, item) => sum + item.taxPaisa);

  int get grandTotalPaisa => items.fold(0, (sum, item) => sum + item.totalPaisa);

  double get subtotalRupees => subtotalPaisa / 100.0;
  double get taxRupees => taxPaisa / 100.0;
  double get grandTotalRupees => grandTotalPaisa / 100.0;

  bool get isEmpty => items.isEmpty;
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(const CartState());

  bool addProduct(Product product, {bool allowNegativeStock = false}) {
    final existingIndex = state.items.indexWhere((item) => item.product.id == product.id);
    final currentQty = existingIndex >= 0 ? state.items[existingIndex].quantity : 0;

    // Stock Ceiling Enforcement (Rule 15: Cannot add more than on-hand stock)
    if (!allowNegativeStock && (currentQty + 1) > product.currentStock) {
      return false;
    }

    if (existingIndex >= 0) {
      final updated = List<CartItem>.from(state.items);
      final current = updated[existingIndex];
      updated[existingIndex] = current.copyWith(quantity: current.quantity + 1);
      state = CartState(items: updated);
    } else {
      state = CartState(items: [...state.items, CartItem(product: product, quantity: 1)]);
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
      state = CartState(items: updated);
    } else {
      updated.removeAt(existingIndex);
      state = CartState(items: updated);
    }
  }

  void removeItem(String productId) {
    state = CartState(
      items: state.items.where((item) => item.product.id != productId).toList(),
    );
  }

  void clearCart() {
    state = const CartState(items: []);
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});

