import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/main.dart';

void main() {
  group('PosApp', () {
    testWidgets('renders POS Platform title', (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: PosApp(),
        ),
      );

      expect(find.text('POS Platform'), findsOneWidget);
    });

    testWidgets('renders initialising message', (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: PosApp(),
        ),
      );

      expect(find.text('Development environment initialised'), findsOneWidget);
    });

    testWidgets('renders point_of_sale icon', (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: PosApp(),
        ),
      );

      expect(find.byIcon(Icons.point_of_sale), findsOneWidget);
    });
  });
}
