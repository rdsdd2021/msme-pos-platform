import 'package:flutter/material.dart';
import '../theme/shadcn_colors.dart';

/// Authentic Shadcn UI Card component.
/// Clean 1px border (#E4E4E7), 12px border radius, subtle elevation.
class ShadcnCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final Color? borderColor;
  final double borderRadius;
  final bool hasShadow;

  const ShadcnCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.backgroundColor,
    this.borderColor,
    this.borderRadius = 12.0,
    this.hasShadow = true,
  });

  @override
  Widget build(BuildContext context) {
    final cardContent = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor ?? ShadcnColors.card,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: borderColor ?? ShadcnColors.border,
          width: 1.0,
        ),
        boxShadow: hasShadow
            ? [
                const BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 4,
                  offset: Offset(0, 1),
                ),
              ]
            : null,
      ),
      child: child,
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(borderRadius),
          splashColor: ShadcnColors.primary.withOpacity(0.08),
          highlightColor: ShadcnColors.primary.withOpacity(0.04),
          child: cardContent,
        ),
      );
    }

    return cardContent;
  }
}

