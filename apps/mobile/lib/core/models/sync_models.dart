class SyncOperationAckResult {
  final String operationId;
  final String status; // 'accepted', 'already_processed', 'rejected'
  final String? serverEntityId;
  final String? errorCode;
  final String? errorMessage;

  const SyncOperationAckResult({
    required this.operationId,
    required this.status,
    this.serverEntityId,
    this.errorCode,
    this.errorMessage,
  });

  factory SyncOperationAckResult.fromJson(Map<String, dynamic> json) {
    return SyncOperationAckResult(
      operationId: json['operationId'] as String? ?? '',
      status: json['status'] as String? ?? 'rejected',
      serverEntityId: json['serverEntityId'] as String?,
      errorCode: json['errorCode'] as String?,
      errorMessage: json['errorMessage'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'operationId': operationId,
      'status': status,
      if (serverEntityId != null) 'serverEntityId': serverEntityId,
      if (errorCode != null) 'errorCode': errorCode,
      if (errorMessage != null) 'errorMessage': errorMessage,
    };
  }
}

class SyncPushResult {
  final List<SyncOperationAckResult> results;
  final int processedCount;

  const SyncPushResult({
    required this.results,
    required this.processedCount,
  });

  factory SyncPushResult.fromJson(Map<String, dynamic> json) {
    final rawResults = json['results'] as List<dynamic>? ?? [];
    final results = rawResults
        .map((r) => SyncOperationAckResult.fromJson(r as Map<String, dynamic>))
        .toList();

    return SyncPushResult(
      results: results,
      processedCount: json['processedCount'] as int? ?? results.length,
    );
  }
}

class SyncPullDeltaResult {
  final String cursor;
  final bool hasMore;
  final List<Map<String, dynamic>> categories;
  final List<Map<String, dynamic>> products;
  final List<Map<String, dynamic>> customers;
  final List<Map<String, dynamic>> invoices;

  const SyncPullDeltaResult({
    required this.cursor,
    required this.hasMore,
    required this.categories,
    required this.products,
    this.customers = const [],
    this.invoices = const [],
  });

  factory SyncPullDeltaResult.fromJson(Map<String, dynamic> json) {
    final rawCats = json['categories'] as List<dynamic>? ?? [];
    final rawProds = json['products'] as List<dynamic>? ?? [];
    final rawCusts = json['customers'] as List<dynamic>? ?? [];
    final rawInvs = json['invoices'] as List<dynamic>? ?? [];

    return SyncPullDeltaResult(
      cursor: json['cursor'] as String? ?? '',
      hasMore: json['hasMore'] as bool? ?? false,
      categories: rawCats.map((c) => Map<String, dynamic>.from(c as Map)).toList(),
      products: rawProds.map((p) => Map<String, dynamic>.from(p as Map)).toList(),
      customers: rawCusts.map((c) => Map<String, dynamic>.from(c as Map)).toList(),
      invoices: rawInvs.map((i) => Map<String, dynamic>.from(i as Map)).toList(),
    );
  }
}

class SyncCycleResult {
  final int pushedCount;
  final int pulledProductsCount;
  final int pulledCategoriesCount;
  final int pulledCustomersCount;
  final String newCursor;
  final bool isSuccess;
  final String? error;

  const SyncCycleResult({
    required this.pushedCount,
    required this.pulledProductsCount,
    required this.pulledCategoriesCount,
    this.pulledCustomersCount = 0,
    required this.newCursor,
    required this.isSuccess,
    this.error,
  });
}

