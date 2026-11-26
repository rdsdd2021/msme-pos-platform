class ProductVariant {
  final String name; // e.g. 'Half', 'Full', 'Regular', 'Large'
  final double price;

  const ProductVariant({
    required this.name,
    required this.price,
  });

  int get pricePaisa => (price * 100).round();

  Map<String, dynamic> toJson() => {
        'name': name,
        'price': price,
      };

  factory ProductVariant.fromJson(Map<String, dynamic> json) => ProductVariant(
        name: json['name'] as String? ?? 'Standard',
        price: (double.tryParse(json['price']?.toString() ?? '0') ?? 0.0),
      );
}

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
  final List<ProductVariant>? variants;

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
    this.variants,
  });

  Product copyWith({
    String? id,
    String? name,
    String? sku,
    String? barcode,
    String? category,
    String? unit,
    int? sellingPricePaisa,
    int? purchaseCostPaisa,
    int? gstRate,
    double? currentStock,
    String? hsnCode,
    String? imageUrl,
    String? foodType,
    String? kitchenStation,
    int? prepTimeMinutes,
    bool? isAvailable,
    bool? isMadeToOrder,
    List<ProductVariant>? variants,
  }) {
    return Product(
      id: id ?? this.id,
      name: name ?? this.name,
      sku: sku ?? this.sku,
      barcode: barcode ?? this.barcode,
      category: category ?? this.category,
      unit: unit ?? this.unit,
      sellingPricePaisa: sellingPricePaisa ?? this.sellingPricePaisa,
      purchaseCostPaisa: purchaseCostPaisa ?? this.purchaseCostPaisa,
      gstRate: gstRate ?? this.gstRate,
      currentStock: currentStock ?? this.currentStock,
      hsnCode: hsnCode ?? this.hsnCode,
      imageUrl: imageUrl ?? this.imageUrl,
      foodType: foodType ?? this.foodType,
      kitchenStation: kitchenStation ?? this.kitchenStation,
      prepTimeMinutes: prepTimeMinutes ?? this.prepTimeMinutes,
      isAvailable: isAvailable ?? this.isAvailable,
      isMadeToOrder: isMadeToOrder ?? this.isMadeToOrder,
      variants: variants ?? this.variants,
    );
  }

  double get sellingPriceRupees => sellingPricePaisa / 100.0;
  double get purchaseCostRupees => purchaseCostPaisa / 100.0;

  bool get isLowStock => !isMadeToOrder && currentStock < 5.0;

  bool get isVeg => foodType == 'veg' || foodType == 'vegan';
  bool get isNonVeg => foodType == 'non_veg';
  bool get isEgg => foodType == 'egg';
}

