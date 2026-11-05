import 'package:flutter/material.dart';
import '../theme/shadcn_colors.dart';
import '../theme/shadcn_typography.dart';

/// Authentic Shadcn UI Modal Bottom Sheet wrapper.
class ShadcnSheet extends StatelessWidget {
  final String title;
  final String? description;
  final Widget child;
  final Widget? footer;
  final VoidCallback? onClose;

  const ShadcnSheet({
    super.key,
    required this.title,
    this.description,
    required this.child,
    this.footer,
    this.onClose,
  });

  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    String? description,
    required Widget child,
    Widget? footer,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: ShadcnSheet(
            title: title,
            description: description,
            footer: footer,
            onClose: () => Navigator.pop(ctx),
            child: child,
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      decoration: const BoxDecoration(
        color: ShadcnColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        boxShadow: [
          BoxShadow(
            color: Color(0x1A000000),
            blurRadius: 16,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 8),
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: ShadcnColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: ShadcnTypography.h3),
                      if (description != null) ...[
                        const SizedBox(height: 2),
                        Text(description!, style: ShadcnTypography.caption),
                      ],
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: onClose ?? () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: ShadcnColors.secondary,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      Icons.close,
                      size: 18,
                      color: ShadcnColors.mutedForeground,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: ShadcnColors.border),

          // Scrollable Body
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: child,
            ),
          ),

          // Footer
          if (footer != null) ...[
            const Divider(height: 1, color: ShadcnColors.border),
            Padding(
              padding: const EdgeInsets.all(16),
              child: footer!,
            ),
          ],
        ],
      ),
    );
  }
}

