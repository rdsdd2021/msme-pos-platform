import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/offline_billing_service.dart';

class TodayMetrics {
  final int billCount;
  final int grossSalesPaisa;
  final int cashPaisa;
  final int upiPaisa;
  final int khataPaisa;
  final int totalKhataDuePaisa;
  final int lowStockCount;

  const TodayMetrics({
    this.billCount = 0,
    this.grossSalesPaisa = 0,
    this.cashPaisa = 0,
    this.upiPaisa = 0,
    this.khataPaisa = 0,
    this.totalKhataDuePaisa = 0,
    this.lowStockCount = 0,
  });

  double get grossSalesRupees => grossSalesPaisa / 100.0;
  double get cashRupees => cashPaisa / 100.0;
  double get upiRupees => upiPaisa / 100.0;
  double get khataRupees => khataPaisa / 100.0;
  double get totalKhataDueRupees => totalKhataDuePaisa / 100.0;
}

final todayMetricsProvider = FutureProvider.autoDispose<TodayMetrics>((ref) async {
  final data = await OfflineBillingService.repository.getTodayMetrics();
  return TodayMetrics(
    billCount: data['billCount'] as int? ?? 0,
    grossSalesPaisa: data['grossSalesPaisa'] as int? ?? 0,
    cashPaisa: data['cashPaisa'] as int? ?? 0,
    upiPaisa: data['upiPaisa'] as int? ?? 0,
    khataPaisa: data['khataPaisa'] as int? ?? 0,
    totalKhataDuePaisa: data['totalKhataDuePaisa'] as int? ?? 0,
    lowStockCount: data['lowStockCount'] as int? ?? 0,
  );
});

