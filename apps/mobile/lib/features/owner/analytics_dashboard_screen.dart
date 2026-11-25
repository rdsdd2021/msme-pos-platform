import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/analytics_provider.dart';
import '../../core/theme/shadcn_colors.dart';
import '../../core/theme/shadcn_typography.dart';
import '../../core/widgets/shadcn_card.dart';

class AnalyticsDashboardScreen extends ConsumerStatefulWidget {
  const AnalyticsDashboardScreen({super.key});

  @override
  ConsumerState<AnalyticsDashboardScreen> createState() => _AnalyticsDashboardScreenState();
}

class _AnalyticsDashboardScreenState extends ConsumerState<AnalyticsDashboardScreen> {
  String _period = 'day'; // 'day', 'week', 'month'
  int _detailTab = 0; // 0 = Products, 1 = Categories, 2 = Tables, 3 = Payments

  static const List<Color> _chartPalette = [
    Color(0xFF10B981),
    Color(0xFF3B82F6),
    Color(0xFFF59E0B),
    Color(0xFF8B5CF6),
    Color(0xFFEC4899),
    Color(0xFF06B6D4),
    Color(0xFFF97316),
    Color(0xFF64748B),
  ];

  String _formatInr(dynamic val) {
    final numVal = val is num ? val.toDouble() : (double.tryParse(val?.toString() ?? '0') ?? 0.0);
    return '₹${numVal.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context) {
    final analyticsAsync = ref.watch(businessAnalyticsProvider(_period));

    return Scaffold(
      backgroundColor: ShadcnColors.background,
      appBar: AppBar(
        title: const Text('Sales & Visual Analytics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh Analytics',
            onPressed: () => ref.invalidate(businessAnalyticsProvider(_period)),
          ),
        ],
      ),
      body: Column(
        children: [
          // Period Selector (Day / Week / Month)
          Container(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
            decoration: const BoxDecoration(
              color: ShadcnColors.surface,
              border: Border(bottom: BorderSide(color: ShadcnColors.border)),
            ),
            child: Row(
              children: [
                _buildPeriodChip('day', 'Today (Day)'),
                const SizedBox(width: 8),
                _buildPeriodChip('week', 'Week (7D)'),
                const SizedBox(width: 8),
                _buildPeriodChip('month', 'Month (30D)'),
              ],
            ),
          ),

          Expanded(
            child: analyticsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text('Failed to load analytics: $err', textAlign: TextAlign.center),
                ),
              ),
              data: (data) {
                if (data == null) {
                  return const Center(
                    child: Text('Connect to store session to view cloud analytics.'),
                  );
                }

                final summary = Map<String, dynamic>.from(data['summary'] as Map? ?? {});
                final salesTrend = (data['salesTrend'] as List? ?? [])
                    .whereType<Map>()
                    .map((e) => Map<String, dynamic>.from(e))
                    .toList();
                final byProduct = (data['byProduct'] as List? ?? [])
                    .whereType<Map>()
                    .map((e) => Map<String, dynamic>.from(e))
                    .toList();
                final byCategory = (data['byCategory'] as List? ?? [])
                    .whereType<Map>()
                    .map((e) => Map<String, dynamic>.from(e))
                    .toList();
                final byTable = (data['byTable'] as List? ?? [])
                    .whereType<Map>()
                    .map((e) => Map<String, dynamic>.from(e))
                    .toList();
                final byPayment = (data['byPaymentMethod'] as List? ?? [])
                    .whereType<Map>()
                    .map((e) => Map<String, dynamic>.from(e))
                    .toList();
                final peakHours = (data['peakHours'] as List? ?? [])
                    .whereType<Map>()
                    .map((e) => Map<String, dynamic>.from(e))
                    .toList();

                final growth = (summary['growthPercent'] as num?)?.toDouble() ?? 0.0;

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(businessAnalyticsProvider(_period));
                  },
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 40),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 1. 2x2 KPI Cards
                        Row(
                          children: [
                            Expanded(
                              child: _buildKpiCard(
                                'Gross Revenue',
                                _formatInr(summary['totalSales']),
                                '${growth >= 0 ? '+' : ''}${growth.toStringAsFixed(1)}% vs prev $_period',
                                growth >= 0 ? const Color(0xFF10B981) : ShadcnColors.destructive,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _buildKpiCard(
                                'Bills & Avg Ticket',
                                '${summary['invoiceCount'] ?? 0} bills',
                                'Avg ${_formatInr(summary['averageOrderValue'])}',
                                const Color(0xFF3B82F6),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: _buildKpiCard(
                                'Items Sold',
                                '${summary['totalItemsSold'] ?? 0}',
                                '${byCategory.length} categories',
                                const Color(0xFFF59E0B),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _buildKpiCard(
                                'Tax & Discounts',
                                _formatInr(summary['totalTax']),
                                'Disc: ${_formatInr(summary['totalDiscount'])}',
                                const Color(0xFF8B5CF6),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // 2. Revenue Trend Chart
                        ShadcnCard(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Revenue Trend (${_period == 'day' ? 'Hourly' : _period == 'week' ? '7 Days' : '30 Days'})',
                                style: ShadcnTypography.bodySemibold,
                              ),
                              const SizedBox(height: 4),
                              Text('Sales curve across selected timeframe', style: ShadcnTypography.caption),
                              const SizedBox(height: 12),
                              if (salesTrend.isEmpty)
                                const Padding(
                                  padding: EdgeInsets.symmetric(vertical: 28),
                                  child: Center(child: Text('No sales recorded yet', style: ShadcnTypography.caption)),
                                )
                              else
                                SizedBox(
                                  height: 170,
                                  width: double.infinity,
                                  child: CustomPaint(
                                    painter: _RevenueTrendPainter(points: salesTrend),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),

                        // 3. Category Split Donut Chart
                        ShadcnCard(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Category Revenue Share', style: ShadcnTypography.bodySemibold),
                              const SizedBox(height: 12),
                              if (byCategory.isEmpty)
                                const Padding(
                                  padding: EdgeInsets.symmetric(vertical: 20),
                                  child: Center(child: Text('No category sales yet', style: ShadcnTypography.caption)),
                                )
                              else
                                Row(
                                  children: [
                                    SizedBox(
                                      width: 110,
                                      height: 110,
                                      child: CustomPaint(
                                        painter: _DonutChartPainter(
                                          values: byCategory
                                              .take(6)
                                              .map((c) => (c['revenue'] as num?)?.toDouble() ?? 0.0)
                                              .toList(),
                                          colors: _chartPalette,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        children: byCategory.take(6).toList().asMap().entries.map((entry) {
                                          final idx = entry.key;
                                          final cat = entry.value;
                                          return Padding(
                                            padding: const EdgeInsets.symmetric(vertical: 3),
                                            child: Row(
                                              children: [
                                                Container(
                                                  width: 9,
                                                  height: 9,
                                                  decoration: BoxDecoration(
                                                    color: _chartPalette[idx % _chartPalette.length],
                                                    shape: BoxShape.circle,
                                                  ),
                                                ),
                                                const SizedBox(width: 6),
                                                Expanded(
                                                  child: Text(
                                                    cat['categoryName']?.toString() ?? 'Other',
                                                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600),
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                Text(
                                                  '${cat['sharePercent'] ?? 0}%',
                                                  style: ShadcnTypography.caption,
                                                ),
                                              ],
                                            ),
                                          );
                                        }).toList(),
                                      ),
                                    ),
                                  ],
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),

                        // 4. Peak Hours Histogram
                        ShadcnCard(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Peak Business Hours', style: ShadcnTypography.bodySemibold),
                              const SizedBox(height: 4),
                              Text('Order volume by hour of day', style: ShadcnTypography.caption),
                              const SizedBox(height: 12),
                              SizedBox(
                                height: 110,
                                width: double.infinity,
                                child: CustomPaint(
                                  painter: _PeakHoursPainter(hours: peakHours),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // 5. Segmented Detail Tabs (Products / Categories / Tables / Payments)
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              _buildDetailTab(0, 'Products (${byProduct.length})'),
                              const SizedBox(width: 8),
                              _buildDetailTab(1, 'Categories (${byCategory.length})'),
                              const SizedBox(width: 8),
                              _buildDetailTab(2, 'Tables (${byTable.length})'),
                              const SizedBox(width: 8),
                              _buildDetailTab(3, 'Payments (${byPayment.length})'),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),

                        ShadcnCard(
                          padding: const EdgeInsets.all(12),
                          child: _buildDetailBody(byProduct, byCategory, byTable, byPayment),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodChip(String id, String label) {
    final selected = _period == id;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _period = id),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: selected ? ShadcnColors.foreground : ShadcnColors.background,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: selected ? ShadcnColors.foreground : ShadcnColors.border),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: selected ? Colors.white : ShadcnColors.foreground,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailTab(int index, String label) {
    final selected = _detailTab == index;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: selected ? Colors.white : ShadcnColors.foreground,
        ),
      ),
      selected: selected,
      selectedColor: ShadcnColors.primary,
      backgroundColor: ShadcnColors.card,
      onSelected: (_) => setState(() => _detailTab = index),
    );
  }

  Widget _buildKpiCard(String title, String value, String subtitle, Color accent) {
    return ShadcnCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(value, style: ShadcnTypography.currencyLarge.copyWith(color: accent, fontSize: 17)),
          const SizedBox(height: 2),
          Text(subtitle, style: ShadcnTypography.caption.copyWith(fontSize: 10.5)),
        ],
      ),
    );
  }

  Widget _buildDetailBody(
    List<Map<String, dynamic>> byProduct,
    List<Map<String, dynamic>> byCategory,
    List<Map<String, dynamic>> byTable,
    List<Map<String, dynamic>> byPayment,
  ) {
    if (_detailTab == 0) {
      if (byProduct.isEmpty) {
        return const Padding(
          padding: EdgeInsets.all(20),
          child: Center(child: Text('No product sales in this period', style: ShadcnTypography.caption)),
        );
      }
      return Column(
        children: byProduct.asMap().entries.map((entry) {
          final idx = entry.key;
          final p = entry.value;
          final share = ((p['sharePercent'] as num?)?.toDouble() ?? 0.0).clamp(0.0, 100.0);
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('${idx + 1}. ', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    Expanded(
                      child: Text(
                        '${p['name']} (${p['categoryName']})',
                        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      '${p['quantitySold']} qty  •  ${_formatInr(p['revenue'])}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                LinearProgressIndicator(
                  value: share / 100.0,
                  minHeight: 5,
                  backgroundColor: ShadcnColors.border,
                  color: const Color(0xFF10B981),
                  borderRadius: BorderRadius.circular(4),
                ),
              ],
            ),
          );
        }).toList(),
      );
    }

    if (_detailTab == 1) {
      if (byCategory.isEmpty) {
        return const Padding(
          padding: EdgeInsets.all(20),
          child: Center(child: Text('No category sales in this period', style: ShadcnTypography.caption)),
        );
      }
      return Column(
        children: byCategory.asMap().entries.map((entry) {
          final idx = entry.key;
          final c = entry.value;
          return ListTile(
            dense: true,
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(
              radius: 8,
              backgroundColor: _chartPalette[idx % _chartPalette.length],
            ),
            title: Text(c['categoryName']?.toString() ?? 'Other', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            subtitle: Text('${c['itemCount']} items • ${c['quantitySold']} qty', style: ShadcnTypography.caption),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(_formatInr(c['revenue']), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                Text('${c['sharePercent']}%', style: ShadcnTypography.caption),
              ],
            ),
          );
        }).toList(),
      );
    }

    if (_detailTab == 2) {
      if (byTable.isEmpty) {
        return const Padding(
          padding: EdgeInsets.all(20),
          child: Center(child: Text('No completed dine-in table orders in this period', style: ShadcnTypography.caption)),
        );
      }
      return Column(
        children: byTable.map((t) {
          return ListTile(
            dense: true,
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.table_restaurant, size: 20, color: ShadcnColors.primary),
            title: Text('${t['tableNumber']} (${t['section']})', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            subtitle: Text('${t['orderCount']} orders • ${t['guestCount']} guests', style: ShadcnTypography.caption),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(_formatInr(t['revenue']), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                Text('Avg ${_formatInr(t['avgBill'])}', style: ShadcnTypography.caption),
              ],
            ),
          );
        }).toList(),
      );
    }

    // Payments
    if (byPayment.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(20),
        child: Center(child: Text('No payment records in this period', style: ShadcnTypography.caption)),
      );
    }
    return Column(
      children: byPayment.map((p) {
        return ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.payments_outlined, size: 20, color: Color(0xFF3B82F6)),
          title: Text((p['method']?.toString() ?? 'cash').toUpperCase(), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
          subtitle: Text('${p['count']} transactions', style: ShadcnTypography.caption),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(_formatInr(p['amount']), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              Text('${p['sharePercent']}%', style: ShadcnTypography.caption),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _RevenueTrendPainter extends CustomPainter {
  final List<Map<String, dynamic>> points;
  _RevenueTrendPainter({required this.points});

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;

    const double padLeft = 36;
    const double padRight = 10;
    const double padTop = 12;
    const double padBottom = 22;
    final chartW = size.width - padLeft - padRight;
    final chartH = size.height - padTop - padBottom;

    double maxRev = 1;
    for (final p in points) {
      final rev = (p['revenue'] as num?)?.toDouble() ?? 0.0;
      if (rev > maxRev) maxRev = rev;
    }

    final gridPaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 1;
    final textPainter = TextPainter(textDirection: TextDirection.ltr);

    for (int i = 0; i <= 2; i++) {
      final frac = i / 2.0;
      final y = padTop + chartH - frac * chartH;
      canvas.drawLine(Offset(padLeft, y), Offset(size.width - padRight, y), gridPaint);
      final labelVal = (frac * maxRev).round();
      textPainter.text = TextSpan(
        text: labelVal >= 1000 ? '${(labelVal / 1000).toStringAsFixed(1)}k' : '$labelVal',
        style: const TextStyle(fontSize: 9, color: Color(0xFF94A3B8)),
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(0, y - textPainter.height / 2));
    }

    final offsets = <Offset>[];
    for (int i = 0; i < points.length; i++) {
      final x = points.length <= 1 ? padLeft + chartW / 2 : padLeft + (i / (points.length - 1)) * chartW;
      final rev = (points[i]['revenue'] as num?)?.toDouble() ?? 0.0;
      final y = padTop + chartH - (rev / maxRev) * chartH;
      offsets.add(Offset(x, y));
    }

    if (offsets.isNotEmpty) {
      final areaPath = Path()..moveTo(offsets.first.dx, padTop + chartH);
      for (final o in offsets) {
        areaPath.lineTo(o.dx, o.dy);
      }
      areaPath.lineTo(offsets.last.dx, padTop + chartH);
      areaPath.close();

      final areaPaint = Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0x5510B981), Color(0x0510B981)],
        ).createShader(Rect.fromLTWH(padLeft, padTop, chartW, chartH));
      canvas.drawPath(areaPath, areaPaint);

      final linePath = Path()..moveTo(offsets.first.dx, offsets.first.dy);
      for (int i = 1; i < offsets.length; i++) {
        linePath.lineTo(offsets[i].dx, offsets[i].dy);
      }
      final linePaint = Paint()
        ..color = const Color(0xFF10B981)
        ..strokeWidth = 2.4
        ..style = PaintingStyle.stroke;
      canvas.drawPath(linePath, linePaint);

      final dotPaint = Paint()..color = const Color(0xFF059669);
      for (int i = 0; i < offsets.length; i++) {
        canvas.drawCircle(offsets[i], 3, dotPaint);
        final showLabel = points.length <= 8 || i == 0 || i == points.length - 1 || i % (points.length ~/ 5) == 0;
        if (showLabel) {
          textPainter.text = TextSpan(
            text: points[i]['label']?.toString() ?? '',
            style: const TextStyle(fontSize: 9, color: Color(0xFF64748B)),
          );
          textPainter.layout();
          textPainter.paint(canvas, Offset(offsets[i].dx - textPainter.width / 2, padTop + chartH + 5));
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant _RevenueTrendPainter oldDelegate) => oldDelegate.points != points;
}

class _DonutChartPainter extends CustomPainter {
  final List<double> values;
  final List<Color> colors;
  _DonutChartPainter({required this.values, required this.colors});

  @override
  void paint(Canvas canvas, Size size) {
    final total = values.fold<double>(0.0, (s, v) => s + v);
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2 - 10;
    final rect = Rect.fromCircle(center: center, radius: radius);

    if (total <= 0) {
      final emptyPaint = Paint()
        ..color = const Color(0xFFE2E8F0)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 14;
      canvas.drawCircle(center, radius, emptyPaint);
      return;
    }

    double startAngle = -math.pi / 2;
    for (int i = 0; i < values.length; i++) {
      final sweep = (values[i] / total) * 2 * math.pi;
      final paint = Paint()
        ..color = colors[i % colors.length]
        ..style = PaintingStyle.stroke
        ..strokeWidth = 14
        ..strokeCap = StrokeCap.butt;
      canvas.drawArc(rect, startAngle, sweep, false, paint);
      startAngle += sweep;
    }
  }

  @override
  bool shouldRepaint(covariant _DonutChartPainter oldDelegate) => oldDelegate.values != values;
}

class _PeakHoursPainter extends CustomPainter {
  final List<Map<String, dynamic>> hours;
  _PeakHoursPainter({required this.hours});

  @override
  void paint(Canvas canvas, Size size) {
    if (hours.isEmpty) return;
    const double padBottom = 18;
    final chartH = size.height - padBottom;
    final barW = (size.width / hours.length) * 0.62;
    final stepW = size.width / hours.length;

    int maxOrders = 1;
    for (final h in hours) {
      final o = (h['orders'] as num?)?.toInt() ?? 0;
      if (o > maxOrders) maxOrders = o;
    }

    final textPainter = TextPainter(textDirection: TextDirection.ltr);
    for (int i = 0; i < hours.length; i++) {
      final orders = (hours[i]['orders'] as num?)?.toInt() ?? 0;
      final hFrac = orders > 0 ? math.max(orders / maxOrders, 0.1) : 0.04;
      final barH = hFrac * (chartH - 8);
      final left = i * stepW + (stepW - barW) / 2;
      final top = chartH - barH;

      final paint = Paint()
        ..color = orders == maxOrders && orders > 0
            ? const Color(0xFFF59E0B)
            : orders > 0
                ? const Color(0xFF3B82F6)
                : const Color(0xFFE2E8F0);
      canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTWH(left, top, barW, barH), const Radius.circular(3)),
        paint,
      );

      final hr = (hours[i]['hour'] as num?)?.toInt() ?? 0;
      if (hr % 3 == 0) {
        textPainter.text = TextSpan(
          text: hours[i]['label']?.toString() ?? '',
          style: const TextStyle(fontSize: 8.5, color: Color(0xFF64748B)),
        );
        textPainter.layout();
        textPainter.paint(canvas, Offset(left + barW / 2 - textPainter.width / 2, chartH + 4));
      }
    }
  }

  @override
  bool shouldRepaint(covariant _PeakHoursPainter oldDelegate) => oldDelegate.hours != hours;
}
