// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $LocalProductsTable extends LocalProducts
    with TableInfo<$LocalProductsTable, LocalProduct> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalProductsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _tenantIdMeta =
      const VerificationMeta('tenantId');
  @override
  late final GeneratedColumn<String> tenantId = GeneratedColumn<String>(
      'tenant_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _skuMeta = const VerificationMeta('sku');
  @override
  late final GeneratedColumn<String> sku = GeneratedColumn<String>(
      'sku', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _barcodeMeta =
      const VerificationMeta('barcode');
  @override
  late final GeneratedColumn<String> barcode = GeneratedColumn<String>(
      'barcode', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _sellingPricePaisaMeta =
      const VerificationMeta('sellingPricePaisa');
  @override
  late final GeneratedColumn<int> sellingPricePaisa = GeneratedColumn<int>(
      'selling_price_paisa', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _purchaseCostPaisaMeta =
      const VerificationMeta('purchaseCostPaisa');
  @override
  late final GeneratedColumn<int> purchaseCostPaisa = GeneratedColumn<int>(
      'purchase_cost_paisa', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _mrpPaisaMeta =
      const VerificationMeta('mrpPaisa');
  @override
  late final GeneratedColumn<int> mrpPaisa = GeneratedColumn<int>(
      'mrp_paisa', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _gstRatePercentMeta =
      const VerificationMeta('gstRatePercent');
  @override
  late final GeneratedColumn<double> gstRatePercent = GeneratedColumn<double>(
      'gst_rate_percent', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0.0));
  static const VerificationMeta _hsnCodeMeta =
      const VerificationMeta('hsnCode');
  @override
  late final GeneratedColumn<String> hsnCode = GeneratedColumn<String>(
      'hsn_code', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _categoryNameMeta =
      const VerificationMeta('categoryName');
  @override
  late final GeneratedColumn<String> categoryName = GeneratedColumn<String>(
      'category_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _unitMeta = const VerificationMeta('unit');
  @override
  late final GeneratedColumn<String> unit = GeneratedColumn<String>(
      'unit', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('PCS'));
  static const VerificationMeta _stockQuantityMeta =
      const VerificationMeta('stockQuantity');
  @override
  late final GeneratedColumn<double> stockQuantity = GeneratedColumn<double>(
      'stock_quantity', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0.0));
  static const VerificationMeta _imageUrlMeta =
      const VerificationMeta('imageUrl');
  @override
  late final GeneratedColumn<String> imageUrl = GeneratedColumn<String>(
      'image_url', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        tenantId,
        sku,
        name,
        barcode,
        sellingPricePaisa,
        purchaseCostPaisa,
        mrpPaisa,
        gstRatePercent,
        hsnCode,
        categoryName,
        unit,
        stockQuantity,
        imageUrl,
        updatedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_products';
  @override
  VerificationContext validateIntegrity(Insertable<LocalProduct> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('tenant_id')) {
      context.handle(_tenantIdMeta,
          tenantId.isAcceptableOrUnknown(data['tenant_id']!, _tenantIdMeta));
    } else if (isInserting) {
      context.missing(_tenantIdMeta);
    }
    if (data.containsKey('sku')) {
      context.handle(
          _skuMeta, sku.isAcceptableOrUnknown(data['sku']!, _skuMeta));
    } else if (isInserting) {
      context.missing(_skuMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('barcode')) {
      context.handle(_barcodeMeta,
          barcode.isAcceptableOrUnknown(data['barcode']!, _barcodeMeta));
    }
    if (data.containsKey('selling_price_paisa')) {
      context.handle(
          _sellingPricePaisaMeta,
          sellingPricePaisa.isAcceptableOrUnknown(
              data['selling_price_paisa']!, _sellingPricePaisaMeta));
    } else if (isInserting) {
      context.missing(_sellingPricePaisaMeta);
    }
    if (data.containsKey('purchase_cost_paisa')) {
      context.handle(
          _purchaseCostPaisaMeta,
          purchaseCostPaisa.isAcceptableOrUnknown(
              data['purchase_cost_paisa']!, _purchaseCostPaisaMeta));
    }
    if (data.containsKey('mrp_paisa')) {
      context.handle(_mrpPaisaMeta,
          mrpPaisa.isAcceptableOrUnknown(data['mrp_paisa']!, _mrpPaisaMeta));
    }
    if (data.containsKey('gst_rate_percent')) {
      context.handle(
          _gstRatePercentMeta,
          gstRatePercent.isAcceptableOrUnknown(
              data['gst_rate_percent']!, _gstRatePercentMeta));
    }
    if (data.containsKey('hsn_code')) {
      context.handle(_hsnCodeMeta,
          hsnCode.isAcceptableOrUnknown(data['hsn_code']!, _hsnCodeMeta));
    }
    if (data.containsKey('category_name')) {
      context.handle(
          _categoryNameMeta,
          categoryName.isAcceptableOrUnknown(
              data['category_name']!, _categoryNameMeta));
    }
    if (data.containsKey('unit')) {
      context.handle(
          _unitMeta, unit.isAcceptableOrUnknown(data['unit']!, _unitMeta));
    }
    if (data.containsKey('stock_quantity')) {
      context.handle(
          _stockQuantityMeta,
          stockQuantity.isAcceptableOrUnknown(
              data['stock_quantity']!, _stockQuantityMeta));
    }
    if (data.containsKey('image_url')) {
      context.handle(_imageUrlMeta,
          imageUrl.isAcceptableOrUnknown(data['image_url']!, _imageUrlMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalProduct map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalProduct(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      tenantId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}tenant_id'])!,
      sku: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}sku'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      barcode: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}barcode']),
      sellingPricePaisa: attachedDatabase.typeMapping.read(
          DriftSqlType.int, data['${effectivePrefix}selling_price_paisa'])!,
      purchaseCostPaisa: attachedDatabase.typeMapping.read(
          DriftSqlType.int, data['${effectivePrefix}purchase_cost_paisa'])!,
      mrpPaisa: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}mrp_paisa'])!,
      gstRatePercent: attachedDatabase.typeMapping.read(
          DriftSqlType.double, data['${effectivePrefix}gst_rate_percent'])!,
      hsnCode: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}hsn_code']),
      categoryName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}category_name']),
      unit: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}unit'])!,
      stockQuantity: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}stock_quantity'])!,
      imageUrl: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}image_url']),
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
    );
  }

  @override
  $LocalProductsTable createAlias(String alias) {
    return $LocalProductsTable(attachedDatabase, alias);
  }
}

