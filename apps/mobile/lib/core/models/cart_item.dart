import 'product.dart';

class CartItem {
  final Product product;
  final int quantity;

  const CartItem({
    required this.product,
    this.quantity = 1,
  });

  int get subtotalPaisa => product.sellingPricePaisa * quantity;

  int get taxPaisa => ((subtotalPaisa * product.gstRate) / 100).round();

  int get totalPaisa => subtotalPaisa + taxPaisa;

  double get subtotalRupees => subtotalPaisa / 100.0;
  double get taxRupees => taxPaisa / 100.0;
  double get totalRupees => totalPaisa / 100.0;

  CartItem copyWith({int? quantity}) {
    return CartItem(
      product: product,
      quantity: quantity ?? this.quantity,
    );
  }
}

