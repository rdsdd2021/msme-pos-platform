import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/catalog_provider.dart';
import '../../../core/theme/shadcn_colors.dart';
import '../../../core/theme/shadcn_typography.dart';

class ManageCategoriesDialog extends ConsumerStatefulWidget {
  const ManageCategoriesDialog({super.key});

  @override
  ConsumerState<ManageCategoriesDialog> createState() => _ManageCategoriesDialogState();
}

class _ManageCategoriesDialogState extends ConsumerState<ManageCategoriesDialog> {
  final TextEditingController _addController = TextEditingController();
  bool _isBusy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(catalogProvider.notifier).fetchCategories());
  }

  @override
  void dispose() {
    _addController.dispose();
    super.dispose();
  }

  Future<void> _handleAdd() async {
    final name = _addController.text.trim();
    if (name.isEmpty) return;

    setState(() {
      _isBusy = true;
      _error = null;
    });

    try {
      await ref.read(catalogProvider.notifier).addCategory(name);
      _addController.clear();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isBusy = false);
    }
  }

  Future<void> _handleRename(String? id, String oldName) async {
    final controller = TextEditingController(text: oldName);
    final newName = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Rename Category', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(
            labelText: 'Category Name',
            border: OutlineInputBorder(),
            isDense: true,
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: ShadcnColors.primary, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    controller.dispose();

    if (newName == null || newName.isEmpty || newName == oldName) return;

    setState(() {
      _isBusy = true;
      _error = null;
    });
    try {
      await ref.read(catalogProvider.notifier).renameCategory(id, oldName, newName);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isBusy = false);
    }
  }

  Future<void> _handleDelete(String? id, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Category', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Text('Remove "$name"? Existing dishes in this category will remain on your menu.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: ShadcnColors.destructive, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() {
      _isBusy = true;
      _error = null;
    });
    try {
      await ref.read(catalogProvider.notifier).deleteCategory(id, name);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final catalogState = ref.watch(catalogProvider);
    final serverCats = catalogState.categories;
    final displayNames = catalogState.menuCategories;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: ShadcnColors.card,
      child: Container(
        width: 460,
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
        padding: const EdgeInsets.all(18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: ShadcnColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.category_outlined, color: ShadcnColors.primary, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Manage Menu Categories', style: ShadcnTypography.h3),
                      Text(
                        'Add, rename, or remove custom menu courses',
                        style: ShadcnTypography.caption,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (_error != null)
              Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: ShadcnColors.destructive.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: ShadcnColors.destructive.withOpacity(0.3)),
                ),
                child: Text(_error!, style: const TextStyle(fontSize: 12, color: ShadcnColors.destructive)),
              ),

            // Add category input
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _addController,
                    decoration: const InputDecoration(
                      hintText: 'New category (e.g. Momos, Combos)',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    onSubmitted: (_) => _handleAdd(),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ShadcnColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                  onPressed: _isBusy ? null : _handleAdd,
                  icon: _isBusy
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.add, size: 16),
                  label: const Text('Add', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 14),

            Text(
              'Active Categories (${displayNames.length})',
              style: ShadcnTypography.caption.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),

            Flexible(
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: ShadcnColors.border),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: displayNames.length,
                  separatorBuilder: (_, __) => const Divider(height: 1, color: ShadcnColors.border),
                  itemBuilder: (ctx, idx) {
                    final name = displayNames[idx];
                    final match = serverCats.cast<Map<String, dynamic>?>().firstWhere(
                          (c) => (c?['name'] as String?)?.toLowerCase() == name.toLowerCase(),
                          orElse: () => null,
                        );
                    final catId = match?['id'] as String?;

                    return ListTile(
                      dense: true,
                      title: Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit_outlined, size: 18, color: ShadcnColors.primary),
                            tooltip: 'Rename',
                            onPressed: _isBusy ? null : () => _handleRename(catId, name),
                          ),
                          if (catId != null)
                            IconButton(
                              icon: const Icon(Icons.delete_outline, size: 18, color: ShadcnColors.destructive),
                              tooltip: 'Remove',
                              onPressed: _isBusy ? null : () => _handleDelete(catId, name),
                            ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
