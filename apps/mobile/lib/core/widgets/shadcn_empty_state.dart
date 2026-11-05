import 'package:flutter/material.dart';
import '../theme/shadcn_colors.dart';
import '../theme/shadcn_typography.dart';
import 'shadcn_button.dart';

/// Clean Shadcn UI Empty State presentation widget.
class ShadcnEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final String? actionText;
  final VoidCallback? onActionPressed;

  const ShadcnEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    this.actionText,
    this.onActionPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: ShadcnColors.secondary,
                shape: BoxShape.circle,
                border: Border.all(color: ShadcnColors.border, width: 1.0),
              ),
              child: Icon(
                icon,
                size: 26,
                color: ShadcnColors.mutedForeground,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: ShadcnTypography.h3,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              description,
              style: ShadcnTypography.body.copyWith(
                color: ShadcnColors.mutedForeground,
              ),
              textAlign: TextAlign.center,
            ),
            if (actionText != null && onActionPressed != null) ...[
              const SizedBox(height: 20),
              ShadcnButton(
                text: actionText!,
                onPressed: onActionPressed,
                variant: ShadcnButtonVariant.outline,
                size: ShadcnButtonSize.sm,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

