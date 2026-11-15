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
  final String? hsnCode;
  final String? imageUrl;
  final String? foodType; // 'veg', 'non_veg', 'egg', 'vegan'
  final String? kitchenStation; // 'main_kitchen', 'tandoor', 'beverage_bar', 'bakery_dessert'
  final int? prepTimeMinutes;
  final bool isAvailable;
  final bool isMadeToOrder;

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
    this.hsnCode,
    this.imageUrl,
    this.foodType,
    this.kitchenStation,
    this.prepTimeMinutes,
    this.isAvailable = true,
    this.isMadeToOrder = false,
  });

  double get sellingPriceRupees => sellingPricePaisa / 100.0;
  double get purchaseCostRupees => purchaseCostPaisa / 100.0;

  bool get isLowStock => currentStock < 5.0;

  bool get isVeg => foodType == 'veg' || foodType == 'vegan';
  bool get isNonVeg => foodType == 'non_veg';
  bool get isEgg => foodType == 'egg';
}

