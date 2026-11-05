import 'package:flutter/material.dart';
import 'shadcn_colors.dart';

/// Typography scale aligned with Shadcn UI standards.
/// Crisp, modern sans-serif with strict line heights and tracking.
class ShadcnTypography {
  ShadcnTypography._();

  static const TextStyle h1 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.6,
    color: ShadcnColors.foreground,
    height: 1.25,
  );

  static const TextStyle h2 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.4,
    color: ShadcnColors.foreground,
    height: 1.3,
  );

  static const TextStyle h3 = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.2,
    color: ShadcnColors.foreground,
    height: 1.35,
  );

  static const TextStyle body = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.1,
    color: ShadcnColors.foreground,
    height: 1.45,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: -0.1,
    color: ShadcnColors.foreground,
    height: 1.45,
  );

  static const TextStyle bodySemibold = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.1,
    color: ShadcnColors.foreground,
    height: 1.45,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
    color: ShadcnColors.mutedForeground,
    height: 1.4,
  );

  static const TextStyle code = TextStyle(
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.2,
    color: ShadcnColors.foreground,
  );

  static const TextStyle currency = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.3,
    color: ShadcnColors.foreground,
  );

  static const TextStyle currencyLarge = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
    color: ShadcnColors.foreground,
  );
}

