import 'package:flutter/material.dart';
import '../theme/shadcn_colors.dart';
import '../theme/shadcn_typography.dart';

enum ShadcnBadgeVariant {
  defaultVariant, // Solid primary
  secondary, // Light zinc
  outline, // 1px border
  success, // Emerald light with emerald text
  warning, // Amber light with amber text
  destructive, // Red light with red text
}

/// Authentic Shadcn UI Badge component.
class ShadcnBadge extends StatelessWidget {
  final String text;
  final ShadcnBadgeVariant variant;
  final Widget? icon;

  const ShadcnBadge({
    super.key,
    required this.text,
    this.variant = ShadcnBadgeVariant.secondary,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color fgColor;
    Border? border;

    switch (variant) {
      case ShadcnBadgeVariant.defaultVariant:
        bgColor = ShadcnColors.primary;
        fgColor = ShadcnColors.primaryForeground;
        border = null;
        break;
      case ShadcnBadgeVariant.secondary:
        bgColor = ShadcnColors.secondary;
        fgColor = ShadcnColors.secondaryForeground;
        border = null;
        break;
      case ShadcnBadgeVariant.outline:
        bgColor = Colors.transparent;
        fgColor = ShadcnColors.foreground;
        border = Border.all(color: ShadcnColors.border, width: 1.0);
        break;
      case ShadcnBadgeVariant.success:
        bgColor = ShadcnColors.successLight;
        fgColor = ShadcnColors.successForeground;
        border = Border.all(color: ShadcnColors.success.withOpacity(0.3), width: 1.0);
        break;
      case ShadcnBadgeVariant.warning:
        bgColor = ShadcnColors.warningLight;
        fgColor = ShadcnColors.warningForeground;
        border = Border.all(color: ShadcnColors.warning.withOpacity(0.3), width: 1.0);
        break;
      case ShadcnBadgeVariant.destructive:
        bgColor = ShadcnColors.destructiveLight;
        fgColor = ShadcnColors.destructive;
        border = Border.all(color: ShadcnColors.destructive.withOpacity(0.3), width: 1.0);
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6.0),
        border: border,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (icon != null) ...[
            icon!,
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: ShadcnTypography.caption.copyWith(
              color: fgColor,
              fontWeight: FontWeight.w600,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

