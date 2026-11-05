import 'package:flutter/material.dart';
import '../theme/shadcn_colors.dart';
import '../theme/shadcn_typography.dart';

/// Authentic Shadcn UI Input component.
/// Clean 1px border (#E4E4E7), 8px border radius, clear button, and label.
class ShadcnInput extends StatefulWidget {
  final TextEditingController? controller;
  final String? placeholder;
  final String? label;
  final String? errorText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onEditingComplete;
  final FocusNode? focusNode;
  final bool autofocus;
  final bool showClearButton;
  final Key? textFieldKey;

  const ShadcnInput({
    super.key,
    this.controller,
    this.placeholder,
    this.label,
    this.errorText,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.onChanged,
    this.onEditingComplete,
    this.focusNode,
    this.autofocus = false,
    this.showClearButton = false,
    this.textFieldKey,
  });

  @override
  State<ShadcnInput> createState() => _ShadcnInputState();
}

class _ShadcnInputState extends State<ShadcnInput> {
  late FocusNode _focusNode;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode = widget.focusNode ?? FocusNode();
    _focusNode.addListener(_handleFocusChange);
  }

  void _handleFocusChange() {
    if (mounted) {
      setState(() {
        _isFocused = _focusNode.hasFocus;
      });
    }
  }

  @override
  void dispose() {
    if (widget.focusNode == null) {
      _focusNode.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasError = widget.errorText != null && widget.errorText!.isNotEmpty;
    final borderColor = hasError
        ? ShadcnColors.destructive
        : _isFocused
            ? ShadcnColors.primary
            : ShadcnColors.border;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: ShadcnTypography.caption.copyWith(
              fontWeight: FontWeight.w600,
              color: ShadcnColors.foreground,
            ),
          ),
          const SizedBox(height: 6),
        ],
        Container(
          height: 44,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: ShadcnColors.surface,
            borderRadius: BorderRadius.circular(8.0),
            border: Border.all(
              color: borderColor,
              width: _isFocused || hasError ? 1.5 : 1.0,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              if (widget.prefixIcon != null) ...[
                widget.prefixIcon!,
                const SizedBox(width: 8),
              ],
              Expanded(
                child: TextField(
                  key: widget.textFieldKey,
                  controller: widget.controller,
                  focusNode: _focusNode,
                  autofocus: widget.autofocus,
                  obscureText: widget.obscureText,
                  keyboardType: widget.keyboardType,
                  onChanged: widget.onChanged,
                  onEditingComplete: widget.onEditingComplete,
                  style: ShadcnTypography.bodyMedium,
                  decoration: InputDecoration(
                    hintText: widget.placeholder,
                    hintStyle: ShadcnTypography.body.copyWith(
                      color: ShadcnColors.mutedForeground,
                    ),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
              if (widget.showClearButton &&
                  widget.controller != null &&
                  widget.controller!.text.isNotEmpty) ...[
                GestureDetector(
                  onTap: () {
                    widget.controller!.clear();
                    if (widget.onChanged != null) widget.onChanged!('');
                  },
                  child: const Icon(
                    Icons.cancel,
                    size: 16,
                    color: ShadcnColors.mutedForeground,
                  ),
                ),
              ] else if (widget.suffixIcon != null) ...[
                widget.suffixIcon!,
              ],
            ],
          ),
        ),
        if (hasError) ...[
          const SizedBox(height: 4),
          Text(
            widget.errorText!,
            style: ShadcnTypography.caption.copyWith(
              color: ShadcnColors.destructive,
              fontSize: 11,
            ),
          ),
        ],
      ],
    );
  }
}
