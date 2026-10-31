class Customer {
  final String id;
  final String name;
  final String phone;
  final int creditLimitPaisa;
  final int currentBalancePaisa;

  const Customer({
    required this.id,
    required this.name,
    required this.phone,
    required this.creditLimitPaisa,
    required this.currentBalancePaisa,
  });

  double get creditLimitRupees => creditLimitPaisa / 100.0;
  double get currentBalanceRupees => currentBalancePaisa / 100.0;

  Customer copyWith({int? currentBalancePaisa}) {
    return Customer(
      id: id,
      name: name,
      phone: phone,
      creditLimitPaisa: creditLimitPaisa,
      currentBalancePaisa: currentBalancePaisa ?? this.currentBalancePaisa,
    );
  }
}

