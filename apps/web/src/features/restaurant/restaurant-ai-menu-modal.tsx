'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  UploadCloud,
  FileImage,
  Trash2,
  Plus,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  Camera,
} from 'lucide-react';
import { apiClient, ParsedMenuDishItem } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

interface RestaurantAiMenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

export function RestaurantAiMenuModal({
  open,
  onOpenChange,
  onImportSuccess,
}: RestaurantAiMenuModalProps) {
  const { activeTenant, activeBranch } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'parsing' | 'review'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedDishes, setExtractedDishes] = useState<ParsedMenuDishItem[]>([]);
  const [providerUsed, setProviderUsed] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const resetState = () => {
    setStep('upload');
    setSelectedFile(null);
    setImagePreview(null);
    setExtractedDishes([]);
    setErrorMessage(null);
    setImporting(false);
    setImportSuccessCount(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMessage('Please select a valid image (JPEG, PNG, WebP) or PDF file.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const startAiAnalysis = async (customBase64?: string, customMime?: string) => {
    if (!activeTenant?.tenantId) return;

    let base64Data = customBase64;
    let mime = customMime || selectedFile?.type || 'image/jpeg';

    if (!base64Data && selectedFile) {
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const commaIdx = res.indexOf(',');
          resolve(commaIdx >= 0 ? res.substring(commaIdx + 1) : res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
    }

    if (!base64Data) {
      setErrorMessage('Please select or upload a menu photo first.');
      return;
    }

    try {
      setStep('parsing');
      setErrorMessage(null);

      const res = await apiClient.parseMenuImage(
        activeTenant.tenantId,
        base64Data,
        mime,
      );

      setExtractedDishes(res.dishes || []);
      setProviderUsed(res.provider);
      setStep('review');
    } catch (err: any) {
      console.error('AI Menu parsing failed', err);
      setErrorMessage(err?.message || 'Failed to analyze menu image. Please try again.');
      setStep('upload');
    }
  };

  // Quick scan sample menu demo
  const handleScanSample = () => {
    startAiAnalysis('sample_demo_base64', 'image/jpeg');
  };

  const handleDishChange = (index: number, field: keyof ParsedMenuDishItem, value: any) => {
    setExtractedDishes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveDish = (index: number) => {
    setExtractedDishes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddBlankDish = () => {
    setExtractedDishes((prev) => [
      ...prev,
      {
        name: 'New Dish',
        price: '150.00',
        category: 'Main Course',
        foodType: 'veg',
        kitchenStation: 'kitchen',
      },
    ]);
  };

  const handleCommitImport = async () => {
    if (!activeTenant?.tenantId || extractedDishes.length === 0) return;

    try {
      setImporting(true);
      setErrorMessage(null);

      const result = await apiClient.importMenuDishes(
        activeTenant.tenantId,
        activeBranch?.id || '',
        extractedDishes,
      );

      setImportSuccessCount(result.importedCount);
      onImportSuccess();
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Import failed', err);
      setErrorMessage(err?.message || 'Failed to import dishes to catalog.');
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white text-slate-900 border-slate-200">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                AI Assisted Menu Upload
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-semibold">
                  Gemini Vision
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Snap or upload your restaurant menu card. AI extracts dish names, prices, categories & dietary flags in seconds.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD SCREEN */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-lg p-8 border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl bg-slate-50/60 hover:bg-purple-50/20 transition-all cursor-pointer flex flex-col items-center text-center group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="w-16 h-16 rounded-2xl bg-purple-100/70 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <h4 className="text-sm font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Click or Drag & Drop Menu Photo or PDF'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Supports JPEG, PNG, WebP photo of physical menu or PDF menu booklet.
                </p>

                {imagePreview && (
                  <div className="mt-4 relative max-h-48 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                    <img src={imagePreview} alt="Menu Preview" className="h-44 object-contain" />
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {selectedFile ? (
                  <Button
                    onClick={() => startAiAnalysis()}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-10 px-6 gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Scan & Extract Dishes
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-slate-300 text-slate-700 font-semibold text-xs h-10 px-4 gap-2"
                    >
                      <Camera className="w-4 h-4 text-purple-600" />
                      Browse / Capture Menu
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleScanSample}
                      className="text-purple-700 hover:bg-purple-50 font-semibold text-xs h-10 px-3"
                    >
                      Try with Sample Menu &rarr;
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: SCANNING / ANALYZING SCREEN */}
          {step === 'parsing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-ping opacity-30" />
                <div className="w-20 h-20 rounded-full bg-purple-50 border-2 border-purple-500 text-purple-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-10 h-10 animate-spin" />
                </div>
              </div>

              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Reading Menu with AI Vision...
              </h3>
              <p className="text-xs text-slate-500 mt-2 max-w-sm">
                Parsing dish titles, portion prices, categories (Starters, Breads, Main Course), and kitchen station routing...
              </p>
            </div>
          )}

          {/* STEP 3: REVIEW & EDIT TABLE */}
          {step === 'review' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    Extracted Dishes ({extractedDishes.length})
                  </span>
                  <Badge variant="outline" className="text-[11px] font-semibold text-slate-600 bg-slate-50">
                    {providerUsed === 'gemini-vision' ? '✨ Gemini 1.5' : '⚡ Smart Indian Menu Parser'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddBlankDish}
                    className="h-8 text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Row
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStep('upload')}
                    className="h-8 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Upload Another
                  </Button>
                </div>
              </div>

              {/* Editable Dishes Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-[50vh] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Dish Title</th>
                        <th className="py-2.5 px-3 w-28">Price (₹)</th>
                        <th className="py-2.5 px-3 w-36">Category</th>
                        <th className="py-2.5 px-3 w-28">Diet</th>
                        <th className="py-2.5 px-3 w-32">Kitchen Station</th>
                        <th className="py-2.5 px-2 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {extractedDishes.map((dish, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2">
                            <Input
                              value={dish.name}
                              onChange={(e) => handleDishChange(idx, 'name', e.target.value)}
                              className="h-8 text-xs font-medium"
                            />
                          </td>
                          <td className="p-2">
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                              <Input
                                value={dish.price}
                                onChange={(e) => handleDishChange(idx, 'price', e.target.value)}
                                className="h-8 text-xs font-bold text-slate-900 pl-6"
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <Input
                              value={dish.category}
                              onChange={(e) => handleDishChange(idx, 'category', e.target.value)}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={dish.foodType || 'veg'}
                              onChange={(e) => handleDishChange(idx, 'foodType', e.target.value)}
                              className="h-8 w-full text-xs rounded-lg border border-slate-200 px-2 bg-white text-slate-800"
                            >
                              <option value="veg">🟢 Veg</option>
                              <option value="non_veg">🔴 Non-Veg</option>
                              <option value="egg">🟡 Egg</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              value={dish.kitchenStation || 'kitchen'}
                              onChange={(e) => handleDishChange(idx, 'kitchenStation', e.target.value)}
                              className="h-8 w-full text-xs rounded-lg border border-slate-200 px-2 bg-white text-slate-800"
                            >
                              <option value="kitchen">🍳 Kitchen</option>
                              <option value="tandoor">🔥 Tandoor</option>
                              <option value="bar">🍹 Bar</option>
                              <option value="desserts">🍰 Dessert</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveDish(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-xs font-semibold text-slate-600 hover:bg-slate-200/50"
          >
            Cancel
          </Button>

          {step === 'review' && (
            <div className="flex items-center gap-3">
              {importSuccessCount !== null ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Successfully imported {importSuccessCount} dishes!
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleCommitImport}
                  disabled={importing || extractedDishes.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-5 gap-2 shadow-sm"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Importing to Catalog...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save & Import {extractedDishes.length} Dishes
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
