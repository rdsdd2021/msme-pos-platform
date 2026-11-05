import 'package:flutter/material.dart';
import '../theme/shadcn_colors.dart';
import '../theme/shadcn_typography.dart';

enum ShadcnButtonVariant {
  primary, // Emerald solid for billing & primary CTAs
  secondary, // Light zinc background
  outline, // 1px border with transparent background
  ghost, // Minimal text button
  destructive, // Red solid for delete/cancel actions
}

enum ShadcnButtonSize {
  sm, // 34px height
  md, // 42px height
  lg, // 48px height (touch-optimized for POS counters)
}

/// Authentic Shadcn UI Button component.
class ShadcnButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final ShadcnButtonVariant variant;
  final ShadcnButtonSize size;
  final Widget? leadingIcon;
  final Widget? trailingIcon;
  final bool isLoading;
  final bool isFullWidth;

  const ShadcnButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.variant = ShadcnButtonVariant.primary,
    this.size = ShadcnButtonSize.md,
    this.leadingIcon,
    this.trailingIcon,
    this.isLoading = false,
    this.isFullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color fgColor;
    Border? border;

    switch (variant) {
      case ShadcnButtonVariant.primary:
        bgColor = ShadcnColors.primary;
        fgColor = ShadcnColors.primaryForeground;
        border = null;
        break;
      case ShadcnButtonVariant.secondary:
        bgColor = ShadcnColors.secondary;
        fgColor = ShadcnColors.secondaryForeground;
        border = null;
        break;
      case ShadcnButtonVariant.outline:
        bgColor = Colors.transparent;
        fgColor = ShadcnColors.foreground;
        border = Border.all(color: ShadcnColors.border, width: 1.0);
        break;
      case ShadcnButtonVariant.ghost:
        bgColor = Colors.transparent;
        fgColor = ShadcnColors.foreground;
        border = null;
        break;
      case ShadcnButtonVariant.destructive:
        bgColor = ShadcnColors.destructive;
        fgColor = ShadcnColors.destructiveForeground;
        border = null;
        break;
    }

    double height;
    EdgeInsets padding;
    TextStyle textStyle;

    switch (size) {
      case ShadcnButtonSize.sm:
        height = 34.0;
        padding = const EdgeInsets.symmetric(horizontal: 12);
        textStyle = ShadcnTypography.caption.copyWith(fontWeight: FontWeight.w600, color: fgColor);
        break;
      case ShadcnButtonSize.md:
        height = 42.0;
        padding = const EdgeInsets.symmetric(horizontal: 16);
        textStyle = ShadcnTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: fgColor);
        break;
      case ShadcnButtonSize.lg:
        height = 48.0;
        padding = const EdgeInsets.symmetric(horizontal: 20);
        textStyle = ShadcnTypography.bodySemibold.copyWith(fontSize: 15, color: fgColor);
        break;
    }

    final content = Row(
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading) ...[
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(fgColor),
            ),
          ),
          const SizedBox(width: 8),
        ] else if (leadingIcon != null) ...[
          leadingIcon!,
          const SizedBox(width: 6),
        ],
        Flexible(
          child: Text(
            text,
            style: textStyle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (trailingIcon != null && !isLoading) ...[
          const SizedBox(width: 6),
          trailingIcon!,
        ],
      ],
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: isLoading ? null : onPressed,
        borderRadius: BorderRadius.circular(8.0),
        child: Container(
          height: height,
          padding: padding,
          decoration: BoxDecoration(
            color: onPressed == null ? bgColor.withOpacity(0.5) : bgColor,
            borderRadius: BorderRadius.circular(8.0),
            border: border,
          ),
          child: content,
        ),
      ),
    );
  }
}

