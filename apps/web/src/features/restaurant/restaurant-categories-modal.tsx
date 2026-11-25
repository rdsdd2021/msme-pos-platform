'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiClient, Category } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

interface RestaurantCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string;
  onUpdated?: () => void;
}

export function RestaurantCategoriesModal({
  open,
  onOpenChange,
  tenantId,
  onUpdated,
}: RestaurantCategoriesModalProps) {
  const { activeTenant } = useAuthStore();
  const activeTenantId = tenantId || activeTenant?.tenantId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add new category state
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit existing category state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (!activeTenantId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getCategories(activeTenantId);
      setCategories(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [activeTenantId]);

  useEffect(() => {
    if (open) {
      loadCategories();
      setNewName('');
      setEditingId(null);
      setError(null);
    }
  }, [open, loadCategories]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenantId) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('Please enter a category name');
      return;
    }

    try {
      setAdding(true);
      setError(null);
      const slug = trimmed
        .replace(/[^A-Za-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toUpperCase()
        .slice(0, 16);
      const code = `CAT-${slug || 'MENU'}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

      await apiClient.createCategory(activeTenantId, {
        name: trimmed,
        code,
        sortOrder: categories.length + 1,
      });
      setNewName('');
      await loadCategories();
      onUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to add category');
    } finally {
      setAdding(false);
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setError(null);
  };

  const handleSaveEdit = async (catId: string) => {
    if (!activeTenantId) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      setError('Category name cannot be empty');
      return;
    }

    try {
      setSavingId(catId);
      setError(null);
      await apiClient.updateCategory(activeTenantId, catId, { name: trimmed });
      setEditingId(null);
      await loadCategories();
      onUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to update category');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!activeTenantId) return;
    if (!confirm(`Remove category "${cat.name}"? Existing dishes in this category will remain intact.`)) {
      return;
    }

    try {
      setSavingId(cat.id);
      setError(null);
      await apiClient.deleteCategory(activeTenantId, cat.id);
      await loadCategories();
      onUpdated?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove category');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 rounded-2xl border-slate-200 overflow-hidden">
        <DialogHeader className="p-5 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-white">
                Manage Menu Categories
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Add, rename, or remove custom courses &amp; categories for your menu items
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add New Category Form */}
          <form onSubmit={handleAddCategory} className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Add New Category</Label>
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Momos & Dimsum, South Indian, Combos..."
                className="h-9 text-xs flex-1"
                disabled={adding}
              />
              <Button
                type="submit"
                size="sm"
                disabled={adding || !newName.trim()}
                className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1"
              >
                {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Add</span>
              </Button>
            </div>
          </form>

          {/* Existing Categories List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700">
                Active Categories ({categories.length})
              </Label>
            </div>

            {loading && categories.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <p className="text-xs font-semibold text-slate-600">No custom categories yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Add your first category above (e.g. Starters, Main Course, Beverages)
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {categories.map((cat) => {
                  const isEditing = editingId === cat.id;
                  const isBusy = savingId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/70"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-8 text-xs flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEdit(cat.id);
                              } else if (e.key === 'Escape') {
                                setEditingId(null);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => handleSaveEdit(cat.id)}
                            className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => setEditingId(null)}
                            className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-100"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{cat.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{cat.code}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={isBusy}
                              onClick={() => handleStartEdit(cat)}
                              className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                              title="Edit category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={isBusy}
                              onClick={() => handleDelete(cat)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Remove category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
