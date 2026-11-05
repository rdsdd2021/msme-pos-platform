import 'package:flutter/material.dart';

/// Authentic Shadcn UI Slate/Zinc Color System for Flutter.
/// Designed for high-contrast, clean enterprise POS and business dashboards.
class ShadcnColors {
  ShadcnColors._();

  // Core Slate/Zinc Neutral Palette
  static const Color background = Color(0xFFFAFAFA); // Clean canvas
  static const Color surface = Color(0xFFFFFFFF); // Card & Sheet surface
  static const Color foreground = Color(0xFF09090B); // High contrast text
  static const Color card = Color(0xFFFFFFFF);
  static const Color cardForeground = Color(0xFF09090B);

  // Border & Dividers
  static const Color border = Color(0xFFE4E4E7); // 1px subtle boundary
  static const Color input = Color(0xFFE4E4E7);
  static const Color ring = Color(0xFF059669); // Focus ring (Emerald)

  // Primary Accent: High-trust Emerald for POS & commerce
  static const Color primary = Color(0xFF059669); // Emerald 600
  static const Color primaryHover = Color(0xFF047857); // Emerald 700
  static const Color primaryLight = Color(0xFFD1FAE5); // Emerald 100
  static const Color primaryForeground = Color(0xFFFFFFFF);

  // Secondary Accent: Subtle Zinc
  static const Color secondary = Color(0xFFF4F4F5); // Zinc 100
  static const Color secondaryHover = Color(0xFFE4E4E7); // Zinc 200
  static const Color secondaryForeground = Color(0xFF18181B); // Zinc 900

  // Muted Text & Backgrounds
  static const Color muted = Color(0xFFF4F4F5);
  static const Color mutedForeground = Color(0xFF71717A); // Zinc 500

  // Accent & Interactive Highlights
  static const Color accent = Color(0xFFF4F4F5);
  static const Color accentForeground = Color(0xFF09090B);

  // Semantic Status Colors
  static const Color destructive = Color(0xFFEF4444); // Red 500
  static const Color destructiveLight = Color(0xFFFEE2E2); // Red 100
  static const Color destructiveForeground = Color(0xFFFFFFFF);

  static const Color warning = Color(0xFFF59E0B); // Amber 500
  static const Color warningLight = Color(0xFFFEF3C7); // Amber 100
  static const Color warningForeground = Color(0xFF92400E); // Amber 800

  static const Color success = Color(0xFF10B981); // Emerald 500
  static const Color successLight = Color(0xFFD1FAE5); // Emerald 100
  static const Color successForeground = Color(0xFF065F46); // Emerald 800

  static const Color info = Color(0xFF3B82F6); // Blue 500
  static const Color infoLight = Color(0xFFDBEAFE); // Blue 100

  // Top App Bar / Header Slate
  static const Color headerSlate = Color(0xFF0F172A); // Slate 900
}

