import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../theme/shadcn_colors.dart';
import '../theme/shadcn_typography.dart';
import 'internet_photo_search_dialog.dart';

/// Reusable Product Photo Picker widget supporting Camera capture, Gallery upload,
/// Internet web search, client-side compression, base64 data URL persistence, and deletion.
class ProductPhotoPicker extends StatefulWidget {
  final String? initialImageUrl;
  final String? initialSearchQuery;
  final ValueChanged<String?> onPhotoChanged;
  final bool isTestMode;

  const ProductPhotoPicker({
    super.key,
    this.initialImageUrl,
    this.initialSearchQuery,
    required this.onPhotoChanged,
    this.isTestMode = false,
  });

  @override
  State<ProductPhotoPicker> createState() => _ProductPhotoPickerState();
}

class _ProductPhotoPickerState extends State<ProductPhotoPicker> {
  String? _currentImageUrl;
  bool _isProcessing = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _currentImageUrl = widget.initialImageUrl;
  }

  @override
  void didUpdateWidget(covariant ProductPhotoPicker oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialImageUrl != oldWidget.initialImageUrl) {
      _currentImageUrl = widget.initialImageUrl;
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    if (widget.isTestMode) {
      // Test mode mock photo injection
      const mockBase64 =
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
      setState(() => _currentImageUrl = mockBase64);
      widget.onPhotoChanged(mockBase64);
      return;
    }

    try {
      setState(() => _isProcessing = true);
      final XFile? pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 480,
        maxHeight: 480,
        imageQuality: 82,
      );

      if (pickedFile != null) {
        final Uint8List bytes = await pickedFile.readAsBytes();
        final String base64Data = base64Encode(bytes);
        final String dataUrl = 'data:image/jpeg;base64,$base64Data';

        setState(() {
          _currentImageUrl = dataUrl;
          _isProcessing = false;
        });
        widget.onPhotoChanged(dataUrl);
      } else {
        setState(() => _isProcessing = false);
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error selecting photo: $e'),
            backgroundColor: ShadcnColors.destructive,
          ),
        );
      }
    }
  }

  Future<void> _searchFromInternet() async {
    final result = await InternetPhotoSearchSheet.show(
      context,
      initialQuery: widget.initialSearchQuery ?? '',
      isTestMode: widget.isTestMode,
    );

    if (result != null && result.isNotEmpty) {
      setState(() => _currentImageUrl = result);
      widget.onPhotoChanged(result);
    }
  }

  void _removePhoto() {
    setState(() => _currentImageUrl = null);
    widget.onPhotoChanged(null);
  }

  void _showSourceSelectionSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: ShadcnColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: ShadcnColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  children: [
                    Text('Select Product Photo', style: ShadcnTypography.h3),
                  ],
                ),
              ),
              const Divider(color: ShadcnColors.border, height: 1),
              ListTile(
                leading: const Icon(Icons.travel_explore, color: ShadcnColors.primary),
                title: const Text('Search Photos from Internet', style: ShadcnTypography.bodySemibold),
                subtitle: const Text('Find FMCG brand & grocery images online', style: ShadcnTypography.caption),
                onTap: () async {
                  Navigator.pop(ctx);
                  await _searchFromInternet();
                },
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt, color: ShadcnColors.primary),
                title: const Text('Take Photo with Camera', style: ShadcnTypography.bodySemibold),
                subtitle: const Text('Snap the item right off the grocery shelf', style: ShadcnTypography.caption),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: ShadcnColors.primary),
                title: const Text('Choose from Gallery', style: ShadcnTypography.bodySemibold),
                subtitle: const Text('Pick an existing photo or catalog image', style: ShadcnTypography.caption),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.gallery);
                },
              ),
              if (_currentImageUrl != null) ...[
                const Divider(color: ShadcnColors.border, height: 1),
                ListTile(
                  leading: const Icon(Icons.delete_outline, color: ShadcnColors.destructive),
                  title: const Text('Remove Photo', style: TextStyle(color: ShadcnColors.destructive, fontWeight: FontWeight.w600)),
                  onTap: () {
                    Navigator.pop(ctx);
                    _removePhoto();
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImageWidget(String imageUrl) {
    if (imageUrl.startsWith('data:image/')) {
      try {
        final commaIdx = imageUrl.indexOf(',');
        final base64Str = commaIdx != -1 ? imageUrl.substring(commaIdx + 1) : imageUrl;
        final bytes = base64Decode(base64Str);
        return Image.memory(
          bytes,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildFallbackIcon(),
        );
      } catch (_) {
        return _buildFallbackIcon();
      }
    } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return Image.network(
        imageUrl,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildFallbackIcon(),
      );
    }
    return _buildFallbackIcon();
  }

  Widget _buildFallbackIcon() {
    return const Center(
      child: Icon(Icons.broken_image_outlined, color: ShadcnColors.mutedForeground, size: 32),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isProcessing) {
      return Container(
        height: 140,
        decoration: BoxDecoration(
          color: ShadcnColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: ShadcnColors.border),
        ),
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(strokeWidth: 2.5, color: ShadcnColors.primary),
              ),
              SizedBox(height: 10),
              Text('Compressing photo...', style: ShadcnTypography.caption),
            ],
          ),
        ),
      );
    }

    if (_currentImageUrl != null && _currentImageUrl!.isNotEmpty) {
      // Photo is Attached
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: ShadcnColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: ShadcnColors.border),
        ),
        child: Row(
          children: [
            // Thumbnail Preview
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Container(
                width: 80,
                height: 80,
                color: ShadcnColors.secondary,
                child: _buildImageWidget(_currentImageUrl!),
              ),
            ),
            const SizedBox(width: 14),
            // Actions
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Product Photo Attached', style: ShadcnTypography.bodySemibold),
                  const SizedBox(height: 2),
                  const Text('Saved locally & synced to cloud', style: ShadcnTypography.caption),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      InkWell(
                        onTap: _showSourceSelectionSheet,
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: ShadcnColors.secondary,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: ShadcnColors.border),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.photo_camera, size: 13, color: ShadcnColors.foreground),
                              SizedBox(width: 4),
                              Text('Change', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: ShadcnColors.foreground)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: _removePhoto,
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.red.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.red.withOpacity(0.2)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.delete_outline, size: 13, color: ShadcnColors.destructive),
                              SizedBox(width: 4),
                              Text('Remove', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: ShadcnColors.destructive)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // Empty State: Prompt to Attach Photo
    return InkWell(
      onTap: _showSourceSelectionSheet,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: 100,
        decoration: BoxDecoration(
          color: ShadcnColors.secondary.withOpacity(0.4),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: ShadcnColors.border, style: BorderStyle.solid),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.add_a_photo_outlined, size: 20, color: ShadcnColors.primary),
              ),
              const SizedBox(height: 6),
              const Text('Add Product Photo', style: ShadcnTypography.bodySemibold),
              const SizedBox(height: 2),
              const Text('Take photo or upload from gallery', style: ShadcnTypography.caption),
            ],
          ),
        ),
      ),
    );
  }
}
