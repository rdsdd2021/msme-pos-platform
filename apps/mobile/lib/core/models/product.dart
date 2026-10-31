class Product {
  final String id;
  final String name;
  final String sku;
  final String? barcode;
  final String category;
  final String unit;
  final int sellingPricePaisa;
  final int purchaseCostPaisa;
  final int gstRate; // e.g. 0, 5, 12, 18
  final double currentStock;

  const Product({
    required this.id,
    required this.name,
    required this.sku,
    this.barcode,
    required this.category,
    required this.unit,
    required this.sellingPricePaisa,
    required this.purchaseCostPaisa,
    required this.gstRate,
    required this.currentStock,
  });

  double get sellingPriceRupees => sellingPricePaisa / 100.0;
  double get purchaseCostRupees => purchaseCostPaisa / 100.0;

  bool get isLowStock => currentStock < 5.0;
}

