import 'product.dart';

class CartItem {
  final Product product;
  final int quantity;
  final String? notes;
  final String? variantName;
  final int? variantPricePaisa;

  const CartItem({
    required this.product,
    this.quantity = 1,
    this.notes,
    this.variantName,
    this.variantPricePaisa,
  });

  String get lineKey => variantName != null ? '${product.id}__$variantName' : product.id;

  String get displayName => variantName != null ? '${product.name} ($variantName)' : product.name;

  int get unitPricePaisa => variantPricePaisa ?? product.sellingPricePaisa;

  int get subtotalPaisa => unitPricePaisa * quantity;

  int get taxPaisa => ((subtotalPaisa * product.gstRate) / 100).round();

  int get totalPaisa => subtotalPaisa + taxPaisa;

  double get unitPriceRupees => unitPricePaisa / 100.0;
  double get subtotalRupees => subtotalPaisa / 100.0;
  double get taxRupees => taxPaisa / 100.0;
  double get totalRupees => totalPaisa / 100.0;

  CartItem copyWith({
    Product? product,
    int? quantity,
    String? notes,
    String? variantName,
    int? variantPricePaisa,
  }) {
    return CartItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
      notes: notes ?? this.notes,
      variantName: variantName ?? this.variantName,
      variantPricePaisa: variantPricePaisa ?? this.variantPricePaisa,
    );
  }
}
