import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/shadcn_colors.dart';
import '../theme/shadcn_typography.dart';

/// Compact Shadcn UI Quantity Stepper component for POS items and cart.
class ShadcnQuantityStepper extends StatelessWidget {
  final int quantity;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;
  final double height;
  final bool isDestructiveOnZero;

  const ShadcnQuantityStepper({
    super.key,
    required this.quantity,
    required this.onIncrement,
    required this.onDecrement,
    this.height = 32.0,
    this.isDestructiveOnZero = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: ShadcnColors.surface,
        borderRadius: BorderRadius.circular(6.0),
        border: Border.all(color: ShadcnColors.border, width: 1.0),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          _buildButton(
            icon: quantity == 1 && isDestructiveOnZero
                ? Icons.delete_outline
                : Icons.remove,
            iconColor: quantity == 1 && isDestructiveOnZero
                ? ShadcnColors.destructive
                : ShadcnColors.foreground,
            onTap: () {
              HapticFeedback.selectionClick();
              onDecrement();
            },
          ),
          Container(
            constraints: const BoxConstraints(minWidth: 28),
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              '$quantity',
              style: ShadcnTypography.bodySemibold.copyWith(
                fontSize: 13,
                color: ShadcnColors.foreground,
              ),
            ),
          ),
          _buildButton(
            icon: Icons.add,
            iconColor: ShadcnColors.primary,
            onTap: () {
              HapticFeedback.selectionClick();
              onIncrement();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildButton({
    required IconData icon,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(5.0),
        child: Container(
          width: height,
          height: height,
          alignment: Alignment.center,
          child: Icon(icon, size: 16, color: iconColor),
        ),
      ),
    );
  }
}