class LocalProduct extends DataClass implements Insertable<LocalProduct> {
  final String id;
  final String tenantId;
  final String sku;
  final String name;
  final String? barcode;
  final int sellingPricePaisa;
  final int purchaseCostPaisa;
  final int mrpPaisa;
  final double gstRatePercent;
  final String? hsnCode;
  final String? categoryName;
  final String unit;
  final double stockQuantity;
  final String? imageUrl;
  final DateTime updatedAt;
  const LocalProduct(
      {required this.id,
      required this.tenantId,
      required this.sku,
      required this.name,
      this.barcode,
      required this.sellingPricePaisa,
      required this.purchaseCostPaisa,
      required this.mrpPaisa,
      required this.gstRatePercent,
      this.hsnCode,
      this.categoryName,
      required this.unit,
      required this.stockQuantity,
      this.imageUrl,
      required this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['tenant_id'] = Variable<String>(tenantId);
    map['sku'] = Variable<String>(sku);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || barcode != null) {
      map['barcode'] = Variable<String>(barcode);
    }
    map['selling_price_paisa'] = Variable<int>(sellingPricePaisa);
    map['purchase_cost_paisa'] = Variable<int>(purchaseCostPaisa);
    map['mrp_paisa'] = Variable<int>(mrpPaisa);
    map['gst_rate_percent'] = Variable<double>(gstRatePercent);
    if (!nullToAbsent || hsnCode != null) {
      map['hsn_code'] = Variable<String>(hsnCode);
    }
    if (!nullToAbsent || categoryName != null) {
      map['category_name'] = Variable<String>(categoryName);
    }
    map['unit'] = Variable<String>(unit);
    map['stock_quantity'] = Variable<double>(stockQuantity);
    if (!nullToAbsent || imageUrl != null) {
      map['image_url'] = Variable<String>(imageUrl);
    }
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  LocalProductsCompanion toCompanion(bool nullToAbsent) {
    return LocalProductsCompanion(
      id: Value(id),
      tenantId: Value(tenantId),
      sku: Value(sku),
      name: Value(name),
      barcode: barcode == null && nullToAbsent
          ? const Value.absent()
          : Value(barcode),
      sellingPricePaisa: Value(sellingPricePaisa),
      purchaseCostPaisa: Value(purchaseCostPaisa),
      mrpPaisa: Value(mrpPaisa),
      gstRatePercent: Value(gstRatePercent),
      hsnCode: hsnCode == null && nullToAbsent
          ? const Value.absent()
          : Value(hsnCode),
      categoryName: categoryName == null && nullToAbsent
          ? const Value.absent()
          : Value(categoryName),
      unit: Value(unit),
      stockQuantity: Value(stockQuantity),
      imageUrl: imageUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(imageUrl),
      updatedAt: Value(updatedAt),
    );
  }

  factory LocalProduct.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalProduct(
      id: serializer.fromJson<String>(json['id']),
      tenantId: serializer.fromJson<String>(json['tenantId']),
      sku: serializer.fromJson<String>(json['sku']),
      name: serializer.fromJson<String>(json['name']),
      barcode: serializer.fromJson<String?>(json['barcode']),
      sellingPricePaisa: serializer.fromJson<int>(json['sellingPricePaisa']),
      purchaseCostPaisa: serializer.fromJson<int>(json['purchaseCostPaisa']),
      mrpPaisa: serializer.fromJson<int>(json['mrpPaisa']),
      gstRatePercent: serializer.fromJson<double>(json['gstRatePercent']),
      hsnCode: serializer.fromJson<String?>(json['hsnCode']),
      categoryName: serializer.fromJson<String?>(json['categoryName']),
      unit: serializer.fromJson<String>(json['unit']),
      stockQuantity: serializer.fromJson<double>(json['stockQuantity']),
      imageUrl: serializer.fromJson<String?>(json['imageUrl']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'tenantId': serializer.toJson<String>(tenantId),
      'sku': serializer.toJson<String>(sku),
      'name': serializer.toJson<String>(name),
      'barcode': serializer.toJson<String?>(barcode),
      'sellingPricePaisa': serializer.toJson<int>(sellingPricePaisa),
      'purchaseCostPaisa': serializer.toJson<int>(purchaseCostPaisa),
      'mrpPaisa': serializer.toJson<int>(mrpPaisa),
      'gstRatePercent': serializer.toJson<double>(gstRatePercent),
      'hsnCode': serializer.toJson<String?>(hsnCode),
      'categoryName': serializer.toJson<String?>(categoryName),
      'unit': serializer.toJson<String>(unit),
      'stockQuantity': serializer.toJson<double>(stockQuantity),
      'imageUrl': serializer.toJson<String?>(imageUrl),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  LocalProduct copyWith(
          {String? id,
          String? tenantId,
          String? sku,
          String? name,
          Value<String?> barcode = const Value.absent(),
          int? sellingPricePaisa,
          int? purchaseCostPaisa,
          int? mrpPaisa,
          double? gstRatePercent,
          Value<String?> hsnCode = const Value.absent(),
          Value<String?> categoryName = const Value.absent(),
          String? unit,
          double? stockQuantity,
          Value<String?> imageUrl = const Value.absent(),
          DateTime? updatedAt}) =>
      LocalProduct(
        id: id ?? this.id,
        tenantId: tenantId ?? this.tenantId,
        sku: sku ?? this.sku,
        name: name ?? this.name,
        barcode: barcode.present ? barcode.value : this.barcode,
        sellingPricePaisa: sellingPricePaisa ?? this.sellingPricePaisa,
        purchaseCostPaisa: purchaseCostPaisa ?? this.purchaseCostPaisa,
        mrpPaisa: mrpPaisa ?? this.mrpPaisa,
        gstRatePercent: gstRatePercent ?? this.gstRatePercent,
        hsnCode: hsnCode.present ? hsnCode.value : this.hsnCode,
        categoryName:
            categoryName.present ? categoryName.value : this.categoryName,
        unit: unit ?? this.unit,
        stockQuantity: stockQuantity ?? this.stockQuantity,
        imageUrl: imageUrl.present ? imageUrl.value : this.imageUrl,
        updatedAt: updatedAt ?? this.updatedAt,
      );
  LocalProduct copyWithCompanion(LocalProductsCompanion data) {
    return LocalProduct(
      id: data.id.present ? data.id.value : this.id,
      tenantId: data.tenantId.present ? data.tenantId.value : this.tenantId,
      sku: data.sku.present ? data.sku.value : this.sku,
      name: data.name.present ? data.name.value : this.name,
      barcode: data.barcode.present ? data.barcode.value : this.barcode,
      sellingPricePaisa: data.sellingPricePaisa.present
          ? data.sellingPricePaisa.value
          : this.sellingPricePaisa,
      purchaseCostPaisa: data.purchaseCostPaisa.present
          ? data.purchaseCostPaisa.value
          : this.purchaseCostPaisa,
      mrpPaisa: data.mrpPaisa.present ? data.mrpPaisa.value : this.mrpPaisa,
      gstRatePercent: data.gstRatePercent.present
          ? data.gstRatePercent.value
          : this.gstRatePercent,
      hsnCode: data.hsnCode.present ? data.hsnCode.value : this.hsnCode,
      categoryName: data.categoryName.present
          ? data.categoryName.value
          : this.categoryName,
      unit: data.unit.present ? data.unit.value : this.unit,
      stockQuantity: data.stockQuantity.present
          ? data.stockQuantity.value
          : this.stockQuantity,
      imageUrl: data.imageUrl.present ? data.imageUrl.value : this.imageUrl,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalProduct(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('sku: $sku, ')
          ..write('name: $name, ')
          ..write('barcode: $barcode, ')
          ..write('sellingPricePaisa: $sellingPricePaisa, ')
          ..write('purchaseCostPaisa: $purchaseCostPaisa, ')
          ..write('mrpPaisa: $mrpPaisa, ')
          ..write('gstRatePercent: $gstRatePercent, ')
          ..write('hsnCode: $hsnCode, ')
          ..write('categoryName: $categoryName, ')
          ..write('unit: $unit, ')
          ..write('stockQuantity: $stockQuantity, ')
          ..write('imageUrl: $imageUrl, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      tenantId,
      sku,
      name,
      barcode,
      sellingPricePaisa,
      purchaseCostPaisa,
      mrpPaisa,
      gstRatePercent,
      hsnCode,
      categoryName,
      unit,
      stockQuantity,
      imageUrl,
      updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalProduct &&
          other.id == this.id &&
          other.tenantId == this.tenantId &&
          other.sku == this.sku &&
          other.name == this.name &&
          other.barcode == this.barcode &&
          other.sellingPricePaisa == this.sellingPricePaisa &&
          other.purchaseCostPaisa == this.purchaseCostPaisa &&
          other.mrpPaisa == this.mrpPaisa &&
          other.gstRatePercent == this.gstRatePercent &&
          other.hsnCode == this.hsnCode &&
          other.categoryName == this.categoryName &&
          other.unit == this.unit &&
          other.stockQuantity == this.stockQuantity &&
          other.imageUrl == this.imageUrl &&
          other.updatedAt == this.updatedAt);
}

class LocalProductsCompanion extends UpdateCompanion<LocalProduct> {
  final Value<String> id;
  final Value<String> tenantId;
  final Value<String> sku;
  final Value<String> name;
  final Value<String?> barcode;
  final Value<int> sellingPricePaisa;
  final Value<int> purchaseCostPaisa;
  final Value<int> mrpPaisa;
  final Value<double> gstRatePercent;
  final Value<String?> hsnCode;
  final Value<String?> categoryName;
  final Value<String> unit;
  final Value<double> stockQuantity;
  final Value<String?> imageUrl;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const LocalProductsCompanion({
    this.id = const Value.absent(),
    this.tenantId = const Value.absent(),
    this.sku = const Value.absent(),
    this.name = const Value.absent(),
    this.barcode = const Value.absent(),
    this.sellingPricePaisa = const Value.absent(),
    this.purchaseCostPaisa = const Value.absent(),
    this.mrpPaisa = const Value.absent(),
    this.gstRatePercent = const Value.absent(),
    this.hsnCode = const Value.absent(),
    this.categoryName = const Value.absent(),
    this.unit = const Value.absent(),
    this.stockQuantity = const Value.absent(),
    this.imageUrl = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalProductsCompanion.insert({
    required String id,
    required String tenantId,
    required String sku,
    required String name,
    this.barcode = const Value.absent(),
    required int sellingPricePaisa,
    this.purchaseCostPaisa = const Value.absent(),
    this.mrpPaisa = const Value.absent(),
    this.gstRatePercent = const Value.absent(),
    this.hsnCode = const Value.absent(),
    this.categoryName = const Value.absent(),
    this.unit = const Value.absent(),
    this.stockQuantity = const Value.absent(),
    this.imageUrl = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        tenantId = Value(tenantId),
        sku = Value(sku),
        name = Value(name),
        sellingPricePaisa = Value(sellingPricePaisa);
  static Insertable<LocalProduct> custom({
    Expression<String>? id,
    Expression<String>? tenantId,
    Expression<String>? sku,
    Expression<String>? name,
    Expression<String>? barcode,
    Expression<int>? sellingPricePaisa,
    Expression<int>? purchaseCostPaisa,
    Expression<int>? mrpPaisa,
    Expression<double>? gstRatePercent,
    Expression<String>? hsnCode,
    Expression<String>? categoryName,
    Expression<String>? unit,
    Expression<double>? stockQuantity,
    Expression<String>? imageUrl,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (tenantId != null) 'tenant_id': tenantId,
      if (sku != null) 'sku': sku,
      if (name != null) 'name': name,
      if (barcode != null) 'barcode': barcode,
      if (sellingPricePaisa != null) 'selling_price_paisa': sellingPricePaisa,
      if (purchaseCostPaisa != null) 'purchase_cost_paisa': purchaseCostPaisa,
      if (mrpPaisa != null) 'mrp_paisa': mrpPaisa,
      if (gstRatePercent != null) 'gst_rate_percent': gstRatePercent,
      if (hsnCode != null) 'hsn_code': hsnCode,
      if (categoryName != null) 'category_name': categoryName,
      if (unit != null) 'unit': unit,
      if (stockQuantity != null) 'stock_quantity': stockQuantity,
      if (imageUrl != null) 'image_url': imageUrl,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalProductsCompanion copyWith(
      {Value<String>? id,
      Value<String>? tenantId,
      Value<String>? sku,
      Value<String>? name,
      Value<String?>? barcode,
      Value<int>? sellingPricePaisa,
      Value<int>? purchaseCostPaisa,
      Value<int>? mrpPaisa,
      Value<double>? gstRatePercent,
      Value<String?>? hsnCode,
      Value<String?>? categoryName,
      Value<String>? unit,
      Value<double>? stockQuantity,
      Value<String?>? imageUrl,
      Value<DateTime>? updatedAt,
      Value<int>? rowid}) {
    return LocalProductsCompanion(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      sku: sku ?? this.sku,
      name: name ?? this.name,
      barcode: barcode ?? this.barcode,
      sellingPricePaisa: sellingPricePaisa ?? this.sellingPricePaisa,
      purchaseCostPaisa: purchaseCostPaisa ?? this.purchaseCostPaisa,
      mrpPaisa: mrpPaisa ?? this.mrpPaisa,
      gstRatePercent: gstRatePercent ?? this.gstRatePercent,
      hsnCode: hsnCode ?? this.hsnCode,
      categoryName: categoryName ?? this.categoryName,
      unit: unit ?? this.unit,
      stockQuantity: stockQuantity ?? this.stockQuantity,
      imageUrl: imageUrl ?? this.imageUrl,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (tenantId.present) {
      map['tenant_id'] = Variable<String>(tenantId.value);
    }
    if (sku.present) {
      map['sku'] = Variable<String>(sku.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (barcode.present) {
      map['barcode'] = Variable<String>(barcode.value);
    }
    if (sellingPricePaisa.present) {
      map['selling_price_paisa'] = Variable<int>(sellingPricePaisa.value);
    }
    if (purchaseCostPaisa.present) {
      map['purchase_cost_paisa'] = Variable<int>(purchaseCostPaisa.value);
    }
    if (mrpPaisa.present) {
      map['mrp_paisa'] = Variable<int>(mrpPaisa.value);
    }
    if (gstRatePercent.present) {
      map['gst_rate_percent'] = Variable<double>(gstRatePercent.value);
    }
    if (hsnCode.present) {
      map['hsn_code'] = Variable<String>(hsnCode.value);
    }
    if (categoryName.present) {
      map['category_name'] = Variable<String>(categoryName.value);
    }
    if (unit.present) {
      map['unit'] = Variable<String>(unit.value);
    }
    if (stockQuantity.present) {
      map['stock_quantity'] = Variable<double>(stockQuantity.value);
    }
    if (imageUrl.present) {
      map['image_url'] = Variable<String>(imageUrl.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalProductsCompanion(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('sku: $sku, ')
          ..write('name: $name, ')
          ..write('barcode: $barcode, ')
          ..write('sellingPricePaisa: $sellingPricePaisa, ')
          ..write('purchaseCostPaisa: $purchaseCostPaisa, ')
          ..write('mrpPaisa: $mrpPaisa, ')
          ..write('gstRatePercent: $gstRatePercent, ')
          ..write('hsnCode: $hsnCode, ')
          ..write('categoryName: $categoryName, ')
          ..write('unit: $unit, ')
          ..write('stockQuantity: $stockQuantity, ')
          ..write('imageUrl: $imageUrl, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalCustomersTable extends LocalCustomers
    with TableInfo<$LocalCustomersTable, LocalCustomer> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalCustomersTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _tenantIdMeta =
      const VerificationMeta('tenantId');
  @override
  late final GeneratedColumn<String> tenantId = GeneratedColumn<String>(
      'tenant_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _phoneMeta = const VerificationMeta('phone');
  @override
  late final GeneratedColumn<String> phone = GeneratedColumn<String>(
      'phone', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _creditLimitPaisaMeta =
      const VerificationMeta('creditLimitPaisa');
  @override
  late final GeneratedColumn<int> creditLimitPaisa = GeneratedColumn<int>(
      'credit_limit_paisa', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _currentBalancePaisaMeta =
      const VerificationMeta('currentBalancePaisa');
  @override
  late final GeneratedColumn<int> currentBalancePaisa = GeneratedColumn<int>(
      'current_balance_paisa', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        tenantId,
        name,
        phone,
        creditLimitPaisa,
        currentBalancePaisa,
        updatedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_customers';
  @override
  VerificationContext validateIntegrity(Insertable<LocalCustomer> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('tenant_id')) {
      context.handle(_tenantIdMeta,
          tenantId.isAcceptableOrUnknown(data['tenant_id']!, _tenantIdMeta));
    } else if (isInserting) {
      context.missing(_tenantIdMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('phone')) {
      context.handle(
          _phoneMeta, phone.isAcceptableOrUnknown(data['phone']!, _phoneMeta));
    } else if (isInserting) {
      context.missing(_phoneMeta);
    }
    if (data.containsKey('credit_limit_paisa')) {
      context.handle(
          _creditLimitPaisaMeta,
          creditLimitPaisa.isAcceptableOrUnknown(
              data['credit_limit_paisa']!, _creditLimitPaisaMeta));
    }
    if (data.containsKey('current_balance_paisa')) {
      context.handle(
          _currentBalancePaisaMeta,
          currentBalancePaisa.isAcceptableOrUnknown(
              data['current_balance_paisa']!, _currentBalancePaisaMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalCustomer map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalCustomer(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      tenantId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}tenant_id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      phone: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}phone'])!,
      creditLimitPaisa: attachedDatabase.typeMapping.read(
          DriftSqlType.int, data['${effectivePrefix}credit_limit_paisa'])!,
      currentBalancePaisa: attachedDatabase.typeMapping.read(
          DriftSqlType.int, data['${effectivePrefix}current_balance_paisa'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
    );
  }

  @override
  $LocalCustomersTable createAlias(String alias) {
    return $LocalCustomersTable(attachedDatabase, alias);
  }
}

class LocalCustomer extends DataClass implements Insertable<LocalCustomer> {
  final String id;
  final String tenantId;
  final String name;
  final String phone;
  final int creditLimitPaisa;
  final int currentBalancePaisa;
  final DateTime updatedAt;
  const LocalCustomer(
      {required this.id,
      required this.tenantId,
      required this.name,
      required this.phone,
      required this.creditLimitPaisa,
      required this.currentBalancePaisa,
      required this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['tenant_id'] = Variable<String>(tenantId);
    map['name'] = Variable<String>(name);
    map['phone'] = Variable<String>(phone);
    map['credit_limit_paisa'] = Variable<int>(creditLimitPaisa);
    map['current_balance_paisa'] = Variable<int>(currentBalancePaisa);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  LocalCustomersCompanion toCompanion(bool nullToAbsent) {
    return LocalCustomersCompanion(
      id: Value(id),
      tenantId: Value(tenantId),
      name: Value(name),
      phone: Value(phone),
      creditLimitPaisa: Value(creditLimitPaisa),
      currentBalancePaisa: Value(currentBalancePaisa),
      updatedAt: Value(updatedAt),
    );
  }

  factory LocalCustomer.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalCustomer(
      id: serializer.fromJson<String>(json['id']),
      tenantId: serializer.fromJson<String>(json['tenantId']),
      name: serializer.fromJson<String>(json['name']),
      phone: serializer.fromJson<String>(json['phone']),
      creditLimitPaisa: serializer.fromJson<int>(json['creditLimitPaisa']),
      currentBalancePaisa:
          serializer.fromJson<int>(json['currentBalancePaisa']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'tenantId': serializer.toJson<String>(tenantId),
      'name': serializer.toJson<String>(name),
      'phone': serializer.toJson<String>(phone),
      'creditLimitPaisa': serializer.toJson<int>(creditLimitPaisa),
      'currentBalancePaisa': serializer.toJson<int>(currentBalancePaisa),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  LocalCustomer copyWith(
          {String? id,
          String? tenantId,
          String? name,
          String? phone,
          int? creditLimitPaisa,
          int? currentBalancePaisa,
          DateTime? updatedAt}) =>
      LocalCustomer(
        id: id ?? this.id,
        tenantId: tenantId ?? this.tenantId,
        name: name ?? this.name,
        phone: phone ?? this.phone,
        creditLimitPaisa: creditLimitPaisa ?? this.creditLimitPaisa,
        currentBalancePaisa: currentBalancePaisa ?? this.currentBalancePaisa,
        updatedAt: updatedAt ?? this.updatedAt,
      );
  LocalCustomer copyWithCompanion(LocalCustomersCompanion data) {
    return LocalCustomer(
      id: data.id.present ? data.id.value : this.id,
      tenantId: data.tenantId.present ? data.tenantId.value : this.tenantId,
      name: data.name.present ? data.name.value : this.name,
      phone: data.phone.present ? data.phone.value : this.phone,
      creditLimitPaisa: data.creditLimitPaisa.present
          ? data.creditLimitPaisa.value
          : this.creditLimitPaisa,
      currentBalancePaisa: data.currentBalancePaisa.present
          ? data.currentBalancePaisa.value
          : this.currentBalancePaisa,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalCustomer(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('name: $name, ')
          ..write('phone: $phone, ')
          ..write('creditLimitPaisa: $creditLimitPaisa, ')
          ..write('currentBalancePaisa: $currentBalancePaisa, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, tenantId, name, phone, creditLimitPaisa,
      currentBalancePaisa, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalCustomer &&
          other.id == this.id &&
          other.tenantId == this.tenantId &&
          other.name == this.name &&
          other.phone == this.phone &&
          other.creditLimitPaisa == this.creditLimitPaisa &&
          other.currentBalancePaisa == this.currentBalancePaisa &&
          other.updatedAt == this.updatedAt);
}

class LocalCustomersCompanion extends UpdateCompanion<LocalCustomer> {
  final Value<String> id;
  final Value<String> tenantId;
  final Value<String> name;
  final Value<String> phone;
  final Value<int> creditLimitPaisa;
  final Value<int> currentBalancePaisa;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const LocalCustomersCompanion({
    this.id = const Value.absent(),
    this.tenantId = const Value.absent(),
    this.name = const Value.absent(),
    this.phone = const Value.absent(),
    this.creditLimitPaisa = const Value.absent(),
    this.currentBalancePaisa = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalCustomersCompanion.insert({
    required String id,
    required String tenantId,
    required String name,
    required String phone,
    this.creditLimitPaisa = const Value.absent(),
    this.currentBalancePaisa = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        tenantId = Value(tenantId),
        name = Value(name),
        phone = Value(phone);
  static Insertable<LocalCustomer> custom({
    Expression<String>? id,
    Expression<String>? tenantId,
    Expression<String>? name,
    Expression<String>? phone,
    Expression<int>? creditLimitPaisa,
    Expression<int>? currentBalancePaisa,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (tenantId != null) 'tenant_id': tenantId,
      if (name != null) 'name': name,
      if (phone != null) 'phone': phone,
      if (creditLimitPaisa != null) 'credit_limit_paisa': creditLimitPaisa,
      if (currentBalancePaisa != null)
        'current_balance_paisa': currentBalancePaisa,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalCustomersCompanion copyWith(
      {Value<String>? id,
      Value<String>? tenantId,
      Value<String>? name,
      Value<String>? phone,
      Value<int>? creditLimitPaisa,
      Value<int>? currentBalancePaisa,
      Value<DateTime>? updatedAt,
      Value<int>? rowid}) {
    return LocalCustomersCompanion(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      creditLimitPaisa: creditLimitPaisa ?? this.creditLimitPaisa,
      currentBalancePaisa: currentBalancePaisa ?? this.currentBalancePaisa,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (tenantId.present) {
      map['tenant_id'] = Variable<String>(tenantId.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (phone.present) {
      map['phone'] = Variable<String>(phone.value);
    }
    if (creditLimitPaisa.present) {
      map['credit_limit_paisa'] = Variable<int>(creditLimitPaisa.value);
    }
    if (currentBalancePaisa.present) {
      map['current_balance_paisa'] = Variable<int>(currentBalancePaisa.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalCustomersCompanion(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('name: $name, ')
          ..write('phone: $phone, ')
          ..write('creditLimitPaisa: $creditLimitPaisa, ')
          ..write('currentBalancePaisa: $currentBalancePaisa, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalInvoicesTable extends LocalInvoices
    with TableInfo<$LocalInvoicesTable, LocalInvoice> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalInvoicesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _tenantIdMeta =
      const VerificationMeta('tenantId');
  @override
  late final GeneratedColumn<String> tenantId = GeneratedColumn<String>(
      'tenant_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _branchIdMeta =
      const VerificationMeta('branchId');
  @override
  late final GeneratedColumn<String> branchId = GeneratedColumn<String>(
      'branch_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _deviceIdMeta =
      const VerificationMeta('deviceId');
  @override
  late final GeneratedColumn<String> deviceId = GeneratedColumn<String>(
      'device_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _invoiceNumberMeta =
      const VerificationMeta('invoiceNumber');
  @override
  late final GeneratedColumn<String> invoiceNumber = GeneratedColumn<String>(
      'invoice_number', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _customerIdMeta =
      const VerificationMeta('customerId');
  @override
  late final GeneratedColumn<String> customerId = GeneratedColumn<String>(
      'customer_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _customerNameMeta =
      const VerificationMeta('customerName');
  @override
  late final GeneratedColumn<String> customerName = GeneratedColumn<String>(
      'customer_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _subtotalPaisaMeta =
      const VerificationMeta('subtotalPaisa');
  @override
  late final GeneratedColumn<int> subtotalPaisa = GeneratedColumn<int>(
      'subtotal_paisa', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _taxPaisaMeta =
      const VerificationMeta('taxPaisa');
  @override
  late final GeneratedColumn<int> taxPaisa = GeneratedColumn<int>(
      'tax_paisa', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _grandTotalPaisaMeta =
      const VerificationMeta('grandTotalPaisa');
  @override
  late final GeneratedColumn<int> grandTotalPaisa = GeneratedColumn<int>(
      'grand_total_paisa', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _paymentMethodMeta =
      const VerificationMeta('paymentMethod');
  @override
  late final GeneratedColumn<String> paymentMethod = GeneratedColumn<String>(
      'payment_method', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('completed'));
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        tenantId,
        branchId,
        deviceId,
        invoiceNumber,
        customerId,
        customerName,
        subtotalPaisa,
        taxPaisa,
        grandTotalPaisa,
        paymentMethod,
        status,
        createdAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_invoices';
  @override
  VerificationContext validateIntegrity(Insertable<LocalInvoice> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('tenant_id')) {
      context.handle(_tenantIdMeta,
          tenantId.isAcceptableOrUnknown(data['tenant_id']!, _tenantIdMeta));
    } else if (isInserting) {
      context.missing(_tenantIdMeta);
    }
    if (data.containsKey('branch_id')) {
      context.handle(_branchIdMeta,
          branchId.isAcceptableOrUnknown(data['branch_id']!, _branchIdMeta));
    } else if (isInserting) {
      context.missing(_branchIdMeta);
    }
    if (data.containsKey('device_id')) {
      context.handle(_deviceIdMeta,
          deviceId.isAcceptableOrUnknown(data['device_id']!, _deviceIdMeta));
    } else if (isInserting) {
      context.missing(_deviceIdMeta);
    }
    if (data.containsKey('invoice_number')) {
      context.handle(
          _invoiceNumberMeta,
          invoiceNumber.isAcceptableOrUnknown(
              data['invoice_number']!, _invoiceNumberMeta));
    } else if (isInserting) {
      context.missing(_invoiceNumberMeta);
    }
    if (data.containsKey('customer_id')) {
      context.handle(
          _customerIdMeta,
          customerId.isAcceptableOrUnknown(
              data['customer_id']!, _customerIdMeta));
    }
    if (data.containsKey('customer_name')) {
      context.handle(
          _customerNameMeta,
          customerName.isAcceptableOrUnknown(
              data['customer_name']!, _customerNameMeta));
    }
    if (data.containsKey('subtotal_paisa')) {
      context.handle(
          _subtotalPaisaMeta,
          subtotalPaisa.isAcceptableOrUnknown(
              data['subtotal_paisa']!, _subtotalPaisaMeta));
    } else if (isInserting) {
      context.missing(_subtotalPaisaMeta);
    }
    if (data.containsKey('tax_paisa')) {
      context.handle(_taxPaisaMeta,
          taxPaisa.isAcceptableOrUnknown(data['tax_paisa']!, _taxPaisaMeta));
    } else if (isInserting) {
      context.missing(_taxPaisaMeta);
    }
    if (data.containsKey('grand_total_paisa')) {
      context.handle(
          _grandTotalPaisaMeta,
          grandTotalPaisa.isAcceptableOrUnknown(
              data['grand_total_paisa']!, _grandTotalPaisaMeta));
    } else if (isInserting) {
      context.missing(_grandTotalPaisaMeta);
    }
    if (data.containsKey('payment_method')) {
      context.handle(
          _paymentMethodMeta,
          paymentMethod.isAcceptableOrUnknown(
              data['payment_method']!, _paymentMethodMeta));
    } else if (isInserting) {
      context.missing(_paymentMethodMeta);
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalInvoice map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalInvoice(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      tenantId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}tenant_id'])!,
      branchId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}branch_id'])!,
      deviceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}device_id'])!,
      invoiceNumber: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}invoice_number'])!,
      customerId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}customer_id']),
      customerName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}customer_name']),
      subtotalPaisa: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}subtotal_paisa'])!,
      taxPaisa: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}tax_paisa'])!,
      grandTotalPaisa: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}grand_total_paisa'])!,
      paymentMethod: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payment_method'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
    );
  }

  @override
  $LocalInvoicesTable createAlias(String alias) {
    return $LocalInvoicesTable(attachedDatabase, alias);
  }
}

class LocalInvoice extends DataClass implements Insertable<LocalInvoice> {
  final String id;
  final String tenantId;
  final String branchId;
  final String deviceId;
  final String invoiceNumber;
  final String? customerId;
  final String? customerName;
  final int subtotalPaisa;
  final int taxPaisa;
  final int grandTotalPaisa;
  final String paymentMethod;
  final String status;
  final DateTime createdAt;
  const LocalInvoice(
      {required this.id,
      required this.tenantId,
      required this.branchId,
      required this.deviceId,
      required this.invoiceNumber,
      this.customerId,
      this.customerName,
      required this.subtotalPaisa,
      required this.taxPaisa,
      required this.grandTotalPaisa,
      required this.paymentMethod,
      required this.status,
      required this.createdAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['tenant_id'] = Variable<String>(tenantId);
    map['branch_id'] = Variable<String>(branchId);
    map['device_id'] = Variable<String>(deviceId);
    map['invoice_number'] = Variable<String>(invoiceNumber);
    if (!nullToAbsent || customerId != null) {
      map['customer_id'] = Variable<String>(customerId);
    }
    if (!nullToAbsent || customerName != null) {
      map['customer_name'] = Variable<String>(customerName);
    }
    map['subtotal_paisa'] = Variable<int>(subtotalPaisa);
    map['tax_paisa'] = Variable<int>(taxPaisa);
    map['grand_total_paisa'] = Variable<int>(grandTotalPaisa);
    map['payment_method'] = Variable<String>(paymentMethod);
    map['status'] = Variable<String>(status);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  LocalInvoicesCompanion toCompanion(bool nullToAbsent) {
    return LocalInvoicesCompanion(
      id: Value(id),
      tenantId: Value(tenantId),
      branchId: Value(branchId),
      deviceId: Value(deviceId),
      invoiceNumber: Value(invoiceNumber),
      customerId: customerId == null && nullToAbsent
          ? const Value.absent()
          : Value(customerId),
      customerName: customerName == null && nullToAbsent
          ? const Value.absent()
          : Value(customerName),
      subtotalPaisa: Value(subtotalPaisa),
      taxPaisa: Value(taxPaisa),
      grandTotalPaisa: Value(grandTotalPaisa),
      paymentMethod: Value(paymentMethod),
      status: Value(status),
      createdAt: Value(createdAt),
    );
  }

  factory LocalInvoice.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalInvoice(
      id: serializer.fromJson<String>(json['id']),
      tenantId: serializer.fromJson<String>(json['tenantId']),
      branchId: serializer.fromJson<String>(json['branchId']),
      deviceId: serializer.fromJson<String>(json['deviceId']),
      invoiceNumber: serializer.fromJson<String>(json['invoiceNumber']),
      customerId: serializer.fromJson<String?>(json['customerId']),
      customerName: serializer.fromJson<String?>(json['customerName']),
      subtotalPaisa: serializer.fromJson<int>(json['subtotalPaisa']),
      taxPaisa: serializer.fromJson<int>(json['taxPaisa']),
      grandTotalPaisa: serializer.fromJson<int>(json['grandTotalPaisa']),
      paymentMethod: serializer.fromJson<String>(json['paymentMethod']),
      status: serializer.fromJson<String>(json['status']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'tenantId': serializer.toJson<String>(tenantId),
      'branchId': serializer.toJson<String>(branchId),
      'deviceId': serializer.toJson<String>(deviceId),
      'invoiceNumber': serializer.toJson<String>(invoiceNumber),
      'customerId': serializer.toJson<String?>(customerId),
      'customerName': serializer.toJson<String?>(customerName),
      'subtotalPaisa': serializer.toJson<int>(subtotalPaisa),
      'taxPaisa': serializer.toJson<int>(taxPaisa),
      'grandTotalPaisa': serializer.toJson<int>(grandTotalPaisa),
      'paymentMethod': serializer.toJson<String>(paymentMethod),
      'status': serializer.toJson<String>(status),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  LocalInvoice copyWith(
          {String? id,
          String? tenantId,
          String? branchId,
          String? deviceId,
          String? invoiceNumber,
          Value<String?> customerId = const Value.absent(),
          Value<String?> customerName = const Value.absent(),
          int? subtotalPaisa,
          int? taxPaisa,
          int? grandTotalPaisa,
          String? paymentMethod,
          String? status,
          DateTime? createdAt}) =>
      LocalInvoice(
        id: id ?? this.id,
        tenantId: tenantId ?? this.tenantId,
        branchId: branchId ?? this.branchId,
        deviceId: deviceId ?? this.deviceId,
        invoiceNumber: invoiceNumber ?? this.invoiceNumber,
        customerId: customerId.present ? customerId.value : this.customerId,
        customerName:
            customerName.present ? customerName.value : this.customerName,
        subtotalPaisa: subtotalPaisa ?? this.subtotalPaisa,
        taxPaisa: taxPaisa ?? this.taxPaisa,
        grandTotalPaisa: grandTotalPaisa ?? this.grandTotalPaisa,
        paymentMethod: paymentMethod ?? this.paymentMethod,
        status: status ?? this.status,
        createdAt: createdAt ?? this.createdAt,
      );
  LocalInvoice copyWithCompanion(LocalInvoicesCompanion data) {
    return LocalInvoice(
      id: data.id.present ? data.id.value : this.id,
      tenantId: data.tenantId.present ? data.tenantId.value : this.tenantId,
      branchId: data.branchId.present ? data.branchId.value : this.branchId,
      deviceId: data.deviceId.present ? data.deviceId.value : this.deviceId,
      invoiceNumber: data.invoiceNumber.present
          ? data.invoiceNumber.value
          : this.invoiceNumber,
      customerId:
          data.customerId.present ? data.customerId.value : this.customerId,
      customerName: data.customerName.present
          ? data.customerName.value
          : this.customerName,
      subtotalPaisa: data.subtotalPaisa.present
          ? data.subtotalPaisa.value
          : this.subtotalPaisa,
      taxPaisa: data.taxPaisa.present ? data.taxPaisa.value : this.taxPaisa,
      grandTotalPaisa: data.grandTotalPaisa.present
          ? data.grandTotalPaisa.value
          : this.grandTotalPaisa,
      paymentMethod: data.paymentMethod.present
          ? data.paymentMethod.value
          : this.paymentMethod,
      status: data.status.present ? data.status.value : this.status,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalInvoice(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('branchId: $branchId, ')
          ..write('deviceId: $deviceId, ')
          ..write('invoiceNumber: $invoiceNumber, ')
          ..write('customerId: $customerId, ')
          ..write('customerName: $customerName, ')
          ..write('subtotalPaisa: $subtotalPaisa, ')
          ..write('taxPaisa: $taxPaisa, ')
          ..write('grandTotalPaisa: $grandTotalPaisa, ')
          ..write('paymentMethod: $paymentMethod, ')
          ..write('status: $status, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      tenantId,
      branchId,
      deviceId,
      invoiceNumber,
      customerId,
      customerName,
      subtotalPaisa,
      taxPaisa,
      grandTotalPaisa,
      paymentMethod,
      status,
      createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalInvoice &&
          other.id == this.id &&
          other.tenantId == this.tenantId &&
          other.branchId == this.branchId &&
          other.deviceId == this.deviceId &&
          other.invoiceNumber == this.invoiceNumber &&
          other.customerId == this.customerId &&
          other.customerName == this.customerName &&
          other.subtotalPaisa == this.subtotalPaisa &&
          other.taxPaisa == this.taxPaisa &&
          other.grandTotalPaisa == this.grandTotalPaisa &&
          other.paymentMethod == this.paymentMethod &&
          other.status == this.status &&
          other.createdAt == this.createdAt);
}

class LocalInvoicesCompanion extends UpdateCompanion<LocalInvoice> {
  final Value<String> id;
  final Value<String> tenantId;
  final Value<String> branchId;
  final Value<String> deviceId;
  final Value<String> invoiceNumber;
  final Value<String?> customerId;
  final Value<String?> customerName;
  final Value<int> subtotalPaisa;
  final Value<int> taxPaisa;
  final Value<int> grandTotalPaisa;
  final Value<String> paymentMethod;
  final Value<String> status;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const LocalInvoicesCompanion({
    this.id = const Value.absent(),
    this.tenantId = const Value.absent(),
    this.branchId = const Value.absent(),
    this.deviceId = const Value.absent(),
    this.invoiceNumber = const Value.absent(),
    this.customerId = const Value.absent(),
    this.customerName = const Value.absent(),
    this.subtotalPaisa = const Value.absent(),
    this.taxPaisa = const Value.absent(),
    this.grandTotalPaisa = const Value.absent(),
    this.paymentMethod = const Value.absent(),
    this.status = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalInvoicesCompanion.insert({
    required String id,
    required String tenantId,
    required String branchId,
    required String deviceId,
    required String invoiceNumber,
    this.customerId = const Value.absent(),
    this.customerName = const Value.absent(),
    required int subtotalPaisa,
    required int taxPaisa,
    required int grandTotalPaisa,
    required String paymentMethod,
    this.status = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        tenantId = Value(tenantId),
        branchId = Value(branchId),
        deviceId = Value(deviceId),
        invoiceNumber = Value(invoiceNumber),
        subtotalPaisa = Value(subtotalPaisa),
        taxPaisa = Value(taxPaisa),
        grandTotalPaisa = Value(grandTotalPaisa),
        paymentMethod = Value(paymentMethod);
  static Insertable<LocalInvoice> custom({
    Expression<String>? id,
    Expression<String>? tenantId,
    Expression<String>? branchId,
    Expression<String>? deviceId,
    Expression<String>? invoiceNumber,
    Expression<String>? customerId,
    Expression<String>? customerName,
    Expression<int>? subtotalPaisa,
    Expression<int>? taxPaisa,
    Expression<int>? grandTotalPaisa,
    Expression<String>? paymentMethod,
    Expression<String>? status,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (tenantId != null) 'tenant_id': tenantId,
      if (branchId != null) 'branch_id': branchId,
      if (deviceId != null) 'device_id': deviceId,
      if (invoiceNumber != null) 'invoice_number': invoiceNumber,
      if (customerId != null) 'customer_id': customerId,
      if (customerName != null) 'customer_name': customerName,
      if (subtotalPaisa != null) 'subtotal_paisa': subtotalPaisa,
      if (taxPaisa != null) 'tax_paisa': taxPaisa,
      if (grandTotalPaisa != null) 'grand_total_paisa': grandTotalPaisa,
      if (paymentMethod != null) 'payment_method': paymentMethod,
      if (status != null) 'status': status,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalInvoicesCompanion copyWith(
      {Value<String>? id,
      Value<String>? tenantId,
      Value<String>? branchId,
      Value<String>? deviceId,
      Value<String>? invoiceNumber,
      Value<String?>? customerId,
      Value<String?>? customerName,
      Value<int>? subtotalPaisa,
      Value<int>? taxPaisa,
      Value<int>? grandTotalPaisa,
      Value<String>? paymentMethod,
      Value<String>? status,
      Value<DateTime>? createdAt,
      Value<int>? rowid}) {
    return LocalInvoicesCompanion(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      branchId: branchId ?? this.branchId,
      deviceId: deviceId ?? this.deviceId,
      invoiceNumber: invoiceNumber ?? this.invoiceNumber,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      subtotalPaisa: subtotalPaisa ?? this.subtotalPaisa,
      taxPaisa: taxPaisa ?? this.taxPaisa,
      grandTotalPaisa: grandTotalPaisa ?? this.grandTotalPaisa,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (tenantId.present) {
      map['tenant_id'] = Variable<String>(tenantId.value);
    }
    if (branchId.present) {
      map['branch_id'] = Variable<String>(branchId.value);
    }
    if (deviceId.present) {
      map['device_id'] = Variable<String>(deviceId.value);
    }
    if (invoiceNumber.present) {
      map['invoice_number'] = Variable<String>(invoiceNumber.value);
    }
    if (customerId.present) {
      map['customer_id'] = Variable<String>(customerId.value);
    }
    if (customerName.present) {
      map['customer_name'] = Variable<String>(customerName.value);
    }
    if (subtotalPaisa.present) {
      map['subtotal_paisa'] = Variable<int>(subtotalPaisa.value);
    }
    if (taxPaisa.present) {
      map['tax_paisa'] = Variable<int>(taxPaisa.value);
    }
    if (grandTotalPaisa.present) {
      map['grand_total_paisa'] = Variable<int>(grandTotalPaisa.value);
    }
    if (paymentMethod.present) {
      map['payment_method'] = Variable<String>(paymentMethod.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalInvoicesCompanion(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('branchId: $branchId, ')
          ..write('deviceId: $deviceId, ')
          ..write('invoiceNumber: $invoiceNumber, ')
          ..write('customerId: $customerId, ')
          ..write('customerName: $customerName, ')
          ..write('subtotalPaisa: $subtotalPaisa, ')
          ..write('taxPaisa: $taxPaisa, ')
          ..write('grandTotalPaisa: $grandTotalPaisa, ')
          ..write('paymentMethod: $paymentMethod, ')
          ..write('status: $status, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalInvoiceLinesTable extends LocalInvoiceLines
    with TableInfo<$LocalInvoiceLinesTable, LocalInvoiceLine> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalInvoiceLinesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _invoiceIdMeta =
      const VerificationMeta('invoiceId');
  @override
  late final GeneratedColumn<String> invoiceId = GeneratedColumn<String>(
      'invoice_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _productIdMeta =
      const VerificationMeta('productId');
  @override
  late final GeneratedColumn<String> productId = GeneratedColumn<String>(
      'product_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _productNameMeta =
      const VerificationMeta('productName');
  @override
  late final GeneratedColumn<String> productName = GeneratedColumn<String>(
      'product_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _hsnCodeMeta =
      const VerificationMeta('hsnCode');
  @override
  late final GeneratedColumn<String> hsnCode = GeneratedColumn<String>(
      'hsn_code', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _gstRatePercentMeta =
      const VerificationMeta('gstRatePercent');
  @override
  late final GeneratedColumn<double> gstRatePercent = GeneratedColumn<double>(
      'gst_rate_percent', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(0.0));
  static const VerificationMeta _quantityMeta =
      const VerificationMeta('quantity');
  @override
  late final GeneratedColumn<double> quantity = GeneratedColumn<double>(
      'quantity', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _unitPricePaisaMeta =
      const VerificationMeta('unitPricePaisa');
  @override
  late final GeneratedColumn<int> unitPricePaisa = GeneratedColumn<int>(
      'unit_price_paisa', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _taxPaisaMeta =
      const VerificationMeta('taxPaisa');
  @override
  late final GeneratedColumn<int> taxPaisa = GeneratedColumn<int>(
      'tax_paisa', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _totalPaisaMeta =
      const VerificationMeta('totalPaisa');
  @override
  late final GeneratedColumn<int> totalPaisa = GeneratedColumn<int>(
      'total_paisa', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        invoiceId,
        productId,
        productName,
        hsnCode,
        gstRatePercent,
        quantity,
        unitPricePaisa,
        taxPaisa,
        totalPaisa
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_invoice_lines';
  @override
  VerificationContext validateIntegrity(Insertable<LocalInvoiceLine> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('invoice_id')) {
      context.handle(_invoiceIdMeta,
          invoiceId.isAcceptableOrUnknown(data['invoice_id']!, _invoiceIdMeta));
    } else if (isInserting) {
      context.missing(_invoiceIdMeta);
    }
    if (data.containsKey('product_id')) {
      context.handle(_productIdMeta,
          productId.isAcceptableOrUnknown(data['product_id']!, _productIdMeta));
    } else if (isInserting) {
      context.missing(_productIdMeta);
    }
    if (data.containsKey('product_name')) {
      context.handle(
          _productNameMeta,
          productName.isAcceptableOrUnknown(
              data['product_name']!, _productNameMeta));
    } else if (isInserting) {
      context.missing(_productNameMeta);
    }
    if (data.containsKey('hsn_code')) {
      context.handle(_hsnCodeMeta,
          hsnCode.isAcceptableOrUnknown(data['hsn_code']!, _hsnCodeMeta));
    }
    if (data.containsKey('gst_rate_percent')) {
      context.handle(
          _gstRatePercentMeta,
          gstRatePercent.isAcceptableOrUnknown(
              data['gst_rate_percent']!, _gstRatePercentMeta));
    }
    if (data.containsKey('quantity')) {
      context.handle(_quantityMeta,
          quantity.isAcceptableOrUnknown(data['quantity']!, _quantityMeta));
    } else if (isInserting) {
      context.missing(_quantityMeta);
    }
    if (data.containsKey('unit_price_paisa')) {
      context.handle(
          _unitPricePaisaMeta,
          unitPricePaisa.isAcceptableOrUnknown(
              data['unit_price_paisa']!, _unitPricePaisaMeta));
    } else if (isInserting) {
      context.missing(_unitPricePaisaMeta);
    }
    if (data.containsKey('tax_paisa')) {
      context.handle(_taxPaisaMeta,
          taxPaisa.isAcceptableOrUnknown(data['tax_paisa']!, _taxPaisaMeta));
    } else if (isInserting) {
      context.missing(_taxPaisaMeta);
    }
    if (data.containsKey('total_paisa')) {
      context.handle(
          _totalPaisaMeta,
          totalPaisa.isAcceptableOrUnknown(
              data['total_paisa']!, _totalPaisaMeta));
    } else if (isInserting) {
      context.missing(_totalPaisaMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalInvoiceLine map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalInvoiceLine(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      invoiceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}invoice_id'])!,
      productId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}product_id'])!,
      productName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}product_name'])!,
      hsnCode: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}hsn_code']),
      gstRatePercent: attachedDatabase.typeMapping.read(
          DriftSqlType.double, data['${effectivePrefix}gst_rate_percent'])!,
      quantity: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}quantity'])!,
      unitPricePaisa: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}unit_price_paisa'])!,
      taxPaisa: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}tax_paisa'])!,
      totalPaisa: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}total_paisa'])!,
    );
  }

  @override
  $LocalInvoiceLinesTable createAlias(String alias) {
    return $LocalInvoiceLinesTable(attachedDatabase, alias);
  }
}

class LocalInvoiceLine extends DataClass
    implements Insertable<LocalInvoiceLine> {
  final String id;
  final String invoiceId;
  final String productId;
  final String productName;
  final String? hsnCode;
  final double gstRatePercent;
  final double quantity;
  final int unitPricePaisa;
  final int taxPaisa;
  final int totalPaisa;
  const LocalInvoiceLine(
      {required this.id,
      required this.invoiceId,
      required this.productId,
      required this.productName,
      this.hsnCode,
      required this.gstRatePercent,
      required this.quantity,
      required this.unitPricePaisa,
      required this.taxPaisa,
      required this.totalPaisa});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['invoice_id'] = Variable<String>(invoiceId);
    map['product_id'] = Variable<String>(productId);
    map['product_name'] = Variable<String>(productName);
    if (!nullToAbsent || hsnCode != null) {
      map['hsn_code'] = Variable<String>(hsnCode);
    }
    map['gst_rate_percent'] = Variable<double>(gstRatePercent);
    map['quantity'] = Variable<double>(quantity);
    map['unit_price_paisa'] = Variable<int>(unitPricePaisa);
    map['tax_paisa'] = Variable<int>(taxPaisa);
    map['total_paisa'] = Variable<int>(totalPaisa);
    return map;
  }

  LocalInvoiceLinesCompanion toCompanion(bool nullToAbsent) {
    return LocalInvoiceLinesCompanion(
      id: Value(id),
      invoiceId: Value(invoiceId),
      productId: Value(productId),
      productName: Value(productName),
      hsnCode: hsnCode == null && nullToAbsent
          ? const Value.absent()
          : Value(hsnCode),
      gstRatePercent: Value(gstRatePercent),
      quantity: Value(quantity),
      unitPricePaisa: Value(unitPricePaisa),
      taxPaisa: Value(taxPaisa),
      totalPaisa: Value(totalPaisa),
    );
  }

  factory LocalInvoiceLine.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalInvoiceLine(
      id: serializer.fromJson<String>(json['id']),
      invoiceId: serializer.fromJson<String>(json['invoiceId']),
      productId: serializer.fromJson<String>(json['productId']),
      productName: serializer.fromJson<String>(json['productName']),
      hsnCode: serializer.fromJson<String?>(json['hsnCode']),
      gstRatePercent: serializer.fromJson<double>(json['gstRatePercent']),
      quantity: serializer.fromJson<double>(json['quantity']),
      unitPricePaisa: serializer.fromJson<int>(json['unitPricePaisa']),
      taxPaisa: serializer.fromJson<int>(json['taxPaisa']),
      totalPaisa: serializer.fromJson<int>(json['totalPaisa']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'invoiceId': serializer.toJson<String>(invoiceId),
      'productId': serializer.toJson<String>(productId),
      'productName': serializer.toJson<String>(productName),
      'hsnCode': serializer.toJson<String?>(hsnCode),
      'gstRatePercent': serializer.toJson<double>(gstRatePercent),
      'quantity': serializer.toJson<double>(quantity),
      'unitPricePaisa': serializer.toJson<int>(unitPricePaisa),
      'taxPaisa': serializer.toJson<int>(taxPaisa),
      'totalPaisa': serializer.toJson<int>(totalPaisa),
    };
  }

  LocalInvoiceLine copyWith(
          {String? id,
          String? invoiceId,
          String? productId,
          String? productName,
          Value<String?> hsnCode = const Value.absent(),
          double? gstRatePercent,
          double? quantity,
          int? unitPricePaisa,
          int? taxPaisa,
          int? totalPaisa}) =>
      LocalInvoiceLine(
        id: id ?? this.id,
        invoiceId: invoiceId ?? this.invoiceId,
        productId: productId ?? this.productId,
        productName: productName ?? this.productName,
        hsnCode: hsnCode.present ? hsnCode.value : this.hsnCode,
        gstRatePercent: gstRatePercent ?? this.gstRatePercent,
        quantity: quantity ?? this.quantity,
        unitPricePaisa: unitPricePaisa ?? this.unitPricePaisa,
        taxPaisa: taxPaisa ?? this.taxPaisa,
        totalPaisa: totalPaisa ?? this.totalPaisa,
      );
  LocalInvoiceLine copyWithCompanion(LocalInvoiceLinesCompanion data) {
    return LocalInvoiceLine(
      id: data.id.present ? data.id.value : this.id,
      invoiceId: data.invoiceId.present ? data.invoiceId.value : this.invoiceId,
      productId: data.productId.present ? data.productId.value : this.productId,
      productName:
          data.productName.present ? data.productName.value : this.productName,
      hsnCode: data.hsnCode.present ? data.hsnCode.value : this.hsnCode,
      gstRatePercent: data.gstRatePercent.present
          ? data.gstRatePercent.value
          : this.gstRatePercent,
      quantity: data.quantity.present ? data.quantity.value : this.quantity,
      unitPricePaisa: data.unitPricePaisa.present
          ? data.unitPricePaisa.value
          : this.unitPricePaisa,
      taxPaisa: data.taxPaisa.present ? data.taxPaisa.value : this.taxPaisa,
      totalPaisa:
          data.totalPaisa.present ? data.totalPaisa.value : this.totalPaisa,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalInvoiceLine(')
          ..write('id: $id, ')
          ..write('invoiceId: $invoiceId, ')
          ..write('productId: $productId, ')
          ..write('productName: $productName, ')
          ..write('hsnCode: $hsnCode, ')
          ..write('gstRatePercent: $gstRatePercent, ')
          ..write('quantity: $quantity, ')
          ..write('unitPricePaisa: $unitPricePaisa, ')
          ..write('taxPaisa: $taxPaisa, ')
          ..write('totalPaisa: $totalPaisa')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, invoiceId, productId, productName,
      hsnCode, gstRatePercent, quantity, unitPricePaisa, taxPaisa, totalPaisa);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalInvoiceLine &&
          other.id == this.id &&
          other.invoiceId == this.invoiceId &&
          other.productId == this.productId &&
          other.productName == this.productName &&
          other.hsnCode == this.hsnCode &&
          other.gstRatePercent == this.gstRatePercent &&
          other.quantity == this.quantity &&
          other.unitPricePaisa == this.unitPricePaisa &&
          other.taxPaisa == this.taxPaisa &&
          other.totalPaisa == this.totalPaisa);
}

class LocalInvoiceLinesCompanion extends UpdateCompanion<LocalInvoiceLine> {
  final Value<String> id;
  final Value<String> invoiceId;
  final Value<String> productId;
  final Value<String> productName;
  final Value<String?> hsnCode;
  final Value<double> gstRatePercent;
  final Value<double> quantity;
  final Value<int> unitPricePaisa;
  final Value<int> taxPaisa;
  final Value<int> totalPaisa;
  final Value<int> rowid;
  const LocalInvoiceLinesCompanion({
    this.id = const Value.absent(),
    this.invoiceId = const Value.absent(),
    this.productId = const Value.absent(),
    this.productName = const Value.absent(),
    this.hsnCode = const Value.absent(),
    this.gstRatePercent = const Value.absent(),
    this.quantity = const Value.absent(),
    this.unitPricePaisa = const Value.absent(),
    this.taxPaisa = const Value.absent(),
    this.totalPaisa = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalInvoiceLinesCompanion.insert({
    required String id,
    required String invoiceId,
    required String productId,
    required String productName,
    this.hsnCode = const Value.absent(),
    this.gstRatePercent = const Value.absent(),
    required double quantity,
    required int unitPricePaisa,
    required int taxPaisa,
    required int totalPaisa,
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        invoiceId = Value(invoiceId),
        productId = Value(productId),
        productName = Value(productName),
        quantity = Value(quantity),
        unitPricePaisa = Value(unitPricePaisa),
        taxPaisa = Value(taxPaisa),
        totalPaisa = Value(totalPaisa);
  static Insertable<LocalInvoiceLine> custom({
    Expression<String>? id,
    Expression<String>? invoiceId,
    Expression<String>? productId,
    Expression<String>? productName,
    Expression<String>? hsnCode,
    Expression<double>? gstRatePercent,
    Expression<double>? quantity,
    Expression<int>? unitPricePaisa,
    Expression<int>? taxPaisa,
    Expression<int>? totalPaisa,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (invoiceId != null) 'invoice_id': invoiceId,
      if (productId != null) 'product_id': productId,
      if (productName != null) 'product_name': productName,
      if (hsnCode != null) 'hsn_code': hsnCode,
      if (gstRatePercent != null) 'gst_rate_percent': gstRatePercent,
      if (quantity != null) 'quantity': quantity,
      if (unitPricePaisa != null) 'unit_price_paisa': unitPricePaisa,
      if (taxPaisa != null) 'tax_paisa': taxPaisa,
      if (totalPaisa != null) 'total_paisa': totalPaisa,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalInvoiceLinesCompanion copyWith(
      {Value<String>? id,
      Value<String>? invoiceId,
      Value<String>? productId,
      Value<String>? productName,
      Value<String?>? hsnCode,
      Value<double>? gstRatePercent,
      Value<double>? quantity,
      Value<int>? unitPricePaisa,
      Value<int>? taxPaisa,
      Value<int>? totalPaisa,
      Value<int>? rowid}) {
    return LocalInvoiceLinesCompanion(
      id: id ?? this.id,
      invoiceId: invoiceId ?? this.invoiceId,
      productId: productId ?? this.productId,
      productName: productName ?? this.productName,
      hsnCode: hsnCode ?? this.hsnCode,
      gstRatePercent: gstRatePercent ?? this.gstRatePercent,
      quantity: quantity ?? this.quantity,
      unitPricePaisa: unitPricePaisa ?? this.unitPricePaisa,
      taxPaisa: taxPaisa ?? this.taxPaisa,
      totalPaisa: totalPaisa ?? this.totalPaisa,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (invoiceId.present) {
      map['invoice_id'] = Variable<String>(invoiceId.value);
    }
    if (productId.present) {
      map['product_id'] = Variable<String>(productId.value);
    }
    if (productName.present) {
      map['product_name'] = Variable<String>(productName.value);
    }
    if (hsnCode.present) {
      map['hsn_code'] = Variable<String>(hsnCode.value);
    }
    if (gstRatePercent.present) {
      map['gst_rate_percent'] = Variable<double>(gstRatePercent.value);
    }
    if (quantity.present) {
      map['quantity'] = Variable<double>(quantity.value);
    }
    if (unitPricePaisa.present) {
      map['unit_price_paisa'] = Variable<int>(unitPricePaisa.value);
    }
    if (taxPaisa.present) {
      map['tax_paisa'] = Variable<int>(taxPaisa.value);
    }
    if (totalPaisa.present) {
      map['total_paisa'] = Variable<int>(totalPaisa.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalInvoiceLinesCompanion(')
          ..write('id: $id, ')
          ..write('invoiceId: $invoiceId, ')
          ..write('productId: $productId, ')
          ..write('productName: $productName, ')
          ..write('hsnCode: $hsnCode, ')
          ..write('gstRatePercent: $gstRatePercent, ')
          ..write('quantity: $quantity, ')
          ..write('unitPricePaisa: $unitPricePaisa, ')
          ..write('taxPaisa: $taxPaisa, ')
          ..write('totalPaisa: $totalPaisa, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalPaymentsTable extends LocalPayments
    with TableInfo<$LocalPaymentsTable, LocalPayment> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalPaymentsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _invoiceIdMeta =
      const VerificationMeta('invoiceId');
  @override
  late final GeneratedColumn<String> invoiceId = GeneratedColumn<String>(
      'invoice_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _paymentMethodMeta =
      const VerificationMeta('paymentMethod');
  @override
  late final GeneratedColumn<String> paymentMethod = GeneratedColumn<String>(
      'payment_method', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _amountPaisaMeta =
      const VerificationMeta('amountPaisa');
  @override
  late final GeneratedColumn<int> amountPaisa = GeneratedColumn<int>(
      'amount_paisa', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('completed'));
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns =>
      [id, invoiceId, paymentMethod, amountPaisa, status, createdAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_payments';
  @override
  VerificationContext validateIntegrity(Insertable<LocalPayment> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('invoice_id')) {
      context.handle(_invoiceIdMeta,
          invoiceId.isAcceptableOrUnknown(data['invoice_id']!, _invoiceIdMeta));
    } else if (isInserting) {
      context.missing(_invoiceIdMeta);
    }
    if (data.containsKey('payment_method')) {
      context.handle(
          _paymentMethodMeta,
          paymentMethod.isAcceptableOrUnknown(
              data['payment_method']!, _paymentMethodMeta));
    } else if (isInserting) {
      context.missing(_paymentMethodMeta);
    }
    if (data.containsKey('amount_paisa')) {
      context.handle(
          _amountPaisaMeta,
          amountPaisa.isAcceptableOrUnknown(
              data['amount_paisa']!, _amountPaisaMeta));
    } else if (isInserting) {
      context.missing(_amountPaisaMeta);
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalPayment map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalPayment(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      invoiceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}invoice_id'])!,
      paymentMethod: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payment_method'])!,
      amountPaisa: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}amount_paisa'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
    );
  }

  @override
  $LocalPaymentsTable createAlias(String alias) {
    return $LocalPaymentsTable(attachedDatabase, alias);
  }
}

class LocalPayment extends DataClass implements Insertable<LocalPayment> {
  final String id;
  final String invoiceId;
  final String paymentMethod;
  final int amountPaisa;
  final String status;
  final DateTime createdAt;
  const LocalPayment(
      {required this.id,
      required this.invoiceId,
      required this.paymentMethod,
      required this.amountPaisa,
      required this.status,
      required this.createdAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['invoice_id'] = Variable<String>(invoiceId);
    map['payment_method'] = Variable<String>(paymentMethod);
    map['amount_paisa'] = Variable<int>(amountPaisa);
    map['status'] = Variable<String>(status);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  LocalPaymentsCompanion toCompanion(bool nullToAbsent) {
    return LocalPaymentsCompanion(
      id: Value(id),
      invoiceId: Value(invoiceId),
      paymentMethod: Value(paymentMethod),
      amountPaisa: Value(amountPaisa),
      status: Value(status),
      createdAt: Value(createdAt),
    );
  }

  factory LocalPayment.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalPayment(
      id: serializer.fromJson<String>(json['id']),
      invoiceId: serializer.fromJson<String>(json['invoiceId']),
      paymentMethod: serializer.fromJson<String>(json['paymentMethod']),
      amountPaisa: serializer.fromJson<int>(json['amountPaisa']),
      status: serializer.fromJson<String>(json['status']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'invoiceId': serializer.toJson<String>(invoiceId),
      'paymentMethod': serializer.toJson<String>(paymentMethod),
      'amountPaisa': serializer.toJson<int>(amountPaisa),
      'status': serializer.toJson<String>(status),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  LocalPayment copyWith(
          {String? id,
          String? invoiceId,
          String? paymentMethod,
          int? amountPaisa,
          String? status,
          DateTime? createdAt}) =>
      LocalPayment(
        id: id ?? this.id,
        invoiceId: invoiceId ?? this.invoiceId,
        paymentMethod: paymentMethod ?? this.paymentMethod,
        amountPaisa: amountPaisa ?? this.amountPaisa,
        status: status ?? this.status,
        createdAt: createdAt ?? this.createdAt,
      );
  LocalPayment copyWithCompanion(LocalPaymentsCompanion data) {
    return LocalPayment(
      id: data.id.present ? data.id.value : this.id,
      invoiceId: data.invoiceId.present ? data.invoiceId.value : this.invoiceId,
      paymentMethod: data.paymentMethod.present
          ? data.paymentMethod.value
          : this.paymentMethod,
      amountPaisa:
          data.amountPaisa.present ? data.amountPaisa.value : this.amountPaisa,
      status: data.status.present ? data.status.value : this.status,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalPayment(')
          ..write('id: $id, ')
          ..write('invoiceId: $invoiceId, ')
          ..write('paymentMethod: $paymentMethod, ')
          ..write('amountPaisa: $amountPaisa, ')
          ..write('status: $status, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, invoiceId, paymentMethod, amountPaisa, status, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalPayment &&
          other.id == this.id &&
          other.invoiceId == this.invoiceId &&
          other.paymentMethod == this.paymentMethod &&
          other.amountPaisa == this.amountPaisa &&
          other.status == this.status &&
          other.createdAt == this.createdAt);
}

class LocalPaymentsCompanion extends UpdateCompanion<LocalPayment> {
  final Value<String> id;
  final Value<String> invoiceId;
  final Value<String> paymentMethod;
  final Value<int> amountPaisa;
  final Value<String> status;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const LocalPaymentsCompanion({
    this.id = const Value.absent(),
    this.invoiceId = const Value.absent(),
    this.paymentMethod = const Value.absent(),
    this.amountPaisa = const Value.absent(),
    this.status = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalPaymentsCompanion.insert({
    required String id,
    required String invoiceId,
    required String paymentMethod,
    required int amountPaisa,
    this.status = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        invoiceId = Value(invoiceId),
        paymentMethod = Value(paymentMethod),
        amountPaisa = Value(amountPaisa);
  static Insertable<LocalPayment> custom({
    Expression<String>? id,
    Expression<String>? invoiceId,
    Expression<String>? paymentMethod,
    Expression<int>? amountPaisa,
    Expression<String>? status,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (invoiceId != null) 'invoice_id': invoiceId,
      if (paymentMethod != null) 'payment_method': paymentMethod,
      if (amountPaisa != null) 'amount_paisa': amountPaisa,
      if (status != null) 'status': status,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalPaymentsCompanion copyWith(
      {Value<String>? id,
      Value<String>? invoiceId,
      Value<String>? paymentMethod,
      Value<int>? amountPaisa,
      Value<String>? status,
      Value<DateTime>? createdAt,
      Value<int>? rowid}) {
    return LocalPaymentsCompanion(
      id: id ?? this.id,
      invoiceId: invoiceId ?? this.invoiceId,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      amountPaisa: amountPaisa ?? this.amountPaisa,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (invoiceId.present) {
      map['invoice_id'] = Variable<String>(invoiceId.value);
    }
    if (paymentMethod.present) {
      map['payment_method'] = Variable<String>(paymentMethod.value);
    }
    if (amountPaisa.present) {
      map['amount_paisa'] = Variable<int>(amountPaisa.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalPaymentsCompanion(')
          ..write('id: $id, ')
          ..write('invoiceId: $invoiceId, ')
          ..write('paymentMethod: $paymentMethod, ')
          ..write('amountPaisa: $amountPaisa, ')
          ..write('status: $status, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalStockMovementsTable extends LocalStockMovements
    with TableInfo<$LocalStockMovementsTable, LocalStockMovement> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalStockMovementsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _productIdMeta =
      const VerificationMeta('productId');
  @override
  late final GeneratedColumn<String> productId = GeneratedColumn<String>(
      'product_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _movementTypeMeta =
      const VerificationMeta('movementType');
  @override
  late final GeneratedColumn<String> movementType = GeneratedColumn<String>(
      'movement_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _quantityMeta =
      const VerificationMeta('quantity');
  @override
  late final GeneratedColumn<double> quantity = GeneratedColumn<double>(
      'quantity', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _referenceIdMeta =
      const VerificationMeta('referenceId');
  @override
  late final GeneratedColumn<String> referenceId = GeneratedColumn<String>(
      'reference_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _reasonMeta = const VerificationMeta('reason');
  @override
  late final GeneratedColumn<String> reason = GeneratedColumn<String>(
      'reason', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns =>
      [id, productId, movementType, quantity, referenceId, reason, createdAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_stock_movements';
  @override
  VerificationContext validateIntegrity(Insertable<LocalStockMovement> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('product_id')) {
      context.handle(_productIdMeta,
          productId.isAcceptableOrUnknown(data['product_id']!, _productIdMeta));
    } else if (isInserting) {
      context.missing(_productIdMeta);
    }
    if (data.containsKey('movement_type')) {
      context.handle(
          _movementTypeMeta,
          movementType.isAcceptableOrUnknown(
              data['movement_type']!, _movementTypeMeta));
    } else if (isInserting) {
      context.missing(_movementTypeMeta);
    }
    if (data.containsKey('quantity')) {
      context.handle(_quantityMeta,
          quantity.isAcceptableOrUnknown(data['quantity']!, _quantityMeta));
    } else if (isInserting) {
      context.missing(_quantityMeta);
    }
    if (data.containsKey('reference_id')) {
      context.handle(
          _referenceIdMeta,
          referenceId.isAcceptableOrUnknown(
              data['reference_id']!, _referenceIdMeta));
    } else if (isInserting) {
      context.missing(_referenceIdMeta);
    }
    if (data.containsKey('reason')) {
      context.handle(_reasonMeta,
          reason.isAcceptableOrUnknown(data['reason']!, _reasonMeta));
    } else if (isInserting) {
      context.missing(_reasonMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalStockMovement map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalStockMovement(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      productId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}product_id'])!,
      movementType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}movement_type'])!,
      quantity: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}quantity'])!,
      referenceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}reference_id'])!,
      reason: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}reason'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
    );
  }

  @override
  $LocalStockMovementsTable createAlias(String alias) {
    return $LocalStockMovementsTable(attachedDatabase, alias);
  }
}

class LocalStockMovement extends DataClass
    implements Insertable<LocalStockMovement> {
  final String id;
  final String productId;
  final String movementType;
  final double quantity;
  final String referenceId;
  final String reason;
  final DateTime createdAt;
  const LocalStockMovement(
      {required this.id,
      required this.productId,
      required this.movementType,
      required this.quantity,
      required this.referenceId,
      required this.reason,
      required this.createdAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['product_id'] = Variable<String>(productId);
    map['movement_type'] = Variable<String>(movementType);
    map['quantity'] = Variable<double>(quantity);
    map['reference_id'] = Variable<String>(referenceId);
    map['reason'] = Variable<String>(reason);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  LocalStockMovementsCompanion toCompanion(bool nullToAbsent) {
    return LocalStockMovementsCompanion(
      id: Value(id),
      productId: Value(productId),
      movementType: Value(movementType),
      quantity: Value(quantity),
      referenceId: Value(referenceId),
      reason: Value(reason),
      createdAt: Value(createdAt),
    );
  }

  factory LocalStockMovement.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalStockMovement(
      id: serializer.fromJson<String>(json['id']),
      productId: serializer.fromJson<String>(json['productId']),
      movementType: serializer.fromJson<String>(json['movementType']),
      quantity: serializer.fromJson<double>(json['quantity']),
      referenceId: serializer.fromJson<String>(json['referenceId']),
      reason: serializer.fromJson<String>(json['reason']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'productId': serializer.toJson<String>(productId),
      'movementType': serializer.toJson<String>(movementType),
      'quantity': serializer.toJson<double>(quantity),
      'referenceId': serializer.toJson<String>(referenceId),
      'reason': serializer.toJson<String>(reason),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  LocalStockMovement copyWith(
          {String? id,
          String? productId,
          String? movementType,
          double? quantity,
          String? referenceId,
          String? reason,
          DateTime? createdAt}) =>
      LocalStockMovement(
        id: id ?? this.id,
        productId: productId ?? this.productId,
        movementType: movementType ?? this.movementType,
        quantity: quantity ?? this.quantity,
        referenceId: referenceId ?? this.referenceId,
        reason: reason ?? this.reason,
        createdAt: createdAt ?? this.createdAt,
      );
  LocalStockMovement copyWithCompanion(LocalStockMovementsCompanion data) {
    return LocalStockMovement(
      id: data.id.present ? data.id.value : this.id,
      productId: data.productId.present ? data.productId.value : this.productId,
      movementType: data.movementType.present
          ? data.movementType.value
          : this.movementType,
      quantity: data.quantity.present ? data.quantity.value : this.quantity,
      referenceId:
          data.referenceId.present ? data.referenceId.value : this.referenceId,
      reason: data.reason.present ? data.reason.value : this.reason,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalStockMovement(')
          ..write('id: $id, ')
          ..write('productId: $productId, ')
          ..write('movementType: $movementType, ')
          ..write('quantity: $quantity, ')
          ..write('referenceId: $referenceId, ')
          ..write('reason: $reason, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id, productId, movementType, quantity, referenceId, reason, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalStockMovement &&
          other.id == this.id &&
          other.productId == this.productId &&
          other.movementType == this.movementType &&
          other.quantity == this.quantity &&
          other.referenceId == this.referenceId &&
          other.reason == this.reason &&
          other.createdAt == this.createdAt);
}

class LocalStockMovementsCompanion extends UpdateCompanion<LocalStockMovement> {
  final Value<String> id;
  final Value<String> productId;
  final Value<String> movementType;
  final Value<double> quantity;
  final Value<String> referenceId;
  final Value<String> reason;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const LocalStockMovementsCompanion({
    this.id = const Value.absent(),
    this.productId = const Value.absent(),
    this.movementType = const Value.absent(),
    this.quantity = const Value.absent(),
    this.referenceId = const Value.absent(),
    this.reason = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalStockMovementsCompanion.insert({
    required String id,
    required String productId,
    required String movementType,
    required double quantity,
    required String referenceId,
    required String reason,
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        productId = Value(productId),
        movementType = Value(movementType),
        quantity = Value(quantity),
        referenceId = Value(referenceId),
        reason = Value(reason);
  static Insertable<LocalStockMovement> custom({
    Expression<String>? id,
    Expression<String>? productId,
    Expression<String>? movementType,
    Expression<double>? quantity,
    Expression<String>? referenceId,
    Expression<String>? reason,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (productId != null) 'product_id': productId,
      if (movementType != null) 'movement_type': movementType,
      if (quantity != null) 'quantity': quantity,
      if (referenceId != null) 'reference_id': referenceId,
      if (reason != null) 'reason': reason,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalStockMovementsCompanion copyWith(
      {Value<String>? id,
      Value<String>? productId,
      Value<String>? movementType,
      Value<double>? quantity,
      Value<String>? referenceId,
      Value<String>? reason,
      Value<DateTime>? createdAt,
      Value<int>? rowid}) {
    return LocalStockMovementsCompanion(
      id: id ?? this.id,
      productId: productId ?? this.productId,
      movementType: movementType ?? this.movementType,
      quantity: quantity ?? this.quantity,
      referenceId: referenceId ?? this.referenceId,
      reason: reason ?? this.reason,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (productId.present) {
      map['product_id'] = Variable<String>(productId.value);
    }
    if (movementType.present) {
      map['movement_type'] = Variable<String>(movementType.value);
    }
    if (quantity.present) {
      map['quantity'] = Variable<double>(quantity.value);
    }
    if (referenceId.present) {
      map['reference_id'] = Variable<String>(referenceId.value);
    }
    if (reason.present) {
      map['reason'] = Variable<String>(reason.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalStockMovementsCompanion(')
          ..write('id: $id, ')
          ..write('productId: $productId, ')
          ..write('movementType: $movementType, ')
          ..write('quantity: $quantity, ')
          ..write('referenceId: $referenceId, ')
          ..write('reason: $reason, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SyncOutboxTable extends SyncOutbox
    with TableInfo<$SyncOutboxTable, SyncOutboxData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncOutboxTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _operationIdMeta =
      const VerificationMeta('operationId');
  @override
  late final GeneratedColumn<String> operationId = GeneratedColumn<String>(
      'operation_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _deviceIdMeta =
      const VerificationMeta('deviceId');
  @override
  late final GeneratedColumn<String> deviceId = GeneratedColumn<String>(
      'device_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _sequenceMeta =
      const VerificationMeta('sequence');
  @override
  late final GeneratedColumn<int> sequence = GeneratedColumn<int>(
      'sequence', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _operationTypeMeta =
      const VerificationMeta('operationType');
  @override
  late final GeneratedColumn<String> operationType = GeneratedColumn<String>(
      'operation_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _schemaVersionMeta =
      const VerificationMeta('schemaVersion');
  @override
  late final GeneratedColumn<int> schemaVersion = GeneratedColumn<int>(
      'schema_version', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(1));
  static const VerificationMeta _payloadMeta =
      const VerificationMeta('payload');
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
      'payload', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('pending'));
  static const VerificationMeta _retryCountMeta =
      const VerificationMeta('retryCount');
  @override
  late final GeneratedColumn<int> retryCount = GeneratedColumn<int>(
      'retry_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _lastErrorMeta =
      const VerificationMeta('lastError');
  @override
  late final GeneratedColumn<String> lastError = GeneratedColumn<String>(
      'last_error', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _serverEntityIdMeta =
      const VerificationMeta('serverEntityId');
  @override
  late final GeneratedColumn<String> serverEntityId = GeneratedColumn<String>(
      'server_entity_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        operationId,
        deviceId,
        sequence,
        operationType,
        schemaVersion,
        payload,
        status,
        retryCount,
        createdAt,
        lastError,
        serverEntityId
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_outbox';
  @override
  VerificationContext validateIntegrity(Insertable<SyncOutboxData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('operation_id')) {
      context.handle(
          _operationIdMeta,
          operationId.isAcceptableOrUnknown(
              data['operation_id']!, _operationIdMeta));
    } else if (isInserting) {
      context.missing(_operationIdMeta);
    }
    if (data.containsKey('device_id')) {
      context.handle(_deviceIdMeta,
          deviceId.isAcceptableOrUnknown(data['device_id']!, _deviceIdMeta));
    } else if (isInserting) {
      context.missing(_deviceIdMeta);
    }
    if (data.containsKey('sequence')) {
      context.handle(_sequenceMeta,
          sequence.isAcceptableOrUnknown(data['sequence']!, _sequenceMeta));
    } else if (isInserting) {
      context.missing(_sequenceMeta);
    }
    if (data.containsKey('operation_type')) {
      context.handle(
          _operationTypeMeta,
          operationType.isAcceptableOrUnknown(
              data['operation_type']!, _operationTypeMeta));
    } else if (isInserting) {
      context.missing(_operationTypeMeta);
    }
    if (data.containsKey('schema_version')) {
      context.handle(
          _schemaVersionMeta,
          schemaVersion.isAcceptableOrUnknown(
              data['schema_version']!, _schemaVersionMeta));
    }
    if (data.containsKey('payload')) {
      context.handle(_payloadMeta,
          payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta));
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('retry_count')) {
      context.handle(
          _retryCountMeta,
          retryCount.isAcceptableOrUnknown(
              data['retry_count']!, _retryCountMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    if (data.containsKey('last_error')) {
      context.handle(_lastErrorMeta,
          lastError.isAcceptableOrUnknown(data['last_error']!, _lastErrorMeta));
    }
    if (data.containsKey('server_entity_id')) {
      context.handle(
          _serverEntityIdMeta,
          serverEntityId.isAcceptableOrUnknown(
              data['server_entity_id']!, _serverEntityIdMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {operationId};
  @override
  SyncOutboxData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncOutboxData(
      operationId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}operation_id'])!,
      deviceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}device_id'])!,
      sequence: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}sequence'])!,
      operationType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}operation_type'])!,
      schemaVersion: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}schema_version'])!,
      payload: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      retryCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}retry_count'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      lastError: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}last_error']),
      serverEntityId: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}server_entity_id']),
    );
  }

  @override
  $SyncOutboxTable createAlias(String alias) {
    return $SyncOutboxTable(attachedDatabase, alias);
  }
}

class SyncOutboxData extends DataClass implements Insertable<SyncOutboxData> {
  final String operationId;
  final String deviceId;
  final int sequence;
  final String operationType;
  final int schemaVersion;
  final String payload;
  final String status;
  final int retryCount;
  final DateTime createdAt;
  final String? lastError;
  final String? serverEntityId;
  const SyncOutboxData(
      {required this.operationId,
      required this.deviceId,
      required this.sequence,
      required this.operationType,
      required this.schemaVersion,
      required this.payload,
      required this.status,
      required this.retryCount,
      required this.createdAt,
      this.lastError,
      this.serverEntityId});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['operation_id'] = Variable<String>(operationId);
    map['device_id'] = Variable<String>(deviceId);
    map['sequence'] = Variable<int>(sequence);
    map['operation_type'] = Variable<String>(operationType);
    map['schema_version'] = Variable<int>(schemaVersion);
    map['payload'] = Variable<String>(payload);
    map['status'] = Variable<String>(status);
    map['retry_count'] = Variable<int>(retryCount);
    map['created_at'] = Variable<DateTime>(createdAt);
    if (!nullToAbsent || lastError != null) {
      map['last_error'] = Variable<String>(lastError);
    }
    if (!nullToAbsent || serverEntityId != null) {
      map['server_entity_id'] = Variable<String>(serverEntityId);
    }
    return map;
  }

  SyncOutboxCompanion toCompanion(bool nullToAbsent) {
    return SyncOutboxCompanion(
      operationId: Value(operationId),
      deviceId: Value(deviceId),
      sequence: Value(sequence),
      operationType: Value(operationType),
      schemaVersion: Value(schemaVersion),
      payload: Value(payload),
      status: Value(status),
      retryCount: Value(retryCount),
      createdAt: Value(createdAt),
      lastError: lastError == null && nullToAbsent
          ? const Value.absent()
          : Value(lastError),
      serverEntityId: serverEntityId == null && nullToAbsent
          ? const Value.absent()
          : Value(serverEntityId),
    );
  }

  factory SyncOutboxData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncOutboxData(
      operationId: serializer.fromJson<String>(json['operationId']),
      deviceId: serializer.fromJson<String>(json['deviceId']),
      sequence: serializer.fromJson<int>(json['sequence']),
      operationType: serializer.fromJson<String>(json['operationType']),
      schemaVersion: serializer.fromJson<int>(json['schemaVersion']),
      payload: serializer.fromJson<String>(json['payload']),
      status: serializer.fromJson<String>(json['status']),
      retryCount: serializer.fromJson<int>(json['retryCount']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      lastError: serializer.fromJson<String?>(json['lastError']),
      serverEntityId: serializer.fromJson<String?>(json['serverEntityId']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'operationId': serializer.toJson<String>(operationId),
      'deviceId': serializer.toJson<String>(deviceId),
      'sequence': serializer.toJson<int>(sequence),
      'operationType': serializer.toJson<String>(operationType),
      'schemaVersion': serializer.toJson<int>(schemaVersion),
      'payload': serializer.toJson<String>(payload),
      'status': serializer.toJson<String>(status),
      'retryCount': serializer.toJson<int>(retryCount),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'lastError': serializer.toJson<String?>(lastError),
      'serverEntityId': serializer.toJson<String?>(serverEntityId),
    };
  }

  SyncOutboxData copyWith(
          {String? operationId,
          String? deviceId,
          int? sequence,
          String? operationType,
          int? schemaVersion,
          String? payload,
          String? status,
          int? retryCount,
          DateTime? createdAt,
          Value<String?> lastError = const Value.absent(),
          Value<String?> serverEntityId = const Value.absent()}) =>
      SyncOutboxData(
        operationId: operationId ?? this.operationId,
        deviceId: deviceId ?? this.deviceId,
        sequence: sequence ?? this.sequence,
        operationType: operationType ?? this.operationType,
        schemaVersion: schemaVersion ?? this.schemaVersion,
        payload: payload ?? this.payload,
        status: status ?? this.status,
        retryCount: retryCount ?? this.retryCount,
        createdAt: createdAt ?? this.createdAt,
        lastError: lastError.present ? lastError.value : this.lastError,
        serverEntityId:
            serverEntityId.present ? serverEntityId.value : this.serverEntityId,
      );
  SyncOutboxData copyWithCompanion(SyncOutboxCompanion data) {
    return SyncOutboxData(
      operationId:
          data.operationId.present ? data.operationId.value : this.operationId,
      deviceId: data.deviceId.present ? data.deviceId.value : this.deviceId,
      sequence: data.sequence.present ? data.sequence.value : this.sequence,
      operationType: data.operationType.present
          ? data.operationType.value
          : this.operationType,
      schemaVersion: data.schemaVersion.present
          ? data.schemaVersion.value
          : this.schemaVersion,
      payload: data.payload.present ? data.payload.value : this.payload,
      status: data.status.present ? data.status.value : this.status,
      retryCount:
          data.retryCount.present ? data.retryCount.value : this.retryCount,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      lastError: data.lastError.present ? data.lastError.value : this.lastError,
      serverEntityId: data.serverEntityId.present
          ? data.serverEntityId.value
          : this.serverEntityId,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncOutboxData(')
          ..write('operationId: $operationId, ')
          ..write('deviceId: $deviceId, ')
          ..write('sequence: $sequence, ')
          ..write('operationType: $operationType, ')
          ..write('schemaVersion: $schemaVersion, ')
          ..write('payload: $payload, ')
          ..write('status: $status, ')
          ..write('retryCount: $retryCount, ')
          ..write('createdAt: $createdAt, ')
          ..write('lastError: $lastError, ')
          ..write('serverEntityId: $serverEntityId')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      operationId,
      deviceId,
      sequence,
      operationType,
      schemaVersion,
      payload,
      status,
      retryCount,
      createdAt,
      lastError,
      serverEntityId);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncOutboxData &&
          other.operationId == this.operationId &&
          other.deviceId == this.deviceId &&
          other.sequence == this.sequence &&
          other.operationType == this.operationType &&
          other.schemaVersion == this.schemaVersion &&
          other.payload == this.payload &&
          other.status == this.status &&
          other.retryCount == this.retryCount &&
          other.createdAt == this.createdAt &&
          other.lastError == this.lastError &&
          other.serverEntityId == this.serverEntityId);
}

class SyncOutboxCompanion extends UpdateCompanion<SyncOutboxData> {
  final Value<String> operationId;
  final Value<String> deviceId;
  final Value<int> sequence;
  final Value<String> operationType;
  final Value<int> schemaVersion;
  final Value<String> payload;
  final Value<String> status;
  final Value<int> retryCount;
  final Value<DateTime> createdAt;
  final Value<String?> lastError;
  final Value<String?> serverEntityId;
  final Value<int> rowid;
  const SyncOutboxCompanion({
    this.operationId = const Value.absent(),
    this.deviceId = const Value.absent(),
    this.sequence = const Value.absent(),
    this.operationType = const Value.absent(),
    this.schemaVersion = const Value.absent(),
    this.payload = const Value.absent(),
    this.status = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.lastError = const Value.absent(),
    this.serverEntityId = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SyncOutboxCompanion.insert({
    required String operationId,
    required String deviceId,
    required int sequence,
    required String operationType,
    this.schemaVersion = const Value.absent(),
    required String payload,
    this.status = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.lastError = const Value.absent(),
    this.serverEntityId = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : operationId = Value(operationId),
        deviceId = Value(deviceId),
        sequence = Value(sequence),
        operationType = Value(operationType),
        payload = Value(payload);
  static Insertable<SyncOutboxData> custom({
    Expression<String>? operationId,
    Expression<String>? deviceId,
    Expression<int>? sequence,
    Expression<String>? operationType,
    Expression<int>? schemaVersion,
    Expression<String>? payload,
    Expression<String>? status,
    Expression<int>? retryCount,
    Expression<DateTime>? createdAt,
    Expression<String>? lastError,
    Expression<String>? serverEntityId,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (operationId != null) 'operation_id': operationId,
      if (deviceId != null) 'device_id': deviceId,
      if (sequence != null) 'sequence': sequence,
      if (operationType != null) 'operation_type': operationType,
      if (schemaVersion != null) 'schema_version': schemaVersion,
      if (payload != null) 'payload': payload,
      if (status != null) 'status': status,
      if (retryCount != null) 'retry_count': retryCount,
      if (createdAt != null) 'created_at': createdAt,
      if (lastError != null) 'last_error': lastError,
      if (serverEntityId != null) 'server_entity_id': serverEntityId,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SyncOutboxCompanion copyWith(
      {Value<String>? operationId,
      Value<String>? deviceId,
      Value<int>? sequence,
      Value<String>? operationType,
      Value<int>? schemaVersion,
      Value<String>? payload,
      Value<String>? status,
      Value<int>? retryCount,
      Value<DateTime>? createdAt,
      Value<String?>? lastError,
      Value<String?>? serverEntityId,
      Value<int>? rowid}) {
    return SyncOutboxCompanion(
      operationId: operationId ?? this.operationId,
      deviceId: deviceId ?? this.deviceId,
      sequence: sequence ?? this.sequence,
      operationType: operationType ?? this.operationType,
      schemaVersion: schemaVersion ?? this.schemaVersion,
      payload: payload ?? this.payload,
      status: status ?? this.status,
      retryCount: retryCount ?? this.retryCount,
      createdAt: createdAt ?? this.createdAt,
      lastError: lastError ?? this.lastError,
      serverEntityId: serverEntityId ?? this.serverEntityId,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (operationId.present) {
      map['operation_id'] = Variable<String>(operationId.value);
    }
    if (deviceId.present) {
      map['device_id'] = Variable<String>(deviceId.value);
    }
    if (sequence.present) {
      map['sequence'] = Variable<int>(sequence.value);
    }
    if (operationType.present) {
      map['operation_type'] = Variable<String>(operationType.value);
    }
    if (schemaVersion.present) {
      map['schema_version'] = Variable<int>(schemaVersion.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (retryCount.present) {
      map['retry_count'] = Variable<int>(retryCount.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (lastError.present) {
      map['last_error'] = Variable<String>(lastError.value);
    }
    if (serverEntityId.present) {
      map['server_entity_id'] = Variable<String>(serverEntityId.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncOutboxCompanion(')
          ..write('operationId: $operationId, ')
          ..write('deviceId: $deviceId, ')
          ..write('sequence: $sequence, ')
          ..write('operationType: $operationType, ')
          ..write('schemaVersion: $schemaVersion, ')
          ..write('payload: $payload, ')
          ..write('status: $status, ')
          ..write('retryCount: $retryCount, ')
          ..write('createdAt: $createdAt, ')
          ..write('lastError: $lastError, ')
          ..write('serverEntityId: $serverEntityId, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalRestaurantTablesTable extends LocalRestaurantTables
    with TableInfo<$LocalRestaurantTablesTable, LocalRestaurantTable> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalRestaurantTablesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _tenantIdMeta =
      const VerificationMeta('tenantId');
  @override
  late final GeneratedColumn<String> tenantId = GeneratedColumn<String>(
      'tenant_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _branchIdMeta =
      const VerificationMeta('branchId');
  @override
  late final GeneratedColumn<String> branchId = GeneratedColumn<String>(
      'branch_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _tableNumberMeta =
      const VerificationMeta('tableNumber');
  @override
  late final GeneratedColumn<String> tableNumber = GeneratedColumn<String>(
      'table_number', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _sectionMeta =
      const VerificationMeta('section');
  @override
  late final GeneratedColumn<String> section = GeneratedColumn<String>(
      'section', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('Main Dining'));
  static const VerificationMeta _seatingCapacityMeta =
      const VerificationMeta('seatingCapacity');
  @override
  late final GeneratedColumn<int> seatingCapacity = GeneratedColumn<int>(
      'seating_capacity', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(4));
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('vacant'));
  static const VerificationMeta _currentGuestCountMeta =
      const VerificationMeta('currentGuestCount');
  @override
  late final GeneratedColumn<int> currentGuestCount = GeneratedColumn<int>(
      'current_guest_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _occupiedAtMeta =
      const VerificationMeta('occupiedAt');
  @override
  late final GeneratedColumn<DateTime> occupiedAt = GeneratedColumn<DateTime>(
      'occupied_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _sortOrderMeta =
      const VerificationMeta('sortOrder');
  @override
  late final GeneratedColumn<int> sortOrder = GeneratedColumn<int>(
      'sort_order', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        tenantId,
        branchId,
        tableNumber,
        name,
        section,
        seatingCapacity,
        status,
        currentGuestCount,
        occupiedAt,
        sortOrder,
        updatedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_restaurant_tables';
  @override
  VerificationContext validateIntegrity(
      Insertable<LocalRestaurantTable> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('tenant_id')) {
      context.handle(_tenantIdMeta,
          tenantId.isAcceptableOrUnknown(data['tenant_id']!, _tenantIdMeta));
    } else if (isInserting) {
      context.missing(_tenantIdMeta);
    }
    if (data.containsKey('branch_id')) {
      context.handle(_branchIdMeta,
          branchId.isAcceptableOrUnknown(data['branch_id']!, _branchIdMeta));
    } else if (isInserting) {
      context.missing(_branchIdMeta);
    }
    if (data.containsKey('table_number')) {
      context.handle(
          _tableNumberMeta,
          tableNumber.isAcceptableOrUnknown(
              data['table_number']!, _tableNumberMeta));
    } else if (isInserting) {
      context.missing(_tableNumberMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    }
    if (data.containsKey('section')) {
      context.handle(_sectionMeta,
          section.isAcceptableOrUnknown(data['section']!, _sectionMeta));
    }
    if (data.containsKey('seating_capacity')) {
      context.handle(
          _seatingCapacityMeta,
          seatingCapacity.isAcceptableOrUnknown(
              data['seating_capacity']!, _seatingCapacityMeta));
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('current_guest_count')) {
      context.handle(
          _currentGuestCountMeta,
          currentGuestCount.isAcceptableOrUnknown(
              data['current_guest_count']!, _currentGuestCountMeta));
    }
    if (data.containsKey('occupied_at')) {
      context.handle(
          _occupiedAtMeta,
          occupiedAt.isAcceptableOrUnknown(
              data['occupied_at']!, _occupiedAtMeta));
    }
    if (data.containsKey('sort_order')) {
      context.handle(_sortOrderMeta,
          sortOrder.isAcceptableOrUnknown(data['sort_order']!, _sortOrderMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalRestaurantTable map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalRestaurantTable(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      tenantId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}tenant_id'])!,
      branchId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}branch_id'])!,
      tableNumber: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}table_number'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name']),
      section: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}section'])!,
      seatingCapacity: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}seating_capacity'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      currentGuestCount: attachedDatabase.typeMapping.read(
          DriftSqlType.int, data['${effectivePrefix}current_guest_count'])!,
      occupiedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}occupied_at']),
      sortOrder: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}sort_order'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
    );
  }

  @override
  $LocalRestaurantTablesTable createAlias(String alias) {
    return $LocalRestaurantTablesTable(attachedDatabase, alias);
  }
}

class LocalRestaurantTable extends DataClass
    implements Insertable<LocalRestaurantTable> {
  final String id;
  final String tenantId;
  final String branchId;
  final String tableNumber;
  final String? name;
  final String section;
  final int seatingCapacity;
  final String status;
  final int currentGuestCount;
  final DateTime? occupiedAt;
  final int sortOrder;
  final DateTime updatedAt;
  const LocalRestaurantTable(
      {required this.id,
      required this.tenantId,
      required this.branchId,
      required this.tableNumber,
      this.name,
      required this.section,
      required this.seatingCapacity,
      required this.status,
      required this.currentGuestCount,
      this.occupiedAt,
      required this.sortOrder,
      required this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['tenant_id'] = Variable<String>(tenantId);
    map['branch_id'] = Variable<String>(branchId);
    map['table_number'] = Variable<String>(tableNumber);
    if (!nullToAbsent || name != null) {
      map['name'] = Variable<String>(name);
    }
    map['section'] = Variable<String>(section);
    map['seating_capacity'] = Variable<int>(seatingCapacity);
    map['status'] = Variable<String>(status);
    map['current_guest_count'] = Variable<int>(currentGuestCount);
    if (!nullToAbsent || occupiedAt != null) {
      map['occupied_at'] = Variable<DateTime>(occupiedAt);
    }
    map['sort_order'] = Variable<int>(sortOrder);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  LocalRestaurantTablesCompanion toCompanion(bool nullToAbsent) {
    return LocalRestaurantTablesCompanion(
      id: Value(id),
      tenantId: Value(tenantId),
      branchId: Value(branchId),
      tableNumber: Value(tableNumber),
      name: name == null && nullToAbsent ? const Value.absent() : Value(name),
      section: Value(section),
      seatingCapacity: Value(seatingCapacity),
      status: Value(status),
      currentGuestCount: Value(currentGuestCount),
      occupiedAt: occupiedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(occupiedAt),
      sortOrder: Value(sortOrder),
      updatedAt: Value(updatedAt),
    );
  }

  factory LocalRestaurantTable.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalRestaurantTable(
      id: serializer.fromJson<String>(json['id']),
      tenantId: serializer.fromJson<String>(json['tenantId']),
      branchId: serializer.fromJson<String>(json['branchId']),
      tableNumber: serializer.fromJson<String>(json['tableNumber']),
      name: serializer.fromJson<String?>(json['name']),
      section: serializer.fromJson<String>(json['section']),
      seatingCapacity: serializer.fromJson<int>(json['seatingCapacity']),
      status: serializer.fromJson<String>(json['status']),
      currentGuestCount: serializer.fromJson<int>(json['currentGuestCount']),
      occupiedAt: serializer.fromJson<DateTime?>(json['occupiedAt']),
      sortOrder: serializer.fromJson<int>(json['sortOrder']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'tenantId': serializer.toJson<String>(tenantId),
      'branchId': serializer.toJson<String>(branchId),
      'tableNumber': serializer.toJson<String>(tableNumber),
      'name': serializer.toJson<String?>(name),
      'section': serializer.toJson<String>(section),
      'seatingCapacity': serializer.toJson<int>(seatingCapacity),
      'status': serializer.toJson<String>(status),
      'currentGuestCount': serializer.toJson<int>(currentGuestCount),
      'occupiedAt': serializer.toJson<DateTime?>(occupiedAt),
      'sortOrder': serializer.toJson<int>(sortOrder),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  LocalRestaurantTable copyWith(
          {String? id,
          String? tenantId,
          String? branchId,
          String? tableNumber,
          Value<String?> name = const Value.absent(),
          String? section,
          int? seatingCapacity,
          String? status,
          int? currentGuestCount,
          Value<DateTime?> occupiedAt = const Value.absent(),
          int? sortOrder,
          DateTime? updatedAt}) =>
      LocalRestaurantTable(
        id: id ?? this.id,
        tenantId: tenantId ?? this.tenantId,
        branchId: branchId ?? this.branchId,
        tableNumber: tableNumber ?? this.tableNumber,
        name: name.present ? name.value : this.name,
        section: section ?? this.section,
        seatingCapacity: seatingCapacity ?? this.seatingCapacity,
        status: status ?? this.status,
        currentGuestCount: currentGuestCount ?? this.currentGuestCount,
        occupiedAt: occupiedAt.present ? occupiedAt.value : this.occupiedAt,
        sortOrder: sortOrder ?? this.sortOrder,
        updatedAt: updatedAt ?? this.updatedAt,
      );
  LocalRestaurantTable copyWithCompanion(LocalRestaurantTablesCompanion data) {
    return LocalRestaurantTable(
      id: data.id.present ? data.id.value : this.id,
      tenantId: data.tenantId.present ? data.tenantId.value : this.tenantId,
      branchId: data.branchId.present ? data.branchId.value : this.branchId,
      tableNumber:
          data.tableNumber.present ? data.tableNumber.value : this.tableNumber,
      name: data.name.present ? data.name.value : this.name,
      section: data.section.present ? data.section.value : this.section,
      seatingCapacity: data.seatingCapacity.present
          ? data.seatingCapacity.value
          : this.seatingCapacity,
      status: data.status.present ? data.status.value : this.status,
      currentGuestCount: data.currentGuestCount.present
          ? data.currentGuestCount.value
          : this.currentGuestCount,
      occupiedAt:
          data.occupiedAt.present ? data.occupiedAt.value : this.occupiedAt,
      sortOrder: data.sortOrder.present ? data.sortOrder.value : this.sortOrder,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalRestaurantTable(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('branchId: $branchId, ')
          ..write('tableNumber: $tableNumber, ')
          ..write('name: $name, ')
          ..write('section: $section, ')
          ..write('seatingCapacity: $seatingCapacity, ')
          ..write('status: $status, ')
          ..write('currentGuestCount: $currentGuestCount, ')
          ..write('occupiedAt: $occupiedAt, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      tenantId,
      branchId,
      tableNumber,
      name,
      section,
      seatingCapacity,
      status,
      currentGuestCount,
      occupiedAt,
      sortOrder,
      updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalRestaurantTable &&
          other.id == this.id &&
          other.tenantId == this.tenantId &&
          other.branchId == this.branchId &&
          other.tableNumber == this.tableNumber &&
          other.name == this.name &&
          other.section == this.section &&
          other.seatingCapacity == this.seatingCapacity &&
          other.status == this.status &&
          other.currentGuestCount == this.currentGuestCount &&
          other.occupiedAt == this.occupiedAt &&
          other.sortOrder == this.sortOrder &&
          other.updatedAt == this.updatedAt);
}

class LocalRestaurantTablesCompanion
    extends UpdateCompanion<LocalRestaurantTable> {
  final Value<String> id;
  final Value<String> tenantId;
  final Value<String> branchId;
  final Value<String> tableNumber;
  final Value<String?> name;
  final Value<String> section;
  final Value<int> seatingCapacity;
  final Value<String> status;
  final Value<int> currentGuestCount;
  final Value<DateTime?> occupiedAt;
  final Value<int> sortOrder;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const LocalRestaurantTablesCompanion({
    this.id = const Value.absent(),
    this.tenantId = const Value.absent(),
    this.branchId = const Value.absent(),
    this.tableNumber = const Value.absent(),
    this.name = const Value.absent(),
    this.section = const Value.absent(),
    this.seatingCapacity = const Value.absent(),
    this.status = const Value.absent(),
    this.currentGuestCount = const Value.absent(),
    this.occupiedAt = const Value.absent(),
    this.sortOrder = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalRestaurantTablesCompanion.insert({
    required String id,
    required String tenantId,
    required String branchId,
    required String tableNumber,
    this.name = const Value.absent(),
    this.section = const Value.absent(),
    this.seatingCapacity = const Value.absent(),
    this.status = const Value.absent(),
    this.currentGuestCount = const Value.absent(),
    this.occupiedAt = const Value.absent(),
    this.sortOrder = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        tenantId = Value(tenantId),
        branchId = Value(branchId),
        tableNumber = Value(tableNumber);
  static Insertable<LocalRestaurantTable> custom({
    Expression<String>? id,
    Expression<String>? tenantId,
    Expression<String>? branchId,
    Expression<String>? tableNumber,
    Expression<String>? name,
    Expression<String>? section,
    Expression<int>? seatingCapacity,
    Expression<String>? status,
    Expression<int>? currentGuestCount,
    Expression<DateTime>? occupiedAt,
    Expression<int>? sortOrder,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (tenantId != null) 'tenant_id': tenantId,
      if (branchId != null) 'branch_id': branchId,
      if (tableNumber != null) 'table_number': tableNumber,
      if (name != null) 'name': name,
      if (section != null) 'section': section,
      if (seatingCapacity != null) 'seating_capacity': seatingCapacity,
      if (status != null) 'status': status,
      if (currentGuestCount != null) 'current_guest_count': currentGuestCount,
      if (occupiedAt != null) 'occupied_at': occupiedAt,
      if (sortOrder != null) 'sort_order': sortOrder,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalRestaurantTablesCompanion copyWith(
      {Value<String>? id,
      Value<String>? tenantId,
      Value<String>? branchId,
      Value<String>? tableNumber,
      Value<String?>? name,
      Value<String>? section,
      Value<int>? seatingCapacity,
      Value<String>? status,
      Value<int>? currentGuestCount,
      Value<DateTime?>? occupiedAt,
      Value<int>? sortOrder,
      Value<DateTime>? updatedAt,
      Value<int>? rowid}) {
    return LocalRestaurantTablesCompanion(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      branchId: branchId ?? this.branchId,
      tableNumber: tableNumber ?? this.tableNumber,
      name: name ?? this.name,
      section: section ?? this.section,
      seatingCapacity: seatingCapacity ?? this.seatingCapacity,
      status: status ?? this.status,
      currentGuestCount: currentGuestCount ?? this.currentGuestCount,
      occupiedAt: occupiedAt ?? this.occupiedAt,
      sortOrder: sortOrder ?? this.sortOrder,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (tenantId.present) {
      map['tenant_id'] = Variable<String>(tenantId.value);
    }
    if (branchId.present) {
      map['branch_id'] = Variable<String>(branchId.value);
    }
    if (tableNumber.present) {
      map['table_number'] = Variable<String>(tableNumber.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (section.present) {
      map['section'] = Variable<String>(section.value);
    }
    if (seatingCapacity.present) {
      map['seating_capacity'] = Variable<int>(seatingCapacity.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (currentGuestCount.present) {
      map['current_guest_count'] = Variable<int>(currentGuestCount.value);
    }
    if (occupiedAt.present) {
      map['occupied_at'] = Variable<DateTime>(occupiedAt.value);
    }
    if (sortOrder.present) {
      map['sort_order'] = Variable<int>(sortOrder.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalRestaurantTablesCompanion(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('branchId: $branchId, ')
          ..write('tableNumber: $tableNumber, ')
          ..write('name: $name, ')
          ..write('section: $section, ')
          ..write('seatingCapacity: $seatingCapacity, ')
          ..write('status: $status, ')
          ..write('currentGuestCount: $currentGuestCount, ')
          ..write('occupiedAt: $occupiedAt, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalRestaurantOrdersTable extends LocalRestaurantOrders
    with TableInfo<$LocalRestaurantOrdersTable, LocalRestaurantOrder> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalRestaurantOrdersTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _tenantIdMeta =
      const VerificationMeta('tenantId');
  @override
  late final GeneratedColumn<String> tenantId = GeneratedColumn<String>(
      'tenant_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _branchIdMeta =
      const VerificationMeta('branchId');
  @override
  late final GeneratedColumn<String> branchId = GeneratedColumn<String>(
      'branch_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _orderNumberMeta =
      const VerificationMeta('orderNumber');
  @override
  late final GeneratedColumn<String> orderNumber = GeneratedColumn<String>(
      'order_number', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _orderTypeMeta =
      const VerificationMeta('orderType');
  @override
  late final GeneratedColumn<String> orderType = GeneratedColumn<String>(
      'order_type', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('dine_in'));
  static const VerificationMeta _tableIdMeta =
      const VerificationMeta('tableId');
  @override
  late final GeneratedColumn<String> tableId = GeneratedColumn<String>(
      'table_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _tableNumberSnapshotMeta =
      const VerificationMeta('tableNumberSnapshot');
  @override
  late final GeneratedColumn<String> tableNumberSnapshot =
      GeneratedColumn<String>('table_number_snapshot', aliasedName, true,
          type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _sectionSnapshotMeta =
      const VerificationMeta('sectionSnapshot');
  @override
  late final GeneratedColumn<String> sectionSnapshot = GeneratedColumn<String>(
      'section_snapshot', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _guestCountMeta =
      const VerificationMeta('guestCount');
  @override
  late final GeneratedColumn<int> guestCount = GeneratedColumn<int>(
      'guest_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(1));
  static const VerificationMeta _customerIdMeta =
      const VerificationMeta('customerId');
  @override
  late final GeneratedColumn<String> customerId = GeneratedColumn<String>(
      'customer_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('open'));
  static const VerificationMeta _subtotalPaisaMeta =
      const VerificationMeta('subtotalPaisa');
  @override
  late final GeneratedColumn<int> subtotalPaisa = GeneratedColumn<int>(
      'subtotal_paisa', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _taxTotalPaisaMeta =
      const VerificationMeta('taxTotalPaisa');
  @override
  late final GeneratedColumn<int> taxTotalPaisa = GeneratedColumn<int>(
      'tax_total_paisa', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _discountTotalPaisaMeta =
      const VerificationMeta('discountTotalPaisa');
  @override
  late final GeneratedColumn<int> discountTotalPaisa = GeneratedColumn<int>(
      'discount_total_paisa', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _grandTotalPaisaMeta =
      const VerificationMeta('grandTotalPaisa');
  @override
  late final GeneratedColumn<int> grandTotalPaisa = GeneratedColumn<int>(
      'grand_total_paisa', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _captainNameSnapshotMeta =
      const VerificationMeta('captainNameSnapshot');
  @override
  late final GeneratedColumn<String> captainNameSnapshot =
      GeneratedColumn<String>('captain_name_snapshot', aliasedName, true,
          type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
      'notes', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _invoiceIdMeta =
      const VerificationMeta('invoiceId');
  @override
  late final GeneratedColumn<String> invoiceId = GeneratedColumn<String>(
      'invoice_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _openedAtMeta =
      const VerificationMeta('openedAt');
  @override
  late final GeneratedColumn<DateTime> openedAt = GeneratedColumn<DateTime>(
      'opened_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  static const VerificationMeta _closedAtMeta =
      const VerificationMeta('closedAt');
  @override
  late final GeneratedColumn<DateTime> closedAt = GeneratedColumn<DateTime>(
      'closed_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        tenantId,
        branchId,
        orderNumber,
        orderType,
        tableId,
        tableNumberSnapshot,
        sectionSnapshot,
        guestCount,
        customerId,
        status,
        subtotalPaisa,
        taxTotalPaisa,
        discountTotalPaisa,
        grandTotalPaisa,
        captainNameSnapshot,
        notes,
        invoiceId,
        openedAt,
        closedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_restaurant_orders';
  @override
  VerificationContext validateIntegrity(
      Insertable<LocalRestaurantOrder> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('tenant_id')) {
      context.handle(_tenantIdMeta,
          tenantId.isAcceptableOrUnknown(data['tenant_id']!, _tenantIdMeta));
    } else if (isInserting) {
      context.missing(_tenantIdMeta);
    }
    if (data.containsKey('branch_id')) {
      context.handle(_branchIdMeta,
          branchId.isAcceptableOrUnknown(data['branch_id']!, _branchIdMeta));
    } else if (isInserting) {
      context.missing(_branchIdMeta);
    }
    if (data.containsKey('order_number')) {
      context.handle(
          _orderNumberMeta,
          orderNumber.isAcceptableOrUnknown(
              data['order_number']!, _orderNumberMeta));
    } else if (isInserting) {
      context.missing(_orderNumberMeta);
    }
    if (data.containsKey('order_type')) {
      context.handle(_orderTypeMeta,
          orderType.isAcceptableOrUnknown(data['order_type']!, _orderTypeMeta));
    }
    if (data.containsKey('table_id')) {
      context.handle(_tableIdMeta,
          tableId.isAcceptableOrUnknown(data['table_id']!, _tableIdMeta));
    }
    if (data.containsKey('table_number_snapshot')) {
      context.handle(
          _tableNumberSnapshotMeta,
          tableNumberSnapshot.isAcceptableOrUnknown(
              data['table_number_snapshot']!, _tableNumberSnapshotMeta));
    }
    if (data.containsKey('section_snapshot')) {
      context.handle(
          _sectionSnapshotMeta,
          sectionSnapshot.isAcceptableOrUnknown(
              data['section_snapshot']!, _sectionSnapshotMeta));
    }
    if (data.containsKey('guest_count')) {
      context.handle(
          _guestCountMeta,
          guestCount.isAcceptableOrUnknown(
              data['guest_count']!, _guestCountMeta));
    }
    if (data.containsKey('customer_id')) {
      context.handle(
          _customerIdMeta,
          customerId.isAcceptableOrUnknown(
              data['customer_id']!, _customerIdMeta));
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('subtotal_paisa')) {
      context.handle(
          _subtotalPaisaMeta,
          subtotalPaisa.isAcceptableOrUnknown(
              data['subtotal_paisa']!, _subtotalPaisaMeta));
    }
    if (data.containsKey('tax_total_paisa')) {
      context.handle(
          _taxTotalPaisaMeta,
          taxTotalPaisa.isAcceptableOrUnknown(
              data['tax_total_paisa']!, _taxTotalPaisaMeta));
    }
    if (data.containsKey('discount_total_paisa')) {
      context.handle(
          _discountTotalPaisaMeta,
          discountTotalPaisa.isAcceptableOrUnknown(
              data['discount_total_paisa']!, _discountTotalPaisaMeta));
    }
    if (data.containsKey('grand_total_paisa')) {
      context.handle(
          _grandTotalPaisaMeta,
          grandTotalPaisa.isAcceptableOrUnknown(
              data['grand_total_paisa']!, _grandTotalPaisaMeta));
    }
    if (data.containsKey('captain_name_snapshot')) {
      context.handle(
          _captainNameSnapshotMeta,
          captainNameSnapshot.isAcceptableOrUnknown(
              data['captain_name_snapshot']!, _captainNameSnapshotMeta));
    }
    if (data.containsKey('notes')) {
      context.handle(
          _notesMeta, notes.isAcceptableOrUnknown(data['notes']!, _notesMeta));
    }
    if (data.containsKey('invoice_id')) {
      context.handle(_invoiceIdMeta,
          invoiceId.isAcceptableOrUnknown(data['invoice_id']!, _invoiceIdMeta));
    }
    if (data.containsKey('opened_at')) {
      context.handle(_openedAtMeta,
          openedAt.isAcceptableOrUnknown(data['opened_at']!, _openedAtMeta));
    }
    if (data.containsKey('closed_at')) {
      context.handle(_closedAtMeta,
          closedAt.isAcceptableOrUnknown(data['closed_at']!, _closedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalRestaurantOrder map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalRestaurantOrder(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      tenantId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}tenant_id'])!,
      branchId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}branch_id'])!,
      orderNumber: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}order_number'])!,
      orderType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}order_type'])!,
      tableId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}table_id']),
      tableNumberSnapshot: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}table_number_snapshot']),
      sectionSnapshot: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}section_snapshot']),
      guestCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}guest_count'])!,
      customerId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}customer_id']),
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      subtotalPaisa: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}subtotal_paisa'])!,
      taxTotalPaisa: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}tax_total_paisa'])!,
      discountTotalPaisa: attachedDatabase.typeMapping.read(
          DriftSqlType.int, data['${effectivePrefix}discount_total_paisa'])!,
      grandTotalPaisa: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}grand_total_paisa'])!,
      captainNameSnapshot: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}captain_name_snapshot']),
      notes: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}notes']),
      invoiceId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}invoice_id']),
      openedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}opened_at'])!,
      closedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}closed_at']),
    );
  }

  @override
  $LocalRestaurantOrdersTable createAlias(String alias) {
    return $LocalRestaurantOrdersTable(attachedDatabase, alias);
  }
}

class LocalRestaurantOrder extends DataClass
    implements Insertable<LocalRestaurantOrder> {
  final String id;
  final String tenantId;
  final String branchId;
  final String orderNumber;
  final String orderType;
  final String? tableId;
  final String? tableNumberSnapshot;
  final String? sectionSnapshot;
  final int guestCount;
  final String? customerId;
  final String status;
  final int subtotalPaisa;
  final int taxTotalPaisa;
  final int discountTotalPaisa;
  final int grandTotalPaisa;
  final String? captainNameSnapshot;
  final String? notes;
  final String? invoiceId;
  final DateTime openedAt;
  final DateTime? closedAt;
  const LocalRestaurantOrder(
      {required this.id,
      required this.tenantId,
      required this.branchId,
      required this.orderNumber,
      required this.orderType,
      this.tableId,
      this.tableNumberSnapshot,
      this.sectionSnapshot,
      required this.guestCount,
      this.customerId,
      required this.status,
      required this.subtotalPaisa,
      required this.taxTotalPaisa,
      required this.discountTotalPaisa,
      required this.grandTotalPaisa,
      this.captainNameSnapshot,
      this.notes,
      this.invoiceId,
      required this.openedAt,
      this.closedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['tenant_id'] = Variable<String>(tenantId);
    map['branch_id'] = Variable<String>(branchId);
    map['order_number'] = Variable<String>(orderNumber);
    map['order_type'] = Variable<String>(orderType);
    if (!nullToAbsent || tableId != null) {
      map['table_id'] = Variable<String>(tableId);
    }
    if (!nullToAbsent || tableNumberSnapshot != null) {
      map['table_number_snapshot'] = Variable<String>(tableNumberSnapshot);
    }
    if (!nullToAbsent || sectionSnapshot != null) {
      map['section_snapshot'] = Variable<String>(sectionSnapshot);
    }
    map['guest_count'] = Variable<int>(guestCount);
    if (!nullToAbsent || customerId != null) {
      map['customer_id'] = Variable<String>(customerId);
    }
    map['status'] = Variable<String>(status);
    map['subtotal_paisa'] = Variable<int>(subtotalPaisa);
    map['tax_total_paisa'] = Variable<int>(taxTotalPaisa);
    map['discount_total_paisa'] = Variable<int>(discountTotalPaisa);
    map['grand_total_paisa'] = Variable<int>(grandTotalPaisa);
    if (!nullToAbsent || captainNameSnapshot != null) {
      map['captain_name_snapshot'] = Variable<String>(captainNameSnapshot);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    if (!nullToAbsent || invoiceId != null) {
      map['invoice_id'] = Variable<String>(invoiceId);
    }
    map['opened_at'] = Variable<DateTime>(openedAt);
    if (!nullToAbsent || closedAt != null) {
      map['closed_at'] = Variable<DateTime>(closedAt);
    }
    return map;
  }

  LocalRestaurantOrdersCompanion toCompanion(bool nullToAbsent) {
    return LocalRestaurantOrdersCompanion(
      id: Value(id),
      tenantId: Value(tenantId),
      branchId: Value(branchId),
      orderNumber: Value(orderNumber),
      orderType: Value(orderType),
      tableId: tableId == null && nullToAbsent
          ? const Value.absent()
          : Value(tableId),
      tableNumberSnapshot: tableNumberSnapshot == null && nullToAbsent
          ? const Value.absent()
          : Value(tableNumberSnapshot),
      sectionSnapshot: sectionSnapshot == null && nullToAbsent
          ? const Value.absent()
          : Value(sectionSnapshot),
      guestCount: Value(guestCount),
      customerId: customerId == null && nullToAbsent
          ? const Value.absent()
          : Value(customerId),
      status: Value(status),
      subtotalPaisa: Value(subtotalPaisa),
      taxTotalPaisa: Value(taxTotalPaisa),
      discountTotalPaisa: Value(discountTotalPaisa),
      grandTotalPaisa: Value(grandTotalPaisa),
      captainNameSnapshot: captainNameSnapshot == null && nullToAbsent
          ? const Value.absent()
          : Value(captainNameSnapshot),
      notes:
          notes == null && nullToAbsent ? const Value.absent() : Value(notes),
      invoiceId: invoiceId == null && nullToAbsent
          ? const Value.absent()
          : Value(invoiceId),
      openedAt: Value(openedAt),
      closedAt: closedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(closedAt),
    );
  }

  factory LocalRestaurantOrder.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalRestaurantOrder(
      id: serializer.fromJson<String>(json['id']),
      tenantId: serializer.fromJson<String>(json['tenantId']),
      branchId: serializer.fromJson<String>(json['branchId']),
      orderNumber: serializer.fromJson<String>(json['orderNumber']),
      orderType: serializer.fromJson<String>(json['orderType']),
      tableId: serializer.fromJson<String?>(json['tableId']),
      tableNumberSnapshot:
          serializer.fromJson<String?>(json['tableNumberSnapshot']),
      sectionSnapshot: serializer.fromJson<String?>(json['sectionSnapshot']),
      guestCount: serializer.fromJson<int>(json['guestCount']),
      customerId: serializer.fromJson<String?>(json['customerId']),
      status: serializer.fromJson<String>(json['status']),
      subtotalPaisa: serializer.fromJson<int>(json['subtotalPaisa']),
      taxTotalPaisa: serializer.fromJson<int>(json['taxTotalPaisa']),
      discountTotalPaisa: serializer.fromJson<int>(json['discountTotalPaisa']),
      grandTotalPaisa: serializer.fromJson<int>(json['grandTotalPaisa']),
      captainNameSnapshot:
          serializer.fromJson<String?>(json['captainNameSnapshot']),
      notes: serializer.fromJson<String?>(json['notes']),
      invoiceId: serializer.fromJson<String?>(json['invoiceId']),
      openedAt: serializer.fromJson<DateTime>(json['openedAt']),
      closedAt: serializer.fromJson<DateTime?>(json['closedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'tenantId': serializer.toJson<String>(tenantId),
      'branchId': serializer.toJson<String>(branchId),
      'orderNumber': serializer.toJson<String>(orderNumber),
      'orderType': serializer.toJson<String>(orderType),
      'tableId': serializer.toJson<String?>(tableId),
      'tableNumberSnapshot': serializer.toJson<String?>(tableNumberSnapshot),
      'sectionSnapshot': serializer.toJson<String?>(sectionSnapshot),
      'guestCount': serializer.toJson<int>(guestCount),
      'customerId': serializer.toJson<String?>(customerId),
      'status': serializer.toJson<String>(status),
      'subtotalPaisa': serializer.toJson<int>(subtotalPaisa),
      'taxTotalPaisa': serializer.toJson<int>(taxTotalPaisa),
      'discountTotalPaisa': serializer.toJson<int>(discountTotalPaisa),
      'grandTotalPaisa': serializer.toJson<int>(grandTotalPaisa),
      'captainNameSnapshot': serializer.toJson<String?>(captainNameSnapshot),
      'notes': serializer.toJson<String?>(notes),
      'invoiceId': serializer.toJson<String?>(invoiceId),
      'openedAt': serializer.toJson<DateTime>(openedAt),
      'closedAt': serializer.toJson<DateTime?>(closedAt),
    };
  }

  LocalRestaurantOrder copyWith(
          {String? id,
          String? tenantId,
          String? branchId,
          String? orderNumber,
          String? orderType,
          Value<String?> tableId = const Value.absent(),
          Value<String?> tableNumberSnapshot = const Value.absent(),
          Value<String?> sectionSnapshot = const Value.absent(),
          int? guestCount,
          Value<String?> customerId = const Value.absent(),
          String? status,
          int? subtotalPaisa,
          int? taxTotalPaisa,
          int? discountTotalPaisa,
          int? grandTotalPaisa,
          Value<String?> captainNameSnapshot = const Value.absent(),
          Value<String?> notes = const Value.absent(),
          Value<String?> invoiceId = const Value.absent(),
          DateTime? openedAt,
          Value<DateTime?> closedAt = const Value.absent()}) =>
      LocalRestaurantOrder(
        id: id ?? this.id,
        tenantId: tenantId ?? this.tenantId,
        branchId: branchId ?? this.branchId,
        orderNumber: orderNumber ?? this.orderNumber,
        orderType: orderType ?? this.orderType,
        tableId: tableId.present ? tableId.value : this.tableId,
        tableNumberSnapshot: tableNumberSnapshot.present
            ? tableNumberSnapshot.value
            : this.tableNumberSnapshot,
        sectionSnapshot: sectionSnapshot.present
            ? sectionSnapshot.value
            : this.sectionSnapshot,
        guestCount: guestCount ?? this.guestCount,
        customerId: customerId.present ? customerId.value : this.customerId,
        status: status ?? this.status,
        subtotalPaisa: subtotalPaisa ?? this.subtotalPaisa,
        taxTotalPaisa: taxTotalPaisa ?? this.taxTotalPaisa,
        discountTotalPaisa: discountTotalPaisa ?? this.discountTotalPaisa,
        grandTotalPaisa: grandTotalPaisa ?? this.grandTotalPaisa,
        captainNameSnapshot: captainNameSnapshot.present
            ? captainNameSnapshot.value
            : this.captainNameSnapshot,
        notes: notes.present ? notes.value : this.notes,
        invoiceId: invoiceId.present ? invoiceId.value : this.invoiceId,
        openedAt: openedAt ?? this.openedAt,
        closedAt: closedAt.present ? closedAt.value : this.closedAt,
      );
  LocalRestaurantOrder copyWithCompanion(LocalRestaurantOrdersCompanion data) {
    return LocalRestaurantOrder(
      id: data.id.present ? data.id.value : this.id,
      tenantId: data.tenantId.present ? data.tenantId.value : this.tenantId,
      branchId: data.branchId.present ? data.branchId.value : this.branchId,
      orderNumber:
          data.orderNumber.present ? data.orderNumber.value : this.orderNumber,
      orderType: data.orderType.present ? data.orderType.value : this.orderType,
      tableId: data.tableId.present ? data.tableId.value : this.tableId,
      tableNumberSnapshot: data.tableNumberSnapshot.present
          ? data.tableNumberSnapshot.value
          : this.tableNumberSnapshot,
      sectionSnapshot: data.sectionSnapshot.present
          ? data.sectionSnapshot.value
          : this.sectionSnapshot,
      guestCount:
          data.guestCount.present ? data.guestCount.value : this.guestCount,
      customerId:
          data.customerId.present ? data.customerId.value : this.customerId,
      status: data.status.present ? data.status.value : this.status,
      subtotalPaisa: data.subtotalPaisa.present
          ? data.subtotalPaisa.value
          : this.subtotalPaisa,
      taxTotalPaisa: data.taxTotalPaisa.present
          ? data.taxTotalPaisa.value
          : this.taxTotalPaisa,
      discountTotalPaisa: data.discountTotalPaisa.present
          ? data.discountTotalPaisa.value
          : this.discountTotalPaisa,
      grandTotalPaisa: data.grandTotalPaisa.present
          ? data.grandTotalPaisa.value
          : this.grandTotalPaisa,
      captainNameSnapshot: data.captainNameSnapshot.present
          ? data.captainNameSnapshot.value
          : this.captainNameSnapshot,
      notes: data.notes.present ? data.notes.value : this.notes,
      invoiceId: data.invoiceId.present ? data.invoiceId.value : this.invoiceId,
      openedAt: data.openedAt.present ? data.openedAt.value : this.openedAt,
      closedAt: data.closedAt.present ? data.closedAt.value : this.closedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalRestaurantOrder(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('branchId: $branchId, ')
          ..write('orderNumber: $orderNumber, ')
          ..write('orderType: $orderType, ')
          ..write('tableId: $tableId, ')
          ..write('tableNumberSnapshot: $tableNumberSnapshot, ')
          ..write('sectionSnapshot: $sectionSnapshot, ')
          ..write('guestCount: $guestCount, ')
          ..write('customerId: $customerId, ')
          ..write('status: $status, ')
          ..write('subtotalPaisa: $subtotalPaisa, ')
          ..write('taxTotalPaisa: $taxTotalPaisa, ')
          ..write('discountTotalPaisa: $discountTotalPaisa, ')
          ..write('grandTotalPaisa: $grandTotalPaisa, ')
          ..write('captainNameSnapshot: $captainNameSnapshot, ')
          ..write('notes: $notes, ')
          ..write('invoiceId: $invoiceId, ')
          ..write('openedAt: $openedAt, ')
          ..write('closedAt: $closedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      tenantId,
      branchId,
      orderNumber,
      orderType,
      tableId,
      tableNumberSnapshot,
      sectionSnapshot,
      guestCount,
      customerId,
      status,
      subtotalPaisa,
      taxTotalPaisa,
      discountTotalPaisa,
      grandTotalPaisa,
      captainNameSnapshot,
      notes,
      invoiceId,
      openedAt,
      closedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalRestaurantOrder &&
          other.id == this.id &&
          other.tenantId == this.tenantId &&
          other.branchId == this.branchId &&
          other.orderNumber == this.orderNumber &&
          other.orderType == this.orderType &&
          other.tableId == this.tableId &&
          other.tableNumberSnapshot == this.tableNumberSnapshot &&
          other.sectionSnapshot == this.sectionSnapshot &&
          other.guestCount == this.guestCount &&
          other.customerId == this.customerId &&
          other.status == this.status &&
          other.subtotalPaisa == this.subtotalPaisa &&
          other.taxTotalPaisa == this.taxTotalPaisa &&
          other.discountTotalPaisa == this.discountTotalPaisa &&
          other.grandTotalPaisa == this.grandTotalPaisa &&
          other.captainNameSnapshot == this.captainNameSnapshot &&
          other.notes == this.notes &&
          other.invoiceId == this.invoiceId &&
          other.openedAt == this.openedAt &&
          other.closedAt == this.closedAt);
}

class LocalRestaurantOrdersCompanion
    extends UpdateCompanion<LocalRestaurantOrder> {
  final Value<String> id;
  final Value<String> tenantId;
  final Value<String> branchId;
  final Value<String> orderNumber;
  final Value<String> orderType;
  final Value<String?> tableId;
  final Value<String?> tableNumberSnapshot;
  final Value<String?> sectionSnapshot;
  final Value<int> guestCount;
  final Value<String?> customerId;
  final Value<String> status;
  final Value<int> subtotalPaisa;
  final Value<int> taxTotalPaisa;
  final Value<int> discountTotalPaisa;
  final Value<int> grandTotalPaisa;
  final Value<String?> captainNameSnapshot;
  final Value<String?> notes;
  final Value<String?> invoiceId;
  final Value<DateTime> openedAt;
  final Value<DateTime?> closedAt;
  final Value<int> rowid;
  const LocalRestaurantOrdersCompanion({
    this.id = const Value.absent(),
    this.tenantId = const Value.absent(),
    this.branchId = const Value.absent(),
    this.orderNumber = const Value.absent(),
    this.orderType = const Value.absent(),
    this.tableId = const Value.absent(),
    this.tableNumberSnapshot = const Value.absent(),
    this.sectionSnapshot = const Value.absent(),
    this.guestCount = const Value.absent(),
    this.customerId = const Value.absent(),
    this.status = const Value.absent(),
    this.subtotalPaisa = const Value.absent(),
    this.taxTotalPaisa = const Value.absent(),
    this.discountTotalPaisa = const Value.absent(),
    this.grandTotalPaisa = const Value.absent(),
    this.captainNameSnapshot = const Value.absent(),
    this.notes = const Value.absent(),
    this.invoiceId = const Value.absent(),
    this.openedAt = const Value.absent(),
    this.closedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalRestaurantOrdersCompanion.insert({
    required String id,
    required String tenantId,
    required String branchId,
    required String orderNumber,
    this.orderType = const Value.absent(),
    this.tableId = const Value.absent(),
    this.tableNumberSnapshot = const Value.absent(),
    this.sectionSnapshot = const Value.absent(),
    this.guestCount = const Value.absent(),
    this.customerId = const Value.absent(),
    this.status = const Value.absent(),
    this.subtotalPaisa = const Value.absent(),
    this.taxTotalPaisa = const Value.absent(),
    this.discountTotalPaisa = const Value.absent(),
    this.grandTotalPaisa = const Value.absent(),
    this.captainNameSnapshot = const Value.absent(),
    this.notes = const Value.absent(),
    this.invoiceId = const Value.absent(),
    this.openedAt = const Value.absent(),
    this.closedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        tenantId = Value(tenantId),
        branchId = Value(branchId),
        orderNumber = Value(orderNumber);
  static Insertable<LocalRestaurantOrder> custom({
    Expression<String>? id,
    Expression<String>? tenantId,
    Expression<String>? branchId,
    Expression<String>? orderNumber,
    Expression<String>? orderType,
    Expression<String>? tableId,
    Expression<String>? tableNumberSnapshot,
    Expression<String>? sectionSnapshot,
    Expression<int>? guestCount,
    Expression<String>? customerId,
    Expression<String>? status,
    Expression<int>? subtotalPaisa,
    Expression<int>? taxTotalPaisa,
    Expression<int>? discountTotalPaisa,
    Expression<int>? grandTotalPaisa,
    Expression<String>? captainNameSnapshot,
    Expression<String>? notes,
    Expression<String>? invoiceId,
    Expression<DateTime>? openedAt,
    Expression<DateTime>? closedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (tenantId != null) 'tenant_id': tenantId,
      if (branchId != null) 'branch_id': branchId,
      if (orderNumber != null) 'order_number': orderNumber,
      if (orderType != null) 'order_type': orderType,
      if (tableId != null) 'table_id': tableId,
      if (tableNumberSnapshot != null)
        'table_number_snapshot': tableNumberSnapshot,
      if (sectionSnapshot != null) 'section_snapshot': sectionSnapshot,
      if (guestCount != null) 'guest_count': guestCount,
      if (customerId != null) 'customer_id': customerId,
      if (status != null) 'status': status,
      if (subtotalPaisa != null) 'subtotal_paisa': subtotalPaisa,
      if (taxTotalPaisa != null) 'tax_total_paisa': taxTotalPaisa,
      if (discountTotalPaisa != null)
        'discount_total_paisa': discountTotalPaisa,
      if (grandTotalPaisa != null) 'grand_total_paisa': grandTotalPaisa,
      if (captainNameSnapshot != null)
        'captain_name_snapshot': captainNameSnapshot,
      if (notes != null) 'notes': notes,
      if (invoiceId != null) 'invoice_id': invoiceId,
      if (openedAt != null) 'opened_at': openedAt,
      if (closedAt != null) 'closed_at': closedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalRestaurantOrdersCompanion copyWith(
      {Value<String>? id,
      Value<String>? tenantId,
      Value<String>? branchId,
      Value<String>? orderNumber,
      Value<String>? orderType,
      Value<String?>? tableId,
      Value<String?>? tableNumberSnapshot,
      Value<String?>? sectionSnapshot,
      Value<int>? guestCount,
      Value<String?>? customerId,
      Value<String>? status,
      Value<int>? subtotalPaisa,
      Value<int>? taxTotalPaisa,
      Value<int>? discountTotalPaisa,
      Value<int>? grandTotalPaisa,
      Value<String?>? captainNameSnapshot,
      Value<String?>? notes,
      Value<String?>? invoiceId,
      Value<DateTime>? openedAt,
      Value<DateTime?>? closedAt,
      Value<int>? rowid}) {
    return LocalRestaurantOrdersCompanion(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      branchId: branchId ?? this.branchId,
      orderNumber: orderNumber ?? this.orderNumber,
      orderType: orderType ?? this.orderType,
      tableId: tableId ?? this.tableId,
      tableNumberSnapshot: tableNumberSnapshot ?? this.tableNumberSnapshot,
      sectionSnapshot: sectionSnapshot ?? this.sectionSnapshot,
      guestCount: guestCount ?? this.guestCount,
      customerId: customerId ?? this.customerId,
      status: status ?? this.status,
      subtotalPaisa: subtotalPaisa ?? this.subtotalPaisa,
      taxTotalPaisa: taxTotalPaisa ?? this.taxTotalPaisa,
      discountTotalPaisa: discountTotalPaisa ?? this.discountTotalPaisa,
      grandTotalPaisa: grandTotalPaisa ?? this.grandTotalPaisa,
      captainNameSnapshot: captainNameSnapshot ?? this.captainNameSnapshot,
      notes: notes ?? this.notes,
      invoiceId: invoiceId ?? this.invoiceId,
      openedAt: openedAt ?? this.openedAt,
      closedAt: closedAt ?? this.closedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (tenantId.present) {
      map['tenant_id'] = Variable<String>(tenantId.value);
    }
    if (branchId.present) {
      map['branch_id'] = Variable<String>(branchId.value);
    }
    if (orderNumber.present) {
      map['order_number'] = Variable<String>(orderNumber.value);
    }
    if (orderType.present) {
      map['order_type'] = Variable<String>(orderType.value);
    }
    if (tableId.present) {
      map['table_id'] = Variable<String>(tableId.value);
    }
    if (tableNumberSnapshot.present) {
      map['table_number_snapshot'] =
          Variable<String>(tableNumberSnapshot.value);
    }
    if (sectionSnapshot.present) {
      map['section_snapshot'] = Variable<String>(sectionSnapshot.value);
    }
    if (guestCount.present) {
      map['guest_count'] = Variable<int>(guestCount.value);
    }
    if (customerId.present) {
      map['customer_id'] = Variable<String>(customerId.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (subtotalPaisa.present) {
      map['subtotal_paisa'] = Variable<int>(subtotalPaisa.value);
    }
    if (taxTotalPaisa.present) {
      map['tax_total_paisa'] = Variable<int>(taxTotalPaisa.value);
    }
    if (discountTotalPaisa.present) {
      map['discount_total_paisa'] = Variable<int>(discountTotalPaisa.value);
    }
    if (grandTotalPaisa.present) {
      map['grand_total_paisa'] = Variable<int>(grandTotalPaisa.value);
    }
    if (captainNameSnapshot.present) {
      map['captain_name_snapshot'] =
          Variable<String>(captainNameSnapshot.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (invoiceId.present) {
      map['invoice_id'] = Variable<String>(invoiceId.value);
    }
    if (openedAt.present) {
      map['opened_at'] = Variable<DateTime>(openedAt.value);
    }
    if (closedAt.present) {
      map['closed_at'] = Variable<DateTime>(closedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalRestaurantOrdersCompanion(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('branchId: $branchId, ')
          ..write('orderNumber: $orderNumber, ')
          ..write('orderType: $orderType, ')
          ..write('tableId: $tableId, ')
          ..write('tableNumberSnapshot: $tableNumberSnapshot, ')
          ..write('sectionSnapshot: $sectionSnapshot, ')
          ..write('guestCount: $guestCount, ')
          ..write('customerId: $customerId, ')
          ..write('status: $status, ')
          ..write('subtotalPaisa: $subtotalPaisa, ')
          ..write('taxTotalPaisa: $taxTotalPaisa, ')
          ..write('discountTotalPaisa: $discountTotalPaisa, ')
          ..write('grandTotalPaisa: $grandTotalPaisa, ')
          ..write('captainNameSnapshot: $captainNameSnapshot, ')
          ..write('notes: $notes, ')
          ..write('invoiceId: $invoiceId, ')
          ..write('openedAt: $openedAt, ')
          ..write('closedAt: $closedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalRestaurantKotLinesTable extends LocalRestaurantKotLines
    with TableInfo<$LocalRestaurantKotLinesTable, LocalRestaurantKotLine> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalRestaurantKotLinesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _tenantIdMeta =
      const VerificationMeta('tenantId');
  @override
  late final GeneratedColumn<String> tenantId = GeneratedColumn<String>(
      'tenant_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _orderIdMeta =
      const VerificationMeta('orderId');
  @override
  late final GeneratedColumn<String> orderId = GeneratedColumn<String>(
      'order_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _kotIdMeta = const VerificationMeta('kotId');
  @override
  late final GeneratedColumn<String> kotId = GeneratedColumn<String>(
      'kot_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _productIdMeta =
      const VerificationMeta('productId');
  @override
  late final GeneratedColumn<String> productId = GeneratedColumn<String>(
      'product_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _productNameMeta =
      const VerificationMeta('productName');
  @override
  late final GeneratedColumn<String> productName = GeneratedColumn<String>(
      'product_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _quantityMeta =
      const VerificationMeta('quantity');
  @override
  late final GeneratedColumn<double> quantity = GeneratedColumn<double>(
      'quantity', aliasedName, false,
      type: DriftSqlType.double,
      requiredDuringInsert: false,
      defaultValue: const Constant(1.0));
  static const VerificationMeta _unitPricePaisaMeta =
      const VerificationMeta('unitPricePaisa');
  @override
  late final GeneratedColumn<int> unitPricePaisa = GeneratedColumn<int>(
      'unit_price_paisa', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _totalPaisaMeta =
      const VerificationMeta('totalPaisa');
  @override
  late final GeneratedColumn<int> totalPaisa = GeneratedColumn<int>(
      'total_paisa', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _kitchenStationMeta =
      const VerificationMeta('kitchenStation');
  @override
  late final GeneratedColumn<String> kitchenStation = GeneratedColumn<String>(
      'kitchen_station', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('main_kitchen'));
  static const VerificationMeta _specialInstructionsMeta =
      const VerificationMeta('specialInstructions');
  @override
  late final GeneratedColumn<String> specialInstructions =
      GeneratedColumn<String>('special_instructions', aliasedName, true,
          type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('pending'));
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        tenantId,
        orderId,
        kotId,
        productId,
        productName,
        quantity,
        unitPricePaisa,
        totalPaisa,
        kitchenStation,
        specialInstructions,
        status,
        createdAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_restaurant_kot_lines';
  @override
  VerificationContext validateIntegrity(
      Insertable<LocalRestaurantKotLine> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('tenant_id')) {
      context.handle(_tenantIdMeta,
          tenantId.isAcceptableOrUnknown(data['tenant_id']!, _tenantIdMeta));
    } else if (isInserting) {
      context.missing(_tenantIdMeta);
    }
    if (data.containsKey('order_id')) {
      context.handle(_orderIdMeta,
          orderId.isAcceptableOrUnknown(data['order_id']!, _orderIdMeta));
    } else if (isInserting) {
      context.missing(_orderIdMeta);
    }
    if (data.containsKey('kot_id')) {
      context.handle(
          _kotIdMeta, kotId.isAcceptableOrUnknown(data['kot_id']!, _kotIdMeta));
    }
    if (data.containsKey('product_id')) {
      context.handle(_productIdMeta,
          productId.isAcceptableOrUnknown(data['product_id']!, _productIdMeta));
    } else if (isInserting) {
      context.missing(_productIdMeta);
    }
    if (data.containsKey('product_name')) {
      context.handle(
          _productNameMeta,
          productName.isAcceptableOrUnknown(
              data['product_name']!, _productNameMeta));
    } else if (isInserting) {
      context.missing(_productNameMeta);
    }
    if (data.containsKey('quantity')) {
      context.handle(_quantityMeta,
          quantity.isAcceptableOrUnknown(data['quantity']!, _quantityMeta));
    }
    if (data.containsKey('unit_price_paisa')) {
      context.handle(
          _unitPricePaisaMeta,
          unitPricePaisa.isAcceptableOrUnknown(
              data['unit_price_paisa']!, _unitPricePaisaMeta));
    }
    if (data.containsKey('total_paisa')) {
      context.handle(
          _totalPaisaMeta,
          totalPaisa.isAcceptableOrUnknown(
              data['total_paisa']!, _totalPaisaMeta));
    }
    if (data.containsKey('kitchen_station')) {
      context.handle(
          _kitchenStationMeta,
          kitchenStation.isAcceptableOrUnknown(
              data['kitchen_station']!, _kitchenStationMeta));
    }
    if (data.containsKey('special_instructions')) {
      context.handle(
          _specialInstructionsMeta,
          specialInstructions.isAcceptableOrUnknown(
              data['special_instructions']!, _specialInstructionsMeta));
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalRestaurantKotLine map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalRestaurantKotLine(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      tenantId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}tenant_id'])!,
      orderId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}order_id'])!,
      kotId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}kot_id']),
      productId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}product_id'])!,
      productName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}product_name'])!,
      quantity: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}quantity'])!,
      unitPricePaisa: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}unit_price_paisa'])!,
      totalPaisa: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}total_paisa'])!,
      kitchenStation: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}kitchen_station'])!,
      specialInstructions: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}special_instructions']),
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
    );
  }

  @override
  $LocalRestaurantKotLinesTable createAlias(String alias) {
    return $LocalRestaurantKotLinesTable(attachedDatabase, alias);
  }
}

class LocalRestaurantKotLine extends DataClass
    implements Insertable<LocalRestaurantKotLine> {
  final String id;
  final String tenantId;
  final String orderId;
  final String? kotId;
  final String productId;
  final String productName;
  final double quantity;
  final int unitPricePaisa;
  final int totalPaisa;
  final String kitchenStation;
  final String? specialInstructions;
  final String status;
  final DateTime createdAt;
  const LocalRestaurantKotLine(
      {required this.id,
      required this.tenantId,
      required this.orderId,
      this.kotId,
      required this.productId,
      required this.productName,
      required this.quantity,
      required this.unitPricePaisa,
      required this.totalPaisa,
      required this.kitchenStation,
      this.specialInstructions,
      required this.status,
      required this.createdAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['tenant_id'] = Variable<String>(tenantId);
    map['order_id'] = Variable<String>(orderId);
    if (!nullToAbsent || kotId != null) {
      map['kot_id'] = Variable<String>(kotId);
    }
    map['product_id'] = Variable<String>(productId);
    map['product_name'] = Variable<String>(productName);
    map['quantity'] = Variable<double>(quantity);
    map['unit_price_paisa'] = Variable<int>(unitPricePaisa);
    map['total_paisa'] = Variable<int>(totalPaisa);
    map['kitchen_station'] = Variable<String>(kitchenStation);
    if (!nullToAbsent || specialInstructions != null) {
      map['special_instructions'] = Variable<String>(specialInstructions);
    }
    map['status'] = Variable<String>(status);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  LocalRestaurantKotLinesCompanion toCompanion(bool nullToAbsent) {
    return LocalRestaurantKotLinesCompanion(
      id: Value(id),
      tenantId: Value(tenantId),
      orderId: Value(orderId),
      kotId:
          kotId == null && nullToAbsent ? const Value.absent() : Value(kotId),
      productId: Value(productId),
      productName: Value(productName),
      quantity: Value(quantity),
      unitPricePaisa: Value(unitPricePaisa),
      totalPaisa: Value(totalPaisa),
      kitchenStation: Value(kitchenStation),
      specialInstructions: specialInstructions == null && nullToAbsent
          ? const Value.absent()
          : Value(specialInstructions),
      status: Value(status),
      createdAt: Value(createdAt),
    );
  }

  factory LocalRestaurantKotLine.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalRestaurantKotLine(
      id: serializer.fromJson<String>(json['id']),
      tenantId: serializer.fromJson<String>(json['tenantId']),
      orderId: serializer.fromJson<String>(json['orderId']),
      kotId: serializer.fromJson<String?>(json['kotId']),
      productId: serializer.fromJson<String>(json['productId']),
      productName: serializer.fromJson<String>(json['productName']),
      quantity: serializer.fromJson<double>(json['quantity']),
      unitPricePaisa: serializer.fromJson<int>(json['unitPricePaisa']),
      totalPaisa: serializer.fromJson<int>(json['totalPaisa']),
      kitchenStation: serializer.fromJson<String>(json['kitchenStation']),
      specialInstructions:
          serializer.fromJson<String?>(json['specialInstructions']),
      status: serializer.fromJson<String>(json['status']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'tenantId': serializer.toJson<String>(tenantId),
      'orderId': serializer.toJson<String>(orderId),
      'kotId': serializer.toJson<String?>(kotId),
      'productId': serializer.toJson<String>(productId),
      'productName': serializer.toJson<String>(productName),
      'quantity': serializer.toJson<double>(quantity),
      'unitPricePaisa': serializer.toJson<int>(unitPricePaisa),
      'totalPaisa': serializer.toJson<int>(totalPaisa),
      'kitchenStation': serializer.toJson<String>(kitchenStation),
      'specialInstructions': serializer.toJson<String?>(specialInstructions),
      'status': serializer.toJson<String>(status),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  LocalRestaurantKotLine copyWith(
          {String? id,
          String? tenantId,
          String? orderId,
          Value<String?> kotId = const Value.absent(),
          String? productId,
          String? productName,
          double? quantity,
          int? unitPricePaisa,
          int? totalPaisa,
          String? kitchenStation,
          Value<String?> specialInstructions = const Value.absent(),
          String? status,
          DateTime? createdAt}) =>
      LocalRestaurantKotLine(
        id: id ?? this.id,
        tenantId: tenantId ?? this.tenantId,
        orderId: orderId ?? this.orderId,
        kotId: kotId.present ? kotId.value : this.kotId,
        productId: productId ?? this.productId,
        productName: productName ?? this.productName,
        quantity: quantity ?? this.quantity,
        unitPricePaisa: unitPricePaisa ?? this.unitPricePaisa,
        totalPaisa: totalPaisa ?? this.totalPaisa,
        kitchenStation: kitchenStation ?? this.kitchenStation,
        specialInstructions: specialInstructions.present
            ? specialInstructions.value
            : this.specialInstructions,
        status: status ?? this.status,
        createdAt: createdAt ?? this.createdAt,
      );
  LocalRestaurantKotLine copyWithCompanion(
      LocalRestaurantKotLinesCompanion data) {
    return LocalRestaurantKotLine(
      id: data.id.present ? data.id.value : this.id,
      tenantId: data.tenantId.present ? data.tenantId.value : this.tenantId,
      orderId: data.orderId.present ? data.orderId.value : this.orderId,
      kotId: data.kotId.present ? data.kotId.value : this.kotId,
      productId: data.productId.present ? data.productId.value : this.productId,
      productName:
          data.productName.present ? data.productName.value : this.productName,
      quantity: data.quantity.present ? data.quantity.value : this.quantity,
      unitPricePaisa: data.unitPricePaisa.present
          ? data.unitPricePaisa.value
          : this.unitPricePaisa,
      totalPaisa:
          data.totalPaisa.present ? data.totalPaisa.value : this.totalPaisa,
      kitchenStation: data.kitchenStation.present
          ? data.kitchenStation.value
          : this.kitchenStation,
      specialInstructions: data.specialInstructions.present
          ? data.specialInstructions.value
          : this.specialInstructions,
      status: data.status.present ? data.status.value : this.status,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalRestaurantKotLine(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('orderId: $orderId, ')
          ..write('kotId: $kotId, ')
          ..write('productId: $productId, ')
          ..write('productName: $productName, ')
          ..write('quantity: $quantity, ')
          ..write('unitPricePaisa: $unitPricePaisa, ')
          ..write('totalPaisa: $totalPaisa, ')
          ..write('kitchenStation: $kitchenStation, ')
          ..write('specialInstructions: $specialInstructions, ')
          ..write('status: $status, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      tenantId,
      orderId,
      kotId,
      productId,
      productName,
      quantity,
      unitPricePaisa,
      totalPaisa,
      kitchenStation,
      specialInstructions,
      status,
      createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalRestaurantKotLine &&
          other.id == this.id &&
          other.tenantId == this.tenantId &&
          other.orderId == this.orderId &&
          other.kotId == this.kotId &&
          other.productId == this.productId &&
          other.productName == this.productName &&
          other.quantity == this.quantity &&
          other.unitPricePaisa == this.unitPricePaisa &&
          other.totalPaisa == this.totalPaisa &&
          other.kitchenStation == this.kitchenStation &&
          other.specialInstructions == this.specialInstructions &&
          other.status == this.status &&
          other.createdAt == this.createdAt);
}

class LocalRestaurantKotLinesCompanion
    extends UpdateCompanion<LocalRestaurantKotLine> {
  final Value<String> id;
  final Value<String> tenantId;
  final Value<String> orderId;
  final Value<String?> kotId;
  final Value<String> productId;
  final Value<String> productName;
  final Value<double> quantity;
  final Value<int> unitPricePaisa;
  final Value<int> totalPaisa;
  final Value<String> kitchenStation;
  final Value<String?> specialInstructions;
  final Value<String> status;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const LocalRestaurantKotLinesCompanion({
    this.id = const Value.absent(),
    this.tenantId = const Value.absent(),
    this.orderId = const Value.absent(),
    this.kotId = const Value.absent(),
    this.productId = const Value.absent(),
    this.productName = const Value.absent(),
    this.quantity = const Value.absent(),
    this.unitPricePaisa = const Value.absent(),
    this.totalPaisa = const Value.absent(),
    this.kitchenStation = const Value.absent(),
    this.specialInstructions = const Value.absent(),
    this.status = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalRestaurantKotLinesCompanion.insert({
    required String id,
    required String tenantId,
    required String orderId,
    this.kotId = const Value.absent(),
    required String productId,
    required String productName,
    this.quantity = const Value.absent(),
    this.unitPricePaisa = const Value.absent(),
    this.totalPaisa = const Value.absent(),
    this.kitchenStation = const Value.absent(),
    this.specialInstructions = const Value.absent(),
    this.status = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        tenantId = Value(tenantId),
        orderId = Value(orderId),
        productId = Value(productId),
        productName = Value(productName);
  static Insertable<LocalRestaurantKotLine> custom({
    Expression<String>? id,
    Expression<String>? tenantId,
    Expression<String>? orderId,
    Expression<String>? kotId,
    Expression<String>? productId,
    Expression<String>? productName,
    Expression<double>? quantity,
    Expression<int>? unitPricePaisa,
    Expression<int>? totalPaisa,
    Expression<String>? kitchenStation,
    Expression<String>? specialInstructions,
    Expression<String>? status,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (tenantId != null) 'tenant_id': tenantId,
      if (orderId != null) 'order_id': orderId,
      if (kotId != null) 'kot_id': kotId,
      if (productId != null) 'product_id': productId,
      if (productName != null) 'product_name': productName,
      if (quantity != null) 'quantity': quantity,
      if (unitPricePaisa != null) 'unit_price_paisa': unitPricePaisa,
      if (totalPaisa != null) 'total_paisa': totalPaisa,
      if (kitchenStation != null) 'kitchen_station': kitchenStation,
      if (specialInstructions != null)
        'special_instructions': specialInstructions,
      if (status != null) 'status': status,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalRestaurantKotLinesCompanion copyWith(
      {Value<String>? id,
      Value<String>? tenantId,
      Value<String>? orderId,
      Value<String?>? kotId,
      Value<String>? productId,
      Value<String>? productName,
      Value<double>? quantity,
      Value<int>? unitPricePaisa,
      Value<int>? totalPaisa,
      Value<String>? kitchenStation,
      Value<String?>? specialInstructions,
      Value<String>? status,
      Value<DateTime>? createdAt,
      Value<int>? rowid}) {
    return LocalRestaurantKotLinesCompanion(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      orderId: orderId ?? this.orderId,
      kotId: kotId ?? this.kotId,
      productId: productId ?? this.productId,
      productName: productName ?? this.productName,
      quantity: quantity ?? this.quantity,
      unitPricePaisa: unitPricePaisa ?? this.unitPricePaisa,
      totalPaisa: totalPaisa ?? this.totalPaisa,
      kitchenStation: kitchenStation ?? this.kitchenStation,
      specialInstructions: specialInstructions ?? this.specialInstructions,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (tenantId.present) {
      map['tenant_id'] = Variable<String>(tenantId.value);
    }
    if (orderId.present) {
      map['order_id'] = Variable<String>(orderId.value);
    }
    if (kotId.present) {
      map['kot_id'] = Variable<String>(kotId.value);
    }
    if (productId.present) {
      map['product_id'] = Variable<String>(productId.value);
    }
    if (productName.present) {
      map['product_name'] = Variable<String>(productName.value);
    }
    if (quantity.present) {
      map['quantity'] = Variable<double>(quantity.value);
    }
    if (unitPricePaisa.present) {
      map['unit_price_paisa'] = Variable<int>(unitPricePaisa.value);
    }
    if (totalPaisa.present) {
      map['total_paisa'] = Variable<int>(totalPaisa.value);
    }
    if (kitchenStation.present) {
      map['kitchen_station'] = Variable<String>(kitchenStation.value);
    }
    if (specialInstructions.present) {
      map['special_instructions'] = Variable<String>(specialInstructions.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalRestaurantKotLinesCompanion(')
          ..write('id: $id, ')
          ..write('tenantId: $tenantId, ')
          ..write('orderId: $orderId, ')
          ..write('kotId: $kotId, ')
          ..write('productId: $productId, ')
          ..write('productName: $productName, ')
          ..write('quantity: $quantity, ')
          ..write('unitPricePaisa: $unitPricePaisa, ')
          ..write('totalPaisa: $totalPaisa, ')
          ..write('kitchenStation: $kitchenStation, ')
          ..write('specialInstructions: $specialInstructions, ')
          ..write('status: $status, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $LocalProductsTable localProducts = $LocalProductsTable(this);
  late final $LocalCustomersTable localCustomers = $LocalCustomersTable(this);
  late final $LocalInvoicesTable localInvoices = $LocalInvoicesTable(this);
  late final $LocalInvoiceLinesTable localInvoiceLines =
      $LocalInvoiceLinesTable(this);
  late final $LocalPaymentsTable localPayments = $LocalPaymentsTable(this);
  late final $LocalStockMovementsTable localStockMovements =
      $LocalStockMovementsTable(this);
  late final $SyncOutboxTable syncOutbox = $SyncOutboxTable(this);
  late final $LocalRestaurantTablesTable localRestaurantTables =
      $LocalRestaurantTablesTable(this);
  late final $LocalRestaurantOrdersTable localRestaurantOrders =
      $LocalRestaurantOrdersTable(this);
  late final $LocalRestaurantKotLinesTable localRestaurantKotLines =
      $LocalRestaurantKotLinesTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
        localProducts,
        localCustomers,
        localInvoices,
        localInvoiceLines,
        localPayments,
        localStockMovements,
        syncOutbox,
        localRestaurantTables,
        localRestaurantOrders,
        localRestaurantKotLines
      ];
}

typedef $$LocalProductsTableCreateCompanionBuilder = LocalProductsCompanion
    Function({
  required String id,
  required String tenantId,
  required String sku,
  required String name,
  Value<String?> barcode,
  required int sellingPricePaisa,
  Value<int> purchaseCostPaisa,
  Value<int> mrpPaisa,
  Value<double> gstRatePercent,
  Value<String?> hsnCode,
  Value<String?> categoryName,
  Value<String> unit,
  Value<double> stockQuantity,
  Value<String?> imageUrl,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});
typedef $$LocalProductsTableUpdateCompanionBuilder = LocalProductsCompanion
    Function({
  Value<String> id,
  Value<String> tenantId,
  Value<String> sku,
  Value<String> name,
  Value<String?> barcode,
  Value<int> sellingPricePaisa,
  Value<int> purchaseCostPaisa,
  Value<int> mrpPaisa,
  Value<double> gstRatePercent,
  Value<String?> hsnCode,
  Value<String?> categoryName,
  Value<String> unit,
  Value<double> stockQuantity,
  Value<String?> imageUrl,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});

class $$LocalProductsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalProductsTable> {
  $$LocalProductsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get sku => $composableBuilder(
      column: $table.sku, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get barcode => $composableBuilder(
      column: $table.barcode, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get sellingPricePaisa => $composableBuilder(
      column: $table.sellingPricePaisa,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get purchaseCostPaisa => $composableBuilder(
      column: $table.purchaseCostPaisa,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get mrpPaisa => $composableBuilder(
      column: $table.mrpPaisa, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get gstRatePercent => $composableBuilder(
      column: $table.gstRatePercent,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get hsnCode => $composableBuilder(
      column: $table.hsnCode, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get categoryName => $composableBuilder(
      column: $table.categoryName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get unit => $composableBuilder(
      column: $table.unit, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get stockQuantity => $composableBuilder(
      column: $table.stockQuantity, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get imageUrl => $composableBuilder(
      column: $table.imageUrl, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$LocalProductsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalProductsTable> {
  $$LocalProductsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get sku => $composableBuilder(
      column: $table.sku, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get barcode => $composableBuilder(
      column: $table.barcode, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get sellingPricePaisa => $composableBuilder(
      column: $table.sellingPricePaisa,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get purchaseCostPaisa => $composableBuilder(
      column: $table.purchaseCostPaisa,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get mrpPaisa => $composableBuilder(
      column: $table.mrpPaisa, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get gstRatePercent => $composableBuilder(
      column: $table.gstRatePercent,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get hsnCode => $composableBuilder(
      column: $table.hsnCode, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get categoryName => $composableBuilder(
      column: $table.categoryName,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get unit => $composableBuilder(
      column: $table.unit, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get stockQuantity => $composableBuilder(
      column: $table.stockQuantity,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get imageUrl => $composableBuilder(
      column: $table.imageUrl, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalProductsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalProductsTable> {
  $$LocalProductsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get tenantId =>
      $composableBuilder(column: $table.tenantId, builder: (column) => column);

  GeneratedColumn<String> get sku =>
      $composableBuilder(column: $table.sku, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get barcode =>
      $composableBuilder(column: $table.barcode, builder: (column) => column);

  GeneratedColumn<int> get sellingPricePaisa => $composableBuilder(
      column: $table.sellingPricePaisa, builder: (column) => column);

  GeneratedColumn<int> get purchaseCostPaisa => $composableBuilder(
      column: $table.purchaseCostPaisa, builder: (column) => column);

  GeneratedColumn<int> get mrpPaisa =>
      $composableBuilder(column: $table.mrpPaisa, builder: (column) => column);

  GeneratedColumn<double> get gstRatePercent => $composableBuilder(
      column: $table.gstRatePercent, builder: (column) => column);

  GeneratedColumn<String> get hsnCode =>
      $composableBuilder(column: $table.hsnCode, builder: (column) => column);

  GeneratedColumn<String> get categoryName => $composableBuilder(
      column: $table.categoryName, builder: (column) => column);

  GeneratedColumn<String> get unit =>
      $composableBuilder(column: $table.unit, builder: (column) => column);

  GeneratedColumn<double> get stockQuantity => $composableBuilder(
      column: $table.stockQuantity, builder: (column) => column);

  GeneratedColumn<String> get imageUrl =>
      $composableBuilder(column: $table.imageUrl, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$LocalProductsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalProductsTable,
    LocalProduct,
    $$LocalProductsTableFilterComposer,
    $$LocalProductsTableOrderingComposer,
    $$LocalProductsTableAnnotationComposer,
    $$LocalProductsTableCreateCompanionBuilder,
    $$LocalProductsTableUpdateCompanionBuilder,
    (
      LocalProduct,
      BaseReferences<_$AppDatabase, $LocalProductsTable, LocalProduct>
    ),
    LocalProduct,
    PrefetchHooks Function()> {
  $$LocalProductsTableTableManager(_$AppDatabase db, $LocalProductsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalProductsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalProductsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalProductsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> tenantId = const Value.absent(),
            Value<String> sku = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String?> barcode = const Value.absent(),
            Value<int> sellingPricePaisa = const Value.absent(),
            Value<int> purchaseCostPaisa = const Value.absent(),
            Value<int> mrpPaisa = const Value.absent(),
            Value<double> gstRatePercent = const Value.absent(),
            Value<String?> hsnCode = const Value.absent(),
            Value<String?> categoryName = const Value.absent(),
            Value<String> unit = const Value.absent(),
            Value<double> stockQuantity = const Value.absent(),
            Value<String?> imageUrl = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalProductsCompanion(
            id: id,
            tenantId: tenantId,
            sku: sku,
            name: name,
            barcode: barcode,
            sellingPricePaisa: sellingPricePaisa,
            purchaseCostPaisa: purchaseCostPaisa,
            mrpPaisa: mrpPaisa,
            gstRatePercent: gstRatePercent,
            hsnCode: hsnCode,
            categoryName: categoryName,
            unit: unit,
            stockQuantity: stockQuantity,
            imageUrl: imageUrl,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String tenantId,
            required String sku,
            required String name,
            Value<String?> barcode = const Value.absent(),
            required int sellingPricePaisa,
            Value<int> purchaseCostPaisa = const Value.absent(),
            Value<int> mrpPaisa = const Value.absent(),
            Value<double> gstRatePercent = const Value.absent(),
            Value<String?> hsnCode = const Value.absent(),
            Value<String?> categoryName = const Value.absent(),
            Value<String> unit = const Value.absent(),
            Value<double> stockQuantity = const Value.absent(),
            Value<String?> imageUrl = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalProductsCompanion.insert(
            id: id,
            tenantId: tenantId,
            sku: sku,
            name: name,
            barcode: barcode,
            sellingPricePaisa: sellingPricePaisa,
            purchaseCostPaisa: purchaseCostPaisa,
            mrpPaisa: mrpPaisa,
            gstRatePercent: gstRatePercent,
            hsnCode: hsnCode,
            categoryName: categoryName,
            unit: unit,
            stockQuantity: stockQuantity,
            imageUrl: imageUrl,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalProductsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalProductsTable,
    LocalProduct,
    $$LocalProductsTableFilterComposer,
    $$LocalProductsTableOrderingComposer,
    $$LocalProductsTableAnnotationComposer,
    $$LocalProductsTableCreateCompanionBuilder,
    $$LocalProductsTableUpdateCompanionBuilder,
    (
      LocalProduct,
      BaseReferences<_$AppDatabase, $LocalProductsTable, LocalProduct>
    ),
    LocalProduct,
    PrefetchHooks Function()>;
typedef $$LocalCustomersTableCreateCompanionBuilder = LocalCustomersCompanion
    Function({
  required String id,
  required String tenantId,
  required String name,
  required String phone,
  Value<int> creditLimitPaisa,
  Value<int> currentBalancePaisa,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});
typedef $$LocalCustomersTableUpdateCompanionBuilder = LocalCustomersCompanion
    Function({
  Value<String> id,
  Value<String> tenantId,
  Value<String> name,
  Value<String> phone,
  Value<int> creditLimitPaisa,
  Value<int> currentBalancePaisa,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});

class $$LocalCustomersTableFilterComposer
    extends Composer<_$AppDatabase, $LocalCustomersTable> {
  $$LocalCustomersTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get phone => $composableBuilder(
      column: $table.phone, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get creditLimitPaisa => $composableBuilder(
      column: $table.creditLimitPaisa,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get currentBalancePaisa => $composableBuilder(
      column: $table.currentBalancePaisa,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$LocalCustomersTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalCustomersTable> {
  $$LocalCustomersTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get phone => $composableBuilder(
      column: $table.phone, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get creditLimitPaisa => $composableBuilder(
      column: $table.creditLimitPaisa,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get currentBalancePaisa => $composableBuilder(
      column: $table.currentBalancePaisa,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalCustomersTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalCustomersTable> {
  $$LocalCustomersTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get tenantId =>
      $composableBuilder(column: $table.tenantId, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get phone =>
      $composableBuilder(column: $table.phone, builder: (column) => column);

  GeneratedColumn<int> get creditLimitPaisa => $composableBuilder(
      column: $table.creditLimitPaisa, builder: (column) => column);

  GeneratedColumn<int> get currentBalancePaisa => $composableBuilder(
      column: $table.currentBalancePaisa, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$LocalCustomersTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalCustomersTable,
    LocalCustomer,
    $$LocalCustomersTableFilterComposer,
    $$LocalCustomersTableOrderingComposer,
    $$LocalCustomersTableAnnotationComposer,
    $$LocalCustomersTableCreateCompanionBuilder,
    $$LocalCustomersTableUpdateCompanionBuilder,
    (
      LocalCustomer,
      BaseReferences<_$AppDatabase, $LocalCustomersTable, LocalCustomer>
    ),
    LocalCustomer,
    PrefetchHooks Function()> {
  $$LocalCustomersTableTableManager(
      _$AppDatabase db, $LocalCustomersTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalCustomersTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalCustomersTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalCustomersTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> tenantId = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String> phone = const Value.absent(),
            Value<int> creditLimitPaisa = const Value.absent(),
            Value<int> currentBalancePaisa = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalCustomersCompanion(
            id: id,
            tenantId: tenantId,
            name: name,
            phone: phone,
            creditLimitPaisa: creditLimitPaisa,
            currentBalancePaisa: currentBalancePaisa,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String tenantId,
            required String name,
            required String phone,
            Value<int> creditLimitPaisa = const Value.absent(),
            Value<int> currentBalancePaisa = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalCustomersCompanion.insert(
            id: id,
            tenantId: tenantId,
            name: name,
            phone: phone,
            creditLimitPaisa: creditLimitPaisa,
            currentBalancePaisa: currentBalancePaisa,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalCustomersTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalCustomersTable,
    LocalCustomer,
    $$LocalCustomersTableFilterComposer,
    $$LocalCustomersTableOrderingComposer,
    $$LocalCustomersTableAnnotationComposer,
    $$LocalCustomersTableCreateCompanionBuilder,
    $$LocalCustomersTableUpdateCompanionBuilder,
    (
      LocalCustomer,
      BaseReferences<_$AppDatabase, $LocalCustomersTable, LocalCustomer>
    ),
    LocalCustomer,
    PrefetchHooks Function()>;
typedef $$LocalInvoicesTableCreateCompanionBuilder = LocalInvoicesCompanion
    Function({
  required String id,
  required String tenantId,
  required String branchId,
  required String deviceId,
  required String invoiceNumber,
  Value<String?> customerId,
  Value<String?> customerName,
  required int subtotalPaisa,
  required int taxPaisa,
  required int grandTotalPaisa,
  required String paymentMethod,
  Value<String> status,
  Value<DateTime> createdAt,
  Value<int> rowid,
});
typedef $$LocalInvoicesTableUpdateCompanionBuilder = LocalInvoicesCompanion
    Function({
  Value<String> id,
  Value<String> tenantId,
  Value<String> branchId,
  Value<String> deviceId,
  Value<String> invoiceNumber,
  Value<String?> customerId,
  Value<String?> customerName,
  Value<int> subtotalPaisa,
  Value<int> taxPaisa,
  Value<int> grandTotalPaisa,
  Value<String> paymentMethod,
  Value<String> status,
  Value<DateTime> createdAt,
  Value<int> rowid,
});

class $$LocalInvoicesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalInvoicesTable> {
  $$LocalInvoicesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get branchId => $composableBuilder(
      column: $table.branchId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get deviceId => $composableBuilder(
      column: $table.deviceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get invoiceNumber => $composableBuilder(
      column: $table.invoiceNumber, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get customerName => $composableBuilder(
      column: $table.customerName, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get subtotalPaisa => $composableBuilder(
      column: $table.subtotalPaisa, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get taxPaisa => $composableBuilder(
      column: $table.taxPaisa, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get grandTotalPaisa => $composableBuilder(
      column: $table.grandTotalPaisa,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get paymentMethod => $composableBuilder(
      column: $table.paymentMethod, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));
}

class $$LocalInvoicesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalInvoicesTable> {
  $$LocalInvoicesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get branchId => $composableBuilder(
      column: $table.branchId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get deviceId => $composableBuilder(
      column: $table.deviceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get invoiceNumber => $composableBuilder(
      column: $table.invoiceNumber,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get customerName => $composableBuilder(
      column: $table.customerName,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get subtotalPaisa => $composableBuilder(
      column: $table.subtotalPaisa,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get taxPaisa => $composableBuilder(
      column: $table.taxPaisa, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get grandTotalPaisa => $composableBuilder(
      column: $table.grandTotalPaisa,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get paymentMethod => $composableBuilder(
      column: $table.paymentMethod,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalInvoicesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalInvoicesTable> {
  $$LocalInvoicesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get tenantId =>
      $composableBuilder(column: $table.tenantId, builder: (column) => column);

  GeneratedColumn<String> get branchId =>
      $composableBuilder(column: $table.branchId, builder: (column) => column);

  GeneratedColumn<String> get deviceId =>
      $composableBuilder(column: $table.deviceId, builder: (column) => column);

  GeneratedColumn<String> get invoiceNumber => $composableBuilder(
      column: $table.invoiceNumber, builder: (column) => column);

  GeneratedColumn<String> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => column);

  GeneratedColumn<String> get customerName => $composableBuilder(
      column: $table.customerName, builder: (column) => column);

  GeneratedColumn<int> get subtotalPaisa => $composableBuilder(
      column: $table.subtotalPaisa, builder: (column) => column);

  GeneratedColumn<int> get taxPaisa =>
      $composableBuilder(column: $table.taxPaisa, builder: (column) => column);

  GeneratedColumn<int> get grandTotalPaisa => $composableBuilder(
      column: $table.grandTotalPaisa, builder: (column) => column);

  GeneratedColumn<String> get paymentMethod => $composableBuilder(
      column: $table.paymentMethod, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$LocalInvoicesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalInvoicesTable,
    LocalInvoice,
    $$LocalInvoicesTableFilterComposer,
    $$LocalInvoicesTableOrderingComposer,
    $$LocalInvoicesTableAnnotationComposer,
    $$LocalInvoicesTableCreateCompanionBuilder,
    $$LocalInvoicesTableUpdateCompanionBuilder,
    (
      LocalInvoice,
      BaseReferences<_$AppDatabase, $LocalInvoicesTable, LocalInvoice>
    ),
    LocalInvoice,
    PrefetchHooks Function()> {
  $$LocalInvoicesTableTableManager(_$AppDatabase db, $LocalInvoicesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalInvoicesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalInvoicesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalInvoicesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> tenantId = const Value.absent(),
            Value<String> branchId = const Value.absent(),
            Value<String> deviceId = const Value.absent(),
            Value<String> invoiceNumber = const Value.absent(),
            Value<String?> customerId = const Value.absent(),
            Value<String?> customerName = const Value.absent(),
            Value<int> subtotalPaisa = const Value.absent(),
            Value<int> taxPaisa = const Value.absent(),
            Value<int> grandTotalPaisa = const Value.absent(),
            Value<String> paymentMethod = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalInvoicesCompanion(
            id: id,
            tenantId: tenantId,
            branchId: branchId,
            deviceId: deviceId,
            invoiceNumber: invoiceNumber,
            customerId: customerId,
            customerName: customerName,
            subtotalPaisa: subtotalPaisa,
            taxPaisa: taxPaisa,
            grandTotalPaisa: grandTotalPaisa,
            paymentMethod: paymentMethod,
            status: status,
            createdAt: createdAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String tenantId,
            required String branchId,
            required String deviceId,
            required String invoiceNumber,
            Value<String?> customerId = const Value.absent(),
            Value<String?> customerName = const Value.absent(),
            required int subtotalPaisa,
            required int taxPaisa,
            required int grandTotalPaisa,
            required String paymentMethod,
            Value<String> status = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalInvoicesCompanion.insert(
            id: id,
            tenantId: tenantId,
            branchId: branchId,
            deviceId: deviceId,
            invoiceNumber: invoiceNumber,
            customerId: customerId,
            customerName: customerName,
            subtotalPaisa: subtotalPaisa,
            taxPaisa: taxPaisa,
            grandTotalPaisa: grandTotalPaisa,
            paymentMethod: paymentMethod,
            status: status,
            createdAt: createdAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalInvoicesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalInvoicesTable,
    LocalInvoice,
    $$LocalInvoicesTableFilterComposer,
    $$LocalInvoicesTableOrderingComposer,
    $$LocalInvoicesTableAnnotationComposer,
    $$LocalInvoicesTableCreateCompanionBuilder,
    $$LocalInvoicesTableUpdateCompanionBuilder,
    (
      LocalInvoice,
      BaseReferences<_$AppDatabase, $LocalInvoicesTable, LocalInvoice>
    ),
    LocalInvoice,
    PrefetchHooks Function()>;
typedef $$LocalInvoiceLinesTableCreateCompanionBuilder
    = LocalInvoiceLinesCompanion Function({
  required String id,
  required String invoiceId,
  required String productId,
  required String productName,
  Value<String?> hsnCode,
  Value<double> gstRatePercent,
  required double quantity,
  required int unitPricePaisa,
  required int taxPaisa,
  required int totalPaisa,
  Value<int> rowid,
});
typedef $$LocalInvoiceLinesTableUpdateCompanionBuilder
    = LocalInvoiceLinesCompanion Function({
  Value<String> id,
  Value<String> invoiceId,
  Value<String> productId,
  Value<String> productName,
  Value<String?> hsnCode,
  Value<double> gstRatePercent,
  Value<double> quantity,
  Value<int> unitPricePaisa,
  Value<int> taxPaisa,
  Value<int> totalPaisa,
  Value<int> rowid,
});

class $$LocalInvoiceLinesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalInvoiceLinesTable> {
  $$LocalInvoiceLinesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get invoiceId => $composableBuilder(
      column: $table.invoiceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get productId => $composableBuilder(
      column: $table.productId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get productName => $composableBuilder(
      column: $table.productName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get hsnCode => $composableBuilder(
      column: $table.hsnCode, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get gstRatePercent => $composableBuilder(
      column: $table.gstRatePercent,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get quantity => $composableBuilder(
      column: $table.quantity, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get unitPricePaisa => $composableBuilder(
      column: $table.unitPricePaisa,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get taxPaisa => $composableBuilder(
      column: $table.taxPaisa, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get totalPaisa => $composableBuilder(
      column: $table.totalPaisa, builder: (column) => ColumnFilters(column));
}

class $$LocalInvoiceLinesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalInvoiceLinesTable> {
  $$LocalInvoiceLinesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get invoiceId => $composableBuilder(
      column: $table.invoiceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get productId => $composableBuilder(
      column: $table.productId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get productName => $composableBuilder(
      column: $table.productName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get hsnCode => $composableBuilder(
      column: $table.hsnCode, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get gstRatePercent => $composableBuilder(
      column: $table.gstRatePercent,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get quantity => $composableBuilder(
      column: $table.quantity, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get unitPricePaisa => $composableBuilder(
      column: $table.unitPricePaisa,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get taxPaisa => $composableBuilder(
      column: $table.taxPaisa, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get totalPaisa => $composableBuilder(
      column: $table.totalPaisa, builder: (column) => ColumnOrderings(column));
}

class $$LocalInvoiceLinesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalInvoiceLinesTable> {
  $$LocalInvoiceLinesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get invoiceId =>
      $composableBuilder(column: $table.invoiceId, builder: (column) => column);

  GeneratedColumn<String> get productId =>
      $composableBuilder(column: $table.productId, builder: (column) => column);

  GeneratedColumn<String> get productName => $composableBuilder(
      column: $table.productName, builder: (column) => column);

  GeneratedColumn<String> get hsnCode =>
      $composableBuilder(column: $table.hsnCode, builder: (column) => column);

  GeneratedColumn<double> get gstRatePercent => $composableBuilder(
      column: $table.gstRatePercent, builder: (column) => column);

  GeneratedColumn<double> get quantity =>
      $composableBuilder(column: $table.quantity, builder: (column) => column);

  GeneratedColumn<int> get unitPricePaisa => $composableBuilder(
      column: $table.unitPricePaisa, builder: (column) => column);

  GeneratedColumn<int> get taxPaisa =>
      $composableBuilder(column: $table.taxPaisa, builder: (column) => column);

  GeneratedColumn<int> get totalPaisa => $composableBuilder(
      column: $table.totalPaisa, builder: (column) => column);
}

class $$LocalInvoiceLinesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalInvoiceLinesTable,
    LocalInvoiceLine,
    $$LocalInvoiceLinesTableFilterComposer,
    $$LocalInvoiceLinesTableOrderingComposer,
    $$LocalInvoiceLinesTableAnnotationComposer,
    $$LocalInvoiceLinesTableCreateCompanionBuilder,
    $$LocalInvoiceLinesTableUpdateCompanionBuilder,
    (
      LocalInvoiceLine,
      BaseReferences<_$AppDatabase, $LocalInvoiceLinesTable, LocalInvoiceLine>
    ),
    LocalInvoiceLine,
    PrefetchHooks Function()> {
  $$LocalInvoiceLinesTableTableManager(
      _$AppDatabase db, $LocalInvoiceLinesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalInvoiceLinesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalInvoiceLinesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalInvoiceLinesTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> invoiceId = const Value.absent(),
            Value<String> productId = const Value.absent(),
            Value<String> productName = const Value.absent(),
            Value<String?> hsnCode = const Value.absent(),
            Value<double> gstRatePercent = const Value.absent(),
            Value<double> quantity = const Value.absent(),
            Value<int> unitPricePaisa = const Value.absent(),
            Value<int> taxPaisa = const Value.absent(),
            Value<int> totalPaisa = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalInvoiceLinesCompanion(
            id: id,
            invoiceId: invoiceId,
            productId: productId,
            productName: productName,
            hsnCode: hsnCode,
            gstRatePercent: gstRatePercent,
            quantity: quantity,
            unitPricePaisa: unitPricePaisa,
            taxPaisa: taxPaisa,
            totalPaisa: totalPaisa,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String invoiceId,
            required String productId,
            required String productName,
            Value<String?> hsnCode = const Value.absent(),
            Value<double> gstRatePercent = const Value.absent(),
            required double quantity,
            required int unitPricePaisa,
            required int taxPaisa,
            required int totalPaisa,
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalInvoiceLinesCompanion.insert(
            id: id,
            invoiceId: invoiceId,
            productId: productId,
            productName: productName,
            hsnCode: hsnCode,
            gstRatePercent: gstRatePercent,
            quantity: quantity,
            unitPricePaisa: unitPricePaisa,
            taxPaisa: taxPaisa,
            totalPaisa: totalPaisa,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalInvoiceLinesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalInvoiceLinesTable,
    LocalInvoiceLine,
    $$LocalInvoiceLinesTableFilterComposer,
    $$LocalInvoiceLinesTableOrderingComposer,
    $$LocalInvoiceLinesTableAnnotationComposer,
    $$LocalInvoiceLinesTableCreateCompanionBuilder,
    $$LocalInvoiceLinesTableUpdateCompanionBuilder,
    (
      LocalInvoiceLine,
      BaseReferences<_$AppDatabase, $LocalInvoiceLinesTable, LocalInvoiceLine>
    ),
    LocalInvoiceLine,
    PrefetchHooks Function()>;
typedef $$LocalPaymentsTableCreateCompanionBuilder = LocalPaymentsCompanion
    Function({
  required String id,
  required String invoiceId,
  required String paymentMethod,
  required int amountPaisa,
  Value<String> status,
  Value<DateTime> createdAt,
  Value<int> rowid,
});
typedef $$LocalPaymentsTableUpdateCompanionBuilder = LocalPaymentsCompanion
    Function({
  Value<String> id,
  Value<String> invoiceId,
  Value<String> paymentMethod,
  Value<int> amountPaisa,
  Value<String> status,
  Value<DateTime> createdAt,
  Value<int> rowid,
});

class $$LocalPaymentsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalPaymentsTable> {
  $$LocalPaymentsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get invoiceId => $composableBuilder(
      column: $table.invoiceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get paymentMethod => $composableBuilder(
      column: $table.paymentMethod, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get amountPaisa => $composableBuilder(
      column: $table.amountPaisa, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));
}

class $$LocalPaymentsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalPaymentsTable> {
  $$LocalPaymentsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get invoiceId => $composableBuilder(
      column: $table.invoiceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get paymentMethod => $composableBuilder(
      column: $table.paymentMethod,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get amountPaisa => $composableBuilder(
      column: $table.amountPaisa, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalPaymentsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalPaymentsTable> {
  $$LocalPaymentsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get invoiceId =>
      $composableBuilder(column: $table.invoiceId, builder: (column) => column);

  GeneratedColumn<String> get paymentMethod => $composableBuilder(
      column: $table.paymentMethod, builder: (column) => column);

  GeneratedColumn<int> get amountPaisa => $composableBuilder(
      column: $table.amountPaisa, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$LocalPaymentsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalPaymentsTable,
    LocalPayment,
    $$LocalPaymentsTableFilterComposer,
    $$LocalPaymentsTableOrderingComposer,
    $$LocalPaymentsTableAnnotationComposer,
    $$LocalPaymentsTableCreateCompanionBuilder,
    $$LocalPaymentsTableUpdateCompanionBuilder,
    (
      LocalPayment,
      BaseReferences<_$AppDatabase, $LocalPaymentsTable, LocalPayment>
    ),
    LocalPayment,
    PrefetchHooks Function()> {
  $$LocalPaymentsTableTableManager(_$AppDatabase db, $LocalPaymentsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalPaymentsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalPaymentsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalPaymentsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> invoiceId = const Value.absent(),
            Value<String> paymentMethod = const Value.absent(),
            Value<int> amountPaisa = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalPaymentsCompanion(
            id: id,
            invoiceId: invoiceId,
            paymentMethod: paymentMethod,
            amountPaisa: amountPaisa,
            status: status,
            createdAt: createdAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String invoiceId,
            required String paymentMethod,
            required int amountPaisa,
            Value<String> status = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalPaymentsCompanion.insert(
            id: id,
            invoiceId: invoiceId,
            paymentMethod: paymentMethod,
            amountPaisa: amountPaisa,
            status: status,
            createdAt: createdAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalPaymentsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalPaymentsTable,
    LocalPayment,
    $$LocalPaymentsTableFilterComposer,
    $$LocalPaymentsTableOrderingComposer,
    $$LocalPaymentsTableAnnotationComposer,
    $$LocalPaymentsTableCreateCompanionBuilder,
    $$LocalPaymentsTableUpdateCompanionBuilder,
    (
      LocalPayment,
      BaseReferences<_$AppDatabase, $LocalPaymentsTable, LocalPayment>
    ),
    LocalPayment,
    PrefetchHooks Function()>;
typedef $$LocalStockMovementsTableCreateCompanionBuilder
    = LocalStockMovementsCompanion Function({
  required String id,
  required String productId,
  required String movementType,
  required double quantity,
  required String referenceId,
  required String reason,
  Value<DateTime> createdAt,
  Value<int> rowid,
});
typedef $$LocalStockMovementsTableUpdateCompanionBuilder
    = LocalStockMovementsCompanion Function({
  Value<String> id,
  Value<String> productId,
  Value<String> movementType,
  Value<double> quantity,
  Value<String> referenceId,
  Value<String> reason,
  Value<DateTime> createdAt,
  Value<int> rowid,
});

class $$LocalStockMovementsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalStockMovementsTable> {
  $$LocalStockMovementsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get productId => $composableBuilder(
      column: $table.productId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get movementType => $composableBuilder(
      column: $table.movementType, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get quantity => $composableBuilder(
      column: $table.quantity, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get referenceId => $composableBuilder(
      column: $table.referenceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get reason => $composableBuilder(
      column: $table.reason, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));
}

class $$LocalStockMovementsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalStockMovementsTable> {
  $$LocalStockMovementsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get productId => $composableBuilder(
      column: $table.productId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get movementType => $composableBuilder(
      column: $table.movementType,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get quantity => $composableBuilder(
      column: $table.quantity, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get referenceId => $composableBuilder(
      column: $table.referenceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get reason => $composableBuilder(
      column: $table.reason, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalStockMovementsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalStockMovementsTable> {
  $$LocalStockMovementsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get productId =>
      $composableBuilder(column: $table.productId, builder: (column) => column);

  GeneratedColumn<String> get movementType => $composableBuilder(
      column: $table.movementType, builder: (column) => column);

  GeneratedColumn<double> get quantity =>
      $composableBuilder(column: $table.quantity, builder: (column) => column);

  GeneratedColumn<String> get referenceId => $composableBuilder(
      column: $table.referenceId, builder: (column) => column);

  GeneratedColumn<String> get reason =>
      $composableBuilder(column: $table.reason, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$LocalStockMovementsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalStockMovementsTable,
    LocalStockMovement,
    $$LocalStockMovementsTableFilterComposer,
    $$LocalStockMovementsTableOrderingComposer,
    $$LocalStockMovementsTableAnnotationComposer,
    $$LocalStockMovementsTableCreateCompanionBuilder,
    $$LocalStockMovementsTableUpdateCompanionBuilder,
    (
      LocalStockMovement,
      BaseReferences<_$AppDatabase, $LocalStockMovementsTable,
          LocalStockMovement>
    ),
    LocalStockMovement,
    PrefetchHooks Function()> {
  $$LocalStockMovementsTableTableManager(
      _$AppDatabase db, $LocalStockMovementsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalStockMovementsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalStockMovementsTableOrderingComposer(
                  $db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalStockMovementsTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> productId = const Value.absent(),
            Value<String> movementType = const Value.absent(),
            Value<double> quantity = const Value.absent(),
            Value<String> referenceId = const Value.absent(),
            Value<String> reason = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalStockMovementsCompanion(
            id: id,
            productId: productId,
            movementType: movementType,
            quantity: quantity,
            referenceId: referenceId,
            reason: reason,
            createdAt: createdAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String productId,
            required String movementType,
            required double quantity,
            required String referenceId,
            required String reason,
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalStockMovementsCompanion.insert(
            id: id,
            productId: productId,
            movementType: movementType,
            quantity: quantity,
            referenceId: referenceId,
            reason: reason,
            createdAt: createdAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalStockMovementsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalStockMovementsTable,
    LocalStockMovement,
    $$LocalStockMovementsTableFilterComposer,
    $$LocalStockMovementsTableOrderingComposer,
    $$LocalStockMovementsTableAnnotationComposer,
    $$LocalStockMovementsTableCreateCompanionBuilder,
    $$LocalStockMovementsTableUpdateCompanionBuilder,
    (
      LocalStockMovement,
      BaseReferences<_$AppDatabase, $LocalStockMovementsTable,
          LocalStockMovement>
    ),
    LocalStockMovement,
    PrefetchHooks Function()>;
typedef $$SyncOutboxTableCreateCompanionBuilder = SyncOutboxCompanion Function({
  required String operationId,
  required String deviceId,
  required int sequence,
  required String operationType,
  Value<int> schemaVersion,
  required String payload,
  Value<String> status,
  Value<int> retryCount,
  Value<DateTime> createdAt,
  Value<String?> lastError,
  Value<String?> serverEntityId,
  Value<int> rowid,
});
typedef $$SyncOutboxTableUpdateCompanionBuilder = SyncOutboxCompanion Function({
  Value<String> operationId,
  Value<String> deviceId,
  Value<int> sequence,
  Value<String> operationType,
  Value<int> schemaVersion,
  Value<String> payload,
  Value<String> status,
  Value<int> retryCount,
  Value<DateTime> createdAt,
  Value<String?> lastError,
  Value<String?> serverEntityId,
  Value<int> rowid,
});

class $$SyncOutboxTableFilterComposer
    extends Composer<_$AppDatabase, $SyncOutboxTable> {
  $$SyncOutboxTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get operationId => $composableBuilder(
      column: $table.operationId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get deviceId => $composableBuilder(
      column: $table.deviceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get sequence => $composableBuilder(
      column: $table.sequence, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get operationType => $composableBuilder(
      column: $table.operationType, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get schemaVersion => $composableBuilder(
      column: $table.schemaVersion, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get lastError => $composableBuilder(
      column: $table.lastError, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get serverEntityId => $composableBuilder(
      column: $table.serverEntityId,
      builder: (column) => ColumnFilters(column));
}

class $$SyncOutboxTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncOutboxTable> {
  $$SyncOutboxTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get operationId => $composableBuilder(
      column: $table.operationId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get deviceId => $composableBuilder(
      column: $table.deviceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get sequence => $composableBuilder(
      column: $table.sequence, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get operationType => $composableBuilder(
      column: $table.operationType,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get schemaVersion => $composableBuilder(
      column: $table.schemaVersion,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get lastError => $composableBuilder(
      column: $table.lastError, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get serverEntityId => $composableBuilder(
      column: $table.serverEntityId,
      builder: (column) => ColumnOrderings(column));
}

class $$SyncOutboxTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncOutboxTable> {
  $$SyncOutboxTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get operationId => $composableBuilder(
      column: $table.operationId, builder: (column) => column);

  GeneratedColumn<String> get deviceId =>
      $composableBuilder(column: $table.deviceId, builder: (column) => column);

  GeneratedColumn<int> get sequence =>
      $composableBuilder(column: $table.sequence, builder: (column) => column);

  GeneratedColumn<String> get operationType => $composableBuilder(
      column: $table.operationType, builder: (column) => column);

  GeneratedColumn<int> get schemaVersion => $composableBuilder(
      column: $table.schemaVersion, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<String> get lastError =>
      $composableBuilder(column: $table.lastError, builder: (column) => column);

  GeneratedColumn<String> get serverEntityId => $composableBuilder(
      column: $table.serverEntityId, builder: (column) => column);
}

class $$SyncOutboxTableTableManager extends RootTableManager<
    _$AppDatabase,
    $SyncOutboxTable,
    SyncOutboxData,
    $$SyncOutboxTableFilterComposer,
    $$SyncOutboxTableOrderingComposer,
    $$SyncOutboxTableAnnotationComposer,
    $$SyncOutboxTableCreateCompanionBuilder,
    $$SyncOutboxTableUpdateCompanionBuilder,
    (
      SyncOutboxData,
      BaseReferences<_$AppDatabase, $SyncOutboxTable, SyncOutboxData>
    ),
    SyncOutboxData,
    PrefetchHooks Function()> {
  $$SyncOutboxTableTableManager(_$AppDatabase db, $SyncOutboxTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncOutboxTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncOutboxTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncOutboxTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> operationId = const Value.absent(),
            Value<String> deviceId = const Value.absent(),
            Value<int> sequence = const Value.absent(),
            Value<String> operationType = const Value.absent(),
            Value<int> schemaVersion = const Value.absent(),
            Value<String> payload = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<int> retryCount = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<String?> lastError = const Value.absent(),
            Value<String?> serverEntityId = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              SyncOutboxCompanion(
            operationId: operationId,
            deviceId: deviceId,
            sequence: sequence,
            operationType: operationType,
            schemaVersion: schemaVersion,
            payload: payload,
            status: status,
            retryCount: retryCount,
            createdAt: createdAt,
            lastError: lastError,
            serverEntityId: serverEntityId,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String operationId,
            required String deviceId,
            required int sequence,
            required String operationType,
            Value<int> schemaVersion = const Value.absent(),
            required String payload,
            Value<String> status = const Value.absent(),
            Value<int> retryCount = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<String?> lastError = const Value.absent(),
            Value<String?> serverEntityId = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              SyncOutboxCompanion.insert(
            operationId: operationId,
            deviceId: deviceId,
            sequence: sequence,
            operationType: operationType,
            schemaVersion: schemaVersion,
            payload: payload,
            status: status,
            retryCount: retryCount,
            createdAt: createdAt,
            lastError: lastError,
            serverEntityId: serverEntityId,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$SyncOutboxTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $SyncOutboxTable,
    SyncOutboxData,
    $$SyncOutboxTableFilterComposer,
    $$SyncOutboxTableOrderingComposer,
    $$SyncOutboxTableAnnotationComposer,
    $$SyncOutboxTableCreateCompanionBuilder,
    $$SyncOutboxTableUpdateCompanionBuilder,
    (
      SyncOutboxData,
      BaseReferences<_$AppDatabase, $SyncOutboxTable, SyncOutboxData>
    ),
    SyncOutboxData,
    PrefetchHooks Function()>;
typedef $$LocalRestaurantTablesTableCreateCompanionBuilder
    = LocalRestaurantTablesCompanion Function({
  required String id,
  required String tenantId,
  required String branchId,
  required String tableNumber,
  Value<String?> name,
  Value<String> section,
  Value<int> seatingCapacity,
  Value<String> status,
  Value<int> currentGuestCount,
  Value<DateTime?> occupiedAt,
  Value<int> sortOrder,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});
typedef $$LocalRestaurantTablesTableUpdateCompanionBuilder
    = LocalRestaurantTablesCompanion Function({
  Value<String> id,
  Value<String> tenantId,
  Value<String> branchId,
  Value<String> tableNumber,
  Value<String?> name,
  Value<String> section,
  Value<int> seatingCapacity,
  Value<String> status,
  Value<int> currentGuestCount,
  Value<DateTime?> occupiedAt,
  Value<int> sortOrder,
  Value<DateTime> updatedAt,
  Value<int> rowid,
});

class $$LocalRestaurantTablesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalRestaurantTablesTable> {
  $$LocalRestaurantTablesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get branchId => $composableBuilder(
      column: $table.branchId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get tableNumber => $composableBuilder(
      column: $table.tableNumber, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get section => $composableBuilder(
      column: $table.section, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get seatingCapacity => $composableBuilder(
      column: $table.seatingCapacity,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get currentGuestCount => $composableBuilder(
      column: $table.currentGuestCount,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get occupiedAt => $composableBuilder(
      column: $table.occupiedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get sortOrder => $composableBuilder(
      column: $table.sortOrder, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$LocalRestaurantTablesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalRestaurantTablesTable> {
  $$LocalRestaurantTablesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get branchId => $composableBuilder(
      column: $table.branchId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get tableNumber => $composableBuilder(
      column: $table.tableNumber, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get section => $composableBuilder(
      column: $table.section, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get seatingCapacity => $composableBuilder(
      column: $table.seatingCapacity,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get currentGuestCount => $composableBuilder(
      column: $table.currentGuestCount,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get occupiedAt => $composableBuilder(
      column: $table.occupiedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get sortOrder => $composableBuilder(
      column: $table.sortOrder, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalRestaurantTablesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalRestaurantTablesTable> {
  $$LocalRestaurantTablesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get tenantId =>
      $composableBuilder(column: $table.tenantId, builder: (column) => column);

  GeneratedColumn<String> get branchId =>
      $composableBuilder(column: $table.branchId, builder: (column) => column);

  GeneratedColumn<String> get tableNumber => $composableBuilder(
      column: $table.tableNumber, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get section =>
      $composableBuilder(column: $table.section, builder: (column) => column);

  GeneratedColumn<int> get seatingCapacity => $composableBuilder(
      column: $table.seatingCapacity, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<int> get currentGuestCount => $composableBuilder(
      column: $table.currentGuestCount, builder: (column) => column);

  GeneratedColumn<DateTime> get occupiedAt => $composableBuilder(
      column: $table.occupiedAt, builder: (column) => column);

  GeneratedColumn<int> get sortOrder =>
      $composableBuilder(column: $table.sortOrder, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$LocalRestaurantTablesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalRestaurantTablesTable,
    LocalRestaurantTable,
    $$LocalRestaurantTablesTableFilterComposer,
    $$LocalRestaurantTablesTableOrderingComposer,
    $$LocalRestaurantTablesTableAnnotationComposer,
    $$LocalRestaurantTablesTableCreateCompanionBuilder,
    $$LocalRestaurantTablesTableUpdateCompanionBuilder,
    (
      LocalRestaurantTable,
      BaseReferences<_$AppDatabase, $LocalRestaurantTablesTable,
          LocalRestaurantTable>
    ),
    LocalRestaurantTable,
    PrefetchHooks Function()> {
  $$LocalRestaurantTablesTableTableManager(
      _$AppDatabase db, $LocalRestaurantTablesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalRestaurantTablesTableFilterComposer(
                  $db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalRestaurantTablesTableOrderingComposer(
                  $db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalRestaurantTablesTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> tenantId = const Value.absent(),
            Value<String> branchId = const Value.absent(),
            Value<String> tableNumber = const Value.absent(),
            Value<String?> name = const Value.absent(),
            Value<String> section = const Value.absent(),
            Value<int> seatingCapacity = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<int> currentGuestCount = const Value.absent(),
            Value<DateTime?> occupiedAt = const Value.absent(),
            Value<int> sortOrder = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalRestaurantTablesCompanion(
            id: id,
            tenantId: tenantId,
            branchId: branchId,
            tableNumber: tableNumber,
            name: name,
            section: section,
            seatingCapacity: seatingCapacity,
            status: status,
            currentGuestCount: currentGuestCount,
            occupiedAt: occupiedAt,
            sortOrder: sortOrder,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String tenantId,
            required String branchId,
            required String tableNumber,
            Value<String?> name = const Value.absent(),
            Value<String> section = const Value.absent(),
            Value<int> seatingCapacity = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<int> currentGuestCount = const Value.absent(),
            Value<DateTime?> occupiedAt = const Value.absent(),
            Value<int> sortOrder = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalRestaurantTablesCompanion.insert(
            id: id,
            tenantId: tenantId,
            branchId: branchId,
            tableNumber: tableNumber,
            name: name,
            section: section,
            seatingCapacity: seatingCapacity,
            status: status,
            currentGuestCount: currentGuestCount,
            occupiedAt: occupiedAt,
            sortOrder: sortOrder,
            updatedAt: updatedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalRestaurantTablesTableProcessedTableManager
    = ProcessedTableManager<
        _$AppDatabase,
        $LocalRestaurantTablesTable,
        LocalRestaurantTable,
        $$LocalRestaurantTablesTableFilterComposer,
        $$LocalRestaurantTablesTableOrderingComposer,
        $$LocalRestaurantTablesTableAnnotationComposer,
        $$LocalRestaurantTablesTableCreateCompanionBuilder,
        $$LocalRestaurantTablesTableUpdateCompanionBuilder,
        (
          LocalRestaurantTable,
          BaseReferences<_$AppDatabase, $LocalRestaurantTablesTable,
              LocalRestaurantTable>
        ),
        LocalRestaurantTable,
        PrefetchHooks Function()>;
typedef $$LocalRestaurantOrdersTableCreateCompanionBuilder
    = LocalRestaurantOrdersCompanion Function({
  required String id,
  required String tenantId,
  required String branchId,
  required String orderNumber,
  Value<String> orderType,
  Value<String?> tableId,
  Value<String?> tableNumberSnapshot,
  Value<String?> sectionSnapshot,
  Value<int> guestCount,
  Value<String?> customerId,
  Value<String> status,
  Value<int> subtotalPaisa,
  Value<int> taxTotalPaisa,
  Value<int> discountTotalPaisa,
  Value<int> grandTotalPaisa,
  Value<String?> captainNameSnapshot,
  Value<String?> notes,
  Value<String?> invoiceId,
  Value<DateTime> openedAt,
  Value<DateTime?> closedAt,
  Value<int> rowid,
});
typedef $$LocalRestaurantOrdersTableUpdateCompanionBuilder
    = LocalRestaurantOrdersCompanion Function({
  Value<String> id,
  Value<String> tenantId,
  Value<String> branchId,
  Value<String> orderNumber,
  Value<String> orderType,
  Value<String?> tableId,
  Value<String?> tableNumberSnapshot,
  Value<String?> sectionSnapshot,
  Value<int> guestCount,
  Value<String?> customerId,
  Value<String> status,
  Value<int> subtotalPaisa,
  Value<int> taxTotalPaisa,
  Value<int> discountTotalPaisa,
  Value<int> grandTotalPaisa,
  Value<String?> captainNameSnapshot,
  Value<String?> notes,
  Value<String?> invoiceId,
  Value<DateTime> openedAt,
  Value<DateTime?> closedAt,
  Value<int> rowid,
});

class $$LocalRestaurantOrdersTableFilterComposer
    extends Composer<_$AppDatabase, $LocalRestaurantOrdersTable> {
  $$LocalRestaurantOrdersTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get branchId => $composableBuilder(
      column: $table.branchId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get orderNumber => $composableBuilder(
      column: $table.orderNumber, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get orderType => $composableBuilder(
      column: $table.orderType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get tableId => $composableBuilder(
      column: $table.tableId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get tableNumberSnapshot => $composableBuilder(
      column: $table.tableNumberSnapshot,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get sectionSnapshot => $composableBuilder(
      column: $table.sectionSnapshot,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get guestCount => $composableBuilder(
      column: $table.guestCount, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get subtotalPaisa => $composableBuilder(
      column: $table.subtotalPaisa, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get taxTotalPaisa => $composableBuilder(
      column: $table.taxTotalPaisa, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get discountTotalPaisa => $composableBuilder(
      column: $table.discountTotalPaisa,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get grandTotalPaisa => $composableBuilder(
      column: $table.grandTotalPaisa,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get captainNameSnapshot => $composableBuilder(
      column: $table.captainNameSnapshot,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get invoiceId => $composableBuilder(
      column: $table.invoiceId, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get openedAt => $composableBuilder(
      column: $table.openedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get closedAt => $composableBuilder(
      column: $table.closedAt, builder: (column) => ColumnFilters(column));
}

class $$LocalRestaurantOrdersTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalRestaurantOrdersTable> {
  $$LocalRestaurantOrdersTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get branchId => $composableBuilder(
      column: $table.branchId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get orderNumber => $composableBuilder(
      column: $table.orderNumber, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get orderType => $composableBuilder(
      column: $table.orderType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get tableId => $composableBuilder(
      column: $table.tableId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get tableNumberSnapshot => $composableBuilder(
      column: $table.tableNumberSnapshot,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get sectionSnapshot => $composableBuilder(
      column: $table.sectionSnapshot,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get guestCount => $composableBuilder(
      column: $table.guestCount, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get subtotalPaisa => $composableBuilder(
      column: $table.subtotalPaisa,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get taxTotalPaisa => $composableBuilder(
      column: $table.taxTotalPaisa,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get discountTotalPaisa => $composableBuilder(
      column: $table.discountTotalPaisa,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get grandTotalPaisa => $composableBuilder(
      column: $table.grandTotalPaisa,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get captainNameSnapshot => $composableBuilder(
      column: $table.captainNameSnapshot,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get notes => $composableBuilder(
      column: $table.notes, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get invoiceId => $composableBuilder(
      column: $table.invoiceId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get openedAt => $composableBuilder(
      column: $table.openedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get closedAt => $composableBuilder(
      column: $table.closedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalRestaurantOrdersTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalRestaurantOrdersTable> {
  $$LocalRestaurantOrdersTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get tenantId =>
      $composableBuilder(column: $table.tenantId, builder: (column) => column);

  GeneratedColumn<String> get branchId =>
      $composableBuilder(column: $table.branchId, builder: (column) => column);

  GeneratedColumn<String> get orderNumber => $composableBuilder(
      column: $table.orderNumber, builder: (column) => column);

  GeneratedColumn<String> get orderType =>
      $composableBuilder(column: $table.orderType, builder: (column) => column);

  GeneratedColumn<String> get tableId =>
      $composableBuilder(column: $table.tableId, builder: (column) => column);

  GeneratedColumn<String> get tableNumberSnapshot => $composableBuilder(
      column: $table.tableNumberSnapshot, builder: (column) => column);

  GeneratedColumn<String> get sectionSnapshot => $composableBuilder(
      column: $table.sectionSnapshot, builder: (column) => column);

  GeneratedColumn<int> get guestCount => $composableBuilder(
      column: $table.guestCount, builder: (column) => column);

  GeneratedColumn<String> get customerId => $composableBuilder(
      column: $table.customerId, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<int> get subtotalPaisa => $composableBuilder(
      column: $table.subtotalPaisa, builder: (column) => column);

  GeneratedColumn<int> get taxTotalPaisa => $composableBuilder(
      column: $table.taxTotalPaisa, builder: (column) => column);

  GeneratedColumn<int> get discountTotalPaisa => $composableBuilder(
      column: $table.discountTotalPaisa, builder: (column) => column);

  GeneratedColumn<int> get grandTotalPaisa => $composableBuilder(
      column: $table.grandTotalPaisa, builder: (column) => column);

  GeneratedColumn<String> get captainNameSnapshot => $composableBuilder(
      column: $table.captainNameSnapshot, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<String> get invoiceId =>
      $composableBuilder(column: $table.invoiceId, builder: (column) => column);

  GeneratedColumn<DateTime> get openedAt =>
      $composableBuilder(column: $table.openedAt, builder: (column) => column);

  GeneratedColumn<DateTime> get closedAt =>
      $composableBuilder(column: $table.closedAt, builder: (column) => column);
}

class $$LocalRestaurantOrdersTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalRestaurantOrdersTable,
    LocalRestaurantOrder,
    $$LocalRestaurantOrdersTableFilterComposer,
    $$LocalRestaurantOrdersTableOrderingComposer,
    $$LocalRestaurantOrdersTableAnnotationComposer,
    $$LocalRestaurantOrdersTableCreateCompanionBuilder,
    $$LocalRestaurantOrdersTableUpdateCompanionBuilder,
    (
      LocalRestaurantOrder,
      BaseReferences<_$AppDatabase, $LocalRestaurantOrdersTable,
          LocalRestaurantOrder>
    ),
    LocalRestaurantOrder,
    PrefetchHooks Function()> {
  $$LocalRestaurantOrdersTableTableManager(
      _$AppDatabase db, $LocalRestaurantOrdersTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalRestaurantOrdersTableFilterComposer(
                  $db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalRestaurantOrdersTableOrderingComposer(
                  $db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalRestaurantOrdersTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> tenantId = const Value.absent(),
            Value<String> branchId = const Value.absent(),
            Value<String> orderNumber = const Value.absent(),
            Value<String> orderType = const Value.absent(),
            Value<String?> tableId = const Value.absent(),
            Value<String?> tableNumberSnapshot = const Value.absent(),
            Value<String?> sectionSnapshot = const Value.absent(),
            Value<int> guestCount = const Value.absent(),
            Value<String?> customerId = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<int> subtotalPaisa = const Value.absent(),
            Value<int> taxTotalPaisa = const Value.absent(),
            Value<int> discountTotalPaisa = const Value.absent(),
            Value<int> grandTotalPaisa = const Value.absent(),
            Value<String?> captainNameSnapshot = const Value.absent(),
            Value<String?> notes = const Value.absent(),
            Value<String?> invoiceId = const Value.absent(),
            Value<DateTime> openedAt = const Value.absent(),
            Value<DateTime?> closedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalRestaurantOrdersCompanion(
            id: id,
            tenantId: tenantId,
            branchId: branchId,
            orderNumber: orderNumber,
            orderType: orderType,
            tableId: tableId,
            tableNumberSnapshot: tableNumberSnapshot,
            sectionSnapshot: sectionSnapshot,
            guestCount: guestCount,
            customerId: customerId,
            status: status,
            subtotalPaisa: subtotalPaisa,
            taxTotalPaisa: taxTotalPaisa,
            discountTotalPaisa: discountTotalPaisa,
            grandTotalPaisa: grandTotalPaisa,
            captainNameSnapshot: captainNameSnapshot,
            notes: notes,
            invoiceId: invoiceId,
            openedAt: openedAt,
            closedAt: closedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String tenantId,
            required String branchId,
            required String orderNumber,
            Value<String> orderType = const Value.absent(),
            Value<String?> tableId = const Value.absent(),
            Value<String?> tableNumberSnapshot = const Value.absent(),
            Value<String?> sectionSnapshot = const Value.absent(),
            Value<int> guestCount = const Value.absent(),
            Value<String?> customerId = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<int> subtotalPaisa = const Value.absent(),
            Value<int> taxTotalPaisa = const Value.absent(),
            Value<int> discountTotalPaisa = const Value.absent(),
            Value<int> grandTotalPaisa = const Value.absent(),
            Value<String?> captainNameSnapshot = const Value.absent(),
            Value<String?> notes = const Value.absent(),
            Value<String?> invoiceId = const Value.absent(),
            Value<DateTime> openedAt = const Value.absent(),
            Value<DateTime?> closedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalRestaurantOrdersCompanion.insert(
            id: id,
            tenantId: tenantId,
            branchId: branchId,
            orderNumber: orderNumber,
            orderType: orderType,
            tableId: tableId,
            tableNumberSnapshot: tableNumberSnapshot,
            sectionSnapshot: sectionSnapshot,
            guestCount: guestCount,
            customerId: customerId,
            status: status,
            subtotalPaisa: subtotalPaisa,
            taxTotalPaisa: taxTotalPaisa,
            discountTotalPaisa: discountTotalPaisa,
            grandTotalPaisa: grandTotalPaisa,
            captainNameSnapshot: captainNameSnapshot,
            notes: notes,
            invoiceId: invoiceId,
            openedAt: openedAt,
            closedAt: closedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalRestaurantOrdersTableProcessedTableManager
    = ProcessedTableManager<
        _$AppDatabase,
        $LocalRestaurantOrdersTable,
        LocalRestaurantOrder,
        $$LocalRestaurantOrdersTableFilterComposer,
        $$LocalRestaurantOrdersTableOrderingComposer,
        $$LocalRestaurantOrdersTableAnnotationComposer,
        $$LocalRestaurantOrdersTableCreateCompanionBuilder,
        $$LocalRestaurantOrdersTableUpdateCompanionBuilder,
        (
          LocalRestaurantOrder,
          BaseReferences<_$AppDatabase, $LocalRestaurantOrdersTable,
              LocalRestaurantOrder>
        ),
        LocalRestaurantOrder,
        PrefetchHooks Function()>;
typedef $$LocalRestaurantKotLinesTableCreateCompanionBuilder
    = LocalRestaurantKotLinesCompanion Function({
  required String id,
  required String tenantId,
  required String orderId,
  Value<String?> kotId,
  required String productId,
  required String productName,
  Value<double> quantity,
  Value<int> unitPricePaisa,
  Value<int> totalPaisa,
  Value<String> kitchenStation,
  Value<String?> specialInstructions,
  Value<String> status,
  Value<DateTime> createdAt,
  Value<int> rowid,
});
typedef $$LocalRestaurantKotLinesTableUpdateCompanionBuilder
    = LocalRestaurantKotLinesCompanion Function({
  Value<String> id,
  Value<String> tenantId,
  Value<String> orderId,
  Value<String?> kotId,
  Value<String> productId,
  Value<String> productName,
  Value<double> quantity,
  Value<int> unitPricePaisa,
  Value<int> totalPaisa,
  Value<String> kitchenStation,
  Value<String?> specialInstructions,
  Value<String> status,
  Value<DateTime> createdAt,
  Value<int> rowid,
});

class $$LocalRestaurantKotLinesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalRestaurantKotLinesTable> {
  $$LocalRestaurantKotLinesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get orderId => $composableBuilder(
      column: $table.orderId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get kotId => $composableBuilder(
      column: $table.kotId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get productId => $composableBuilder(
      column: $table.productId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get productName => $composableBuilder(
      column: $table.productName, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get quantity => $composableBuilder(
      column: $table.quantity, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get unitPricePaisa => $composableBuilder(
      column: $table.unitPricePaisa,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get totalPaisa => $composableBuilder(
      column: $table.totalPaisa, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get kitchenStation => $composableBuilder(
      column: $table.kitchenStation,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get specialInstructions => $composableBuilder(
      column: $table.specialInstructions,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));
}

class $$LocalRestaurantKotLinesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalRestaurantKotLinesTable> {
  $$LocalRestaurantKotLinesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get tenantId => $composableBuilder(
      column: $table.tenantId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get orderId => $composableBuilder(
      column: $table.orderId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get kotId => $composableBuilder(
      column: $table.kotId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get productId => $composableBuilder(
      column: $table.productId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get productName => $composableBuilder(
      column: $table.productName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get quantity => $composableBuilder(
      column: $table.quantity, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get unitPricePaisa => $composableBuilder(
      column: $table.unitPricePaisa,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get totalPaisa => $composableBuilder(
      column: $table.totalPaisa, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get kitchenStation => $composableBuilder(
      column: $table.kitchenStation,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get specialInstructions => $composableBuilder(
      column: $table.specialInstructions,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalRestaurantKotLinesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalRestaurantKotLinesTable> {
  $$LocalRestaurantKotLinesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get tenantId =>
      $composableBuilder(column: $table.tenantId, builder: (column) => column);

  GeneratedColumn<String> get orderId =>
      $composableBuilder(column: $table.orderId, builder: (column) => column);

  GeneratedColumn<String> get kotId =>
      $composableBuilder(column: $table.kotId, builder: (column) => column);

  GeneratedColumn<String> get productId =>
      $composableBuilder(column: $table.productId, builder: (column) => column);

  GeneratedColumn<String> get productName => $composableBuilder(
      column: $table.productName, builder: (column) => column);

  GeneratedColumn<double> get quantity =>
      $composableBuilder(column: $table.quantity, builder: (column) => column);

  GeneratedColumn<int> get unitPricePaisa => $composableBuilder(
      column: $table.unitPricePaisa, builder: (column) => column);

  GeneratedColumn<int> get totalPaisa => $composableBuilder(
      column: $table.totalPaisa, builder: (column) => column);

  GeneratedColumn<String> get kitchenStation => $composableBuilder(
      column: $table.kitchenStation, builder: (column) => column);

  GeneratedColumn<String> get specialInstructions => $composableBuilder(
      column: $table.specialInstructions, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$LocalRestaurantKotLinesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalRestaurantKotLinesTable,
    LocalRestaurantKotLine,
    $$LocalRestaurantKotLinesTableFilterComposer,
    $$LocalRestaurantKotLinesTableOrderingComposer,
    $$LocalRestaurantKotLinesTableAnnotationComposer,
    $$LocalRestaurantKotLinesTableCreateCompanionBuilder,
    $$LocalRestaurantKotLinesTableUpdateCompanionBuilder,
    (
      LocalRestaurantKotLine,
      BaseReferences<_$AppDatabase, $LocalRestaurantKotLinesTable,
          LocalRestaurantKotLine>
    ),
    LocalRestaurantKotLine,
    PrefetchHooks Function()> {
  $$LocalRestaurantKotLinesTableTableManager(
      _$AppDatabase db, $LocalRestaurantKotLinesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalRestaurantKotLinesTableFilterComposer(
                  $db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalRestaurantKotLinesTableOrderingComposer(
                  $db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalRestaurantKotLinesTableAnnotationComposer(
                  $db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> tenantId = const Value.absent(),
            Value<String> orderId = const Value.absent(),
            Value<String?> kotId = const Value.absent(),
            Value<String> productId = const Value.absent(),
            Value<String> productName = const Value.absent(),
            Value<double> quantity = const Value.absent(),
            Value<int> unitPricePaisa = const Value.absent(),
            Value<int> totalPaisa = const Value.absent(),
            Value<String> kitchenStation = const Value.absent(),
            Value<String?> specialInstructions = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalRestaurantKotLinesCompanion(
            id: id,
            tenantId: tenantId,
            orderId: orderId,
            kotId: kotId,
            productId: productId,
            productName: productName,
            quantity: quantity,
            unitPricePaisa: unitPricePaisa,
            totalPaisa: totalPaisa,
            kitchenStation: kitchenStation,
            specialInstructions: specialInstructions,
            status: status,
            createdAt: createdAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String tenantId,
            required String orderId,
            Value<String?> kotId = const Value.absent(),
            required String productId,
            required String productName,
            Value<double> quantity = const Value.absent(),
            Value<int> unitPricePaisa = const Value.absent(),
            Value<int> totalPaisa = const Value.absent(),
            Value<String> kitchenStation = const Value.absent(),
            Value<String?> specialInstructions = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              LocalRestaurantKotLinesCompanion.insert(
            id: id,
            tenantId: tenantId,
            orderId: orderId,
            kotId: kotId,
            productId: productId,
            productName: productName,
            quantity: quantity,
            unitPricePaisa: unitPricePaisa,
            totalPaisa: totalPaisa,
            kitchenStation: kitchenStation,
            specialInstructions: specialInstructions,
            status: status,
            createdAt: createdAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalRestaurantKotLinesTableProcessedTableManager
    = ProcessedTableManager<
        _$AppDatabase,
        $LocalRestaurantKotLinesTable,
        LocalRestaurantKotLine,
        $$LocalRestaurantKotLinesTableFilterComposer,
        $$LocalRestaurantKotLinesTableOrderingComposer,
        $$LocalRestaurantKotLinesTableAnnotationComposer,
        $$LocalRestaurantKotLinesTableCreateCompanionBuilder,
        $$LocalRestaurantKotLinesTableUpdateCompanionBuilder,
        (
          LocalRestaurantKotLine,
          BaseReferences<_$AppDatabase, $LocalRestaurantKotLinesTable,
              LocalRestaurantKotLine>
        ),
        LocalRestaurantKotLine,
        PrefetchHooks Function()>;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$LocalProductsTableTableManager get localProducts =>
      $$LocalProductsTableTableManager(_db, _db.localProducts);
  $$LocalCustomersTableTableManager get localCustomers =>
      $$LocalCustomersTableTableManager(_db, _db.localCustomers);
  $$LocalInvoicesTableTableManager get localInvoices =>
      $$LocalInvoicesTableTableManager(_db, _db.localInvoices);
  $$LocalInvoiceLinesTableTableManager get localInvoiceLines =>
      $$LocalInvoiceLinesTableTableManager(_db, _db.localInvoiceLines);
  $$LocalPaymentsTableTableManager get localPayments =>
      $$LocalPaymentsTableTableManager(_db, _db.localPayments);
  $$LocalStockMovementsTableTableManager get localStockMovements =>
      $$LocalStockMovementsTableTableManager(_db, _db.localStockMovements);
  $$SyncOutboxTableTableManager get syncOutbox =>
      $$SyncOutboxTableTableManager(_db, _db.syncOutbox);
  $$LocalRestaurantTablesTableTableManager get localRestaurantTables =>
      $$LocalRestaurantTablesTableTableManager(_db, _db.localRestaurantTables);
  $$LocalRestaurantOrdersTableTableManager get localRestaurantOrders =>
      $$LocalRestaurantOrdersTableTableManager(_db, _db.localRestaurantOrders);
  $$LocalRestaurantKotLinesTableTableManager get localRestaurantKotLines =>
      $$LocalRestaurantKotLinesTableTableManager(
          _db, _db.localRestaurantKotLines);
}
