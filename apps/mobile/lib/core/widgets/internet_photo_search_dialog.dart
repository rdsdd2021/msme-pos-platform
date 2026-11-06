import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../theme/shadcn_colors.dart';
import 'shadcn_button.dart';
import 'shadcn_input.dart';

class InternetPhotoResult {
  final String title;
  final String? subtitle;
  final String imageUrl;
  final String? source;

  const InternetPhotoResult({
    required this.title,
    this.subtitle,
    required this.imageUrl,
    this.source,
  });
}

/// Modal bottom sheet allowing store owners to search for product photos online
/// via Open Food Facts (millions of FMCG items) & curated kirana staples imagery.
class InternetPhotoSearchSheet extends StatefulWidget {
  final String initialQuery;
  final bool isTestMode;

  const InternetPhotoSearchSheet({
    super.key,
    this.initialQuery = '',
    this.isTestMode = false,
  });

  static Future<String?> show(
    BuildContext context, {
    String initialQuery = '',
    bool isTestMode = false,
  }) async {
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => InternetPhotoSearchSheet(
        initialQuery: initialQuery,
        isTestMode: isTestMode,
      ),
    );
  }

  @override
  State<InternetPhotoSearchSheet> createState() => _InternetPhotoSearchSheetState();
}

class _InternetPhotoSearchSheetState extends State<InternetPhotoSearchSheet> {
  final TextEditingController _queryController = TextEditingController();
  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 8),
    receiveTimeout: const Duration(seconds: 12),
    headers: {
      'User-Agent': 'KiranaPOS - Android - Version 1.0.0 - www.kirana-pos.in',
    },
  ));

  List<InternetPhotoResult> _results = [];
  bool _isLoading = false;
  bool _isDownloading = false;
  String? _errorMessage;
  InternetPhotoResult? _selectedPhoto;

  static const List<String> _quickSuggestions = [
    'Atta',
    'Rice',
    'Eggs',
    'Milk',
    'Butter',
    'Maggi',
    'Tata Salt',
    'Parle-G',
    'Tea',
    'Biscuits',
    'Soap',
    'Oil',
  ];

  static const Map<String, String> _stapleImages = {
    'egg': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=480&q=80',
    'eggs': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=480&q=80',
    'atta': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=480&q=80',
    'wheat': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=480&q=80',
    'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=480&q=80',
    'milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=480&q=80',
    'butter': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=480&q=80',
    'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=480&q=80',
    'onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=480&q=80',
    'tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=480&q=80',
    'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=480&q=80',
    'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=480&q=80',
    'tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=480&q=80',
    'soap': 'https://images.unsplash.com/photo-1607006314352-8758832a514e?w=480&q=80',
    'oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=480&q=80',
  };

  @override
  void initState() {
    super.initState();
    _queryController.text = widget.initialQuery;
    if (widget.initialQuery.trim().isNotEmpty) {
      _performSearch(widget.initialQuery.trim());
    } else {
      _performSearch('Atta');
    }
  }

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _performSearch(String query) async {
    final cleanQuery = query.trim();
    if (cleanQuery.isEmpty) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _selectedPhoto = null;
    });

    if (widget.isTestMode) {
      // Mock search results for tests
      setState(() {
        _isLoading = false;
        _results = [
          InternetPhotoResult(
            title: cleanQuery,
            subtitle: 'Mock Test Packaging',
            imageUrl: 'https://images.unsplash.com/photo-mock-test?w=480&q=80',
            source: 'Mock Test Source',
          ),
          InternetPhotoResult(
            title: '$cleanQuery 1kg',
            subtitle: 'Premium Grade',
            imageUrl: 'https://images.unsplash.com/photo-mock-test-2?w=480&q=80',
            source: 'Mock Test Source',
          ),
        ];
      });
      return;
    }

    final List<InternetPhotoResult> collected = [];

    // 1. Check Curated Staples Catalog
    final lowerQ = cleanQuery.toLowerCase();
    for (final entry in _stapleImages.entries) {
      if (lowerQ.contains(entry.key) || entry.key.contains(lowerQ)) {
        collected.add(InternetPhotoResult(
          title: cleanQuery,
          subtitle: 'Fresh Grocery Staple',
          imageUrl: entry.value,
          source: 'Curated Kirana Staples',
        ));
        break;
      }
    }

    // 2. Query Open Food Facts API (Indian & Global Grocery Database)
    try {
      final searchUrl =
          'https://world.openfoodfacts.org/cgi/search.pl?search_terms=${Uri.encodeComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=20';

      final response = await _dio.get(searchUrl);
      if (response.statusCode == 200 && response.data is Map) {
        final products = response.data['products'] as List?;
        if (products != null) {
          for (final rawItem in products) {
            if (rawItem is! Map) continue;
            final item = Map<String, dynamic>.from(rawItem);
            final name = item['product_name'] ?? item['product_name_en'] ?? item['generic_name'];
            final brands = item['brands'] ?? '';
            final img = item['image_front_small_url'] ??
                item['image_small_url'] ??
                item['image_front_url'] ??
                item['image_url'];

            if (img != null && img is String && img.startsWith('http')) {
              collected.add(InternetPhotoResult(
                title: name?.toString().trim() ?? cleanQuery,
                subtitle: brands.toString().trim().isNotEmpty ? brands.toString().trim() : 'Packaged Retail',
                imageUrl: img,
                source: 'Open Food Facts',
              ));
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Open Food Facts search error: $e');
    }

    if (!mounted) return;

    setState(() {
      _isLoading = false;
      _results = collected;
      if (collected.isEmpty) {
        _errorMessage = 'No product images found for "$cleanQuery". Try searching for brand name or generic keyword.';
      }
    });
  }

  Future<void> _downloadAndConfirmPhoto(InternetPhotoResult photo) async {
    setState(() => _isDownloading = true);

    if (widget.isTestMode) {
      const mockBase64 =
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
      Navigator.of(context).pop(mockBase64);
      return;
    }

    try {
      final response = await _dio.get<List<int>>(
        photo.imageUrl,
        options: Options(responseType: ResponseType.bytes),
      );

      if (response.data != null && response.data!.isNotEmpty) {
        final bytes = Uint8List.fromList(response.data!);
        final base64Str = base64Encode(bytes);
        final dataUrl = 'data:image/jpeg;base64,$base64Str';

        if (mounted) {
          Navigator.of(context).pop(dataUrl);
        }
      } else {
        throw Exception('Empty image payload');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isDownloading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to download image: $e'),
            backgroundColor: ShadcnColors.destructive,
          ),
        );
      }
    }
  }

  Widget _buildThumbnail(String url, {double? width, double? height}) {
    if (widget.isTestMode || url.contains('photo-mock-test')) {
      return Container(
        width: width,
        height: height,
        color: ShadcnColors.secondary,
        child: const Center(
          child: Icon(Icons.image, color: ShadcnColors.mutedForeground, size: 24),
        ),
      );
    }
    return Image.network(
      url,
      width: width,
      height: height,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => Container(
        width: width,
        height: height,
        color: ShadcnColors.secondary,
        child: const Center(
          child: Icon(Icons.broken_image_outlined, color: ShadcnColors.mutedForeground),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      padding: EdgeInsets.only(bottom: bottomInset),
      decoration: const BoxDecoration(
        color: ShadcnColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            // Handle Bar
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
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: ShadcnColors.primaryLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.travel_explore, color: ShadcnColors.primary, size: 20),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Search Photos from Internet',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: ShadcnColors.foreground,
                            letterSpacing: -0.3,
                          ),
                        ),
                        Text(
                          'Select and attach product photos directly from the web',
                          style: TextStyle(fontSize: 11, color: ShadcnColors.mutedForeground),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            const Divider(height: 1, color: ShadcnColors.border),

            // Search Bar & Action
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                children: [
                  Expanded(
                    child: ShadcnInput(
                      key: const Key('internet_photo_search_input'),
                      controller: _queryController,
                      placeholder: 'e.g. Atta, Maggi, Tata Salt, Eggs...',
                      prefixIcon: const Icon(Icons.search, size: 18, color: ShadcnColors.mutedForeground),
                      onEditingComplete: () => _performSearch(_queryController.text),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ShadcnButton(
                    key: const Key('internet_photo_search_btn'),
                    text: 'Search',
                    size: ShadcnButtonSize.md,
                    isLoading: _isLoading,
                    onPressed: () => _performSearch(_queryController.text),
                  ),
                ],
              ),
            ),

            // Quick Suggestion Chips
            SizedBox(
              height: 34,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: _quickSuggestions.length,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (ctx, i) {
                  final tag = _quickSuggestions[i];
                  return ActionChip(
                    label: Text(tag, style: const TextStyle(fontSize: 11.5)),
                    backgroundColor: ShadcnColors.secondary,
                    side: const BorderSide(color: ShadcnColors.border),
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    onPressed: () {
                      _queryController.text = tag;
                      _performSearch(tag);
                    },
                  );
                },
              ),
            ),

            const SizedBox(height: 8),

            // Main Results View
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(strokeWidth: 2.5, color: ShadcnColors.primary),
                          SizedBox(height: 12),
                          Text(
                            'Searching online product databases...',
                            style: TextStyle(fontSize: 12, color: ShadcnColors.mutedForeground),
                          ),
                        ],
                      ),
                    )
                  : _errorMessage != null
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.search_off, size: 44, color: ShadcnColors.mutedForeground),
                                const SizedBox(height: 10),
                                Text(
                                  _errorMessage!,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 12.5, color: ShadcnColors.mutedForeground),
                                ),
                              ],
                            ),
                          ),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.85,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                          ),
                          itemCount: _results.length,
                          itemBuilder: (ctx, index) {
                            final item = _results[index];
                            final isSelected = _selectedPhoto?.imageUrl == item.imageUrl;

                            return InkWell(
                              key: Key('internet_photo_result_$index'),
                              onTap: () {
                                setState(() => _selectedPhoto = item);
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: ShadcnColors.card,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected ? ShadcnColors.primary : ShadcnColors.border,
                                    width: isSelected ? 2 : 1,
                                  ),
                                  boxShadow: [
                                    if (isSelected)
                                      BoxShadow(
                                        color: ShadcnColors.primary.withValues(alpha: 0.2),
                                        blurRadius: 8,
                                        spreadRadius: 1,
                                      ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Image
                                    Expanded(
                                      child: ClipRRect(
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
                                        child: SizedBox(
                                          width: double.infinity,
                                          height: double.infinity,
                                          child: _buildThumbnail(item.imageUrl),
                                        ),
                                      ),
                                    ),

                                    // Info
                                    Padding(
                                      padding: const EdgeInsets.all(8),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item.title,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                          ),
                                          const SizedBox(height: 2),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  item.subtitle ?? item.source ?? 'Web Image',
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    fontSize: 10,
                                                    color: ShadcnColors.mutedForeground,
                                                  ),
                                                ),
                                              ),
                                              if (isSelected)
                                                const Icon(Icons.check_circle, size: 14, color: ShadcnColors.primary),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),

            // Bottom Confirm Bar
            if (_selectedPhoto != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: ShadcnColors.surface,
                  border: Border(top: BorderSide(color: ShadcnColors.border)),
                ),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: _buildThumbnail(_selectedPhoto!.imageUrl, width: 40, height: 40),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _selectedPhoto!.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                          const Text(
                            'Will be downloaded & compressed for offline POS',
                            style: TextStyle(fontSize: 10, color: ShadcnColors.mutedForeground),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    ShadcnButton(
                      key: const Key('use_internet_photo_btn'),
                      text: 'Use Photo',
                      isLoading: _isDownloading,
                      onPressed: () => _downloadAndConfirmPhoto(_selectedPhoto!),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

