'use client';

import React, { useState } from 'react';
import { Category, Unit, Branch } from '@/lib/api-client';
import {
  Package,
  AlertTriangle,
  X,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CameraBarcodeModal } from '@/components/camera-barcode-modal';
import { ProductPhotoUpload } from './product-photo-upload';

export interface ProductFormData {
  open?: boolean;
  mode: 'create' | 'edit';
  productId?: string;
  name: string;
  sku: string;
  barcodePrimary: string;
  imageUrl?: string | null;
  categoryId: string;
  baseUnitId: string;
  purchaseCost: string;
  sellingPrice: string;
  mrp: string;
  hsnCode: string;
  gstRatePercent: string;
  packageSize: string;
  openingStockQuantity: string;
  openingStockBranchId: string;
  isSubmitting?: boolean;
  error?: string;
}

export interface ProductDrawerProps<T extends ProductFormData = ProductFormData> {
  open: boolean;
  onClose: () => void;
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  categories: Category[];
  units: Unit[];
  branches: Branch[];
  activeBranch: Branch | null;
  onSave: () => Promise<void>;
}

export function ProductDrawer<T extends ProductFormData = ProductFormData>({
  open,
  onClose,
  data,
  setData,
  categories,
  units,
  branches,
  activeBranch,
  onSave,
}: ProductDrawerProps<T>) {
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'stock'>('basic');
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);

  const updateField = (field: keyof ProductFormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden" data-testid="product-modal">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <DialogHeader className="p-5 bg-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-white">
                    {data.mode === 'create' ? '➕ Add New Product to Catalogue' : `✏️ Edit Product: ${data.name}`}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    {data.mode === 'create'
                      ? 'Define SKU, barcode, category, HSN and GST tax slab'
                      : `Update pricing, unit, and tax specifications for ${data.sku}`}
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white text-lg p-1 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          {/* Validation Error Banner */}
          {data.error && (
            <div
              className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-medium shrink-0"
              data-testid="product-modal-error"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{data.error}</span>
            </div>
          )}

          {/* Body with Progressive Disclosure Tabs */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="basic" className="text-xs">
                  1. Basic Details
                </TabsTrigger>
                <TabsTrigger value="pricing" className="text-xs">
                  2. Pricing & GST
                </TabsTrigger>
                <TabsTrigger value="stock" className="text-xs">
                  3. Stock & Unit
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Basic Details */}
              <TabsContent
                value="basic"
                forceMount
                className={activeTab === 'basic' ? 'space-y-3.5 mt-0' : 'hidden'}
              >
                <div>
                  <Label className="text-xs font-bold text-slate-700">Product Photo</Label>
                  <div className="mt-1">
                    <ProductPhotoUpload
                      imageUrl={data.imageUrl}
                      productName={data.name}
                      onChange={(url) => updateField('imageUrl', url)}
                      disabled={data.isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Product Name *</Label>
                  <input
                    type="text"
                    placeholder="e.g. Fortune Sunlite Refined Sunflower Oil 1L"
                    value={data.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    data-testid="product-name-input"
                    className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">SKU (Stock Keeping Unit) *</Label>
                    <input
                      type="text"
                      placeholder="e.g. FORT-SUN-1L"
                      value={data.sku}
                      onChange={(e) => updateField('sku', e.target.value)}
                      disabled={data.mode === 'edit'}
                      data-testid="product-sku-input"
                      className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-700">Primary Barcode (EAN / UPC)</Label>
                      <button
                        type="button"
                        onClick={() => setCameraScannerOpen(true)}
                        data-testid="product-scan-barcode-btn"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded-md transition cursor-pointer"
                        title="Scan barcode directly using device camera"
                      >
                        <Camera className="w-3 h-3 text-emerald-600" />
                        <span>Scan Camera</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 8901234567890"
                      value={data.barcodePrimary}
                      onChange={(e) => updateField('barcodePrimary', e.target.value)}
                      data-testid="product-barcode-input"
                      className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Category</Label>
                    <select
                      value={data.categoryId}
                      onChange={(e) => updateField('categoryId', e.target.value)}
                      data-testid="product-category-select"
                      className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">No Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Packaging / Variant Size</Label>
                    <input
                      type="text"
                      placeholder="e.g. 500 g, 1 kg, 1 L, Pack of 3"
                      value={data.packageSize}
                      onChange={(e) => updateField('packageSize', e.target.value)}
                      data-testid="product-package-size-input"
                      className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Pricing & GST */}
              <TabsContent
                value="pricing"
                forceMount
                className={activeTab === 'pricing' ? 'space-y-3.5 mt-0' : 'hidden'}
              >
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Purchase Cost (₹) *</Label>
                    <input
                      type="text"
                      placeholder="e.g. 140.00"
                      value={data.purchaseCost}
                      onChange={(e) => updateField('purchaseCost', e.target.value)}
                      data-testid="product-cost-input"
                      className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-right focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Selling Price (₹) *</Label>
                    <input
                      type="text"
                      placeholder="e.g. 165.00"
                      value={data.sellingPrice}
                      onChange={(e) => updateField('sellingPrice', e.target.value)}
                      data-testid="product-price-input"
                      className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-emerald-700 text-right focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Maximum Retail Price (MRP ₹) *</Label>
                    <input
                      type="text"
                      placeholder="e.g. 175.00"
                      value={data.mrp}
                      onChange={(e) => updateField('mrp', e.target.value)}
                      data-testid="product-mrp-input"
                      className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-right focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">HSN Code (GST Commodity Code)</Label>
                    <input
                      type="text"
                      placeholder="e.g. 11010000, 10063020"
                      value={data.hsnCode}
                      onChange={(e) => updateField('hsnCode', e.target.value)}
                      data-testid="product-hsn-input"
                      className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">GST Tax Slab *</Label>
                    <select
                      value={data.gstRatePercent}
                      onChange={(e) => updateField('gstRatePercent', e.target.value)}
                      data-testid="product-gst-select"
                      className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-blue-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="0.00">0% (Nil / Exempted - Milk, Fresh Atta, Salt)</option>
                      <option value="5.00">5% (Edible Oils, Sugar, Tea, Spices)</option>
                      <option value="12.00">12% (Butter, Ghee, Cheese, Dry Fruits)</option>
                      <option value="18.00">18% (Biscuits, Soaps, Detergents, Personal Care)</option>
                      <option value="28.00">28% (Carbonated Drinks, Luxury Goods)</option>
                    </select>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Stock & Unit */}
              <TabsContent
                value="stock"
                forceMount
                className={activeTab === 'stock' ? 'space-y-3.5 mt-0' : 'hidden'}
              >
                <div>
                  <Label className="text-xs font-bold text-slate-700">Unit of Measurement (UOM)</Label>
                  <select
                    value={data.baseUnitId}
                    onChange={(e) => updateField('baseUnitId', e.target.value)}
                    data-testid="product-unit-select"
                    className="w-full text-xs mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Piece / Item (Default)</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                {data.mode === 'create' && (
                  <div className="border border-emerald-200 rounded-xl p-3.5 bg-emerald-50/60 space-y-3">
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block">Initial Opening Stock (Atomic Ledger Entry)</span>
                      <span className="text-[11px] text-emerald-800">
                        Optional: Recording opening stock creates an immutable OPENING movement in the stock ledger.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-bold text-emerald-900">Opening Quantity</Label>
                        <input
                          type="text"
                          placeholder="e.g. 50.000"
                          value={data.openingStockQuantity}
                          onChange={(e) => updateField('openingStockQuantity', e.target.value)}
                          data-testid="product-opening-stock-input"
                          className="w-full text-xs mt-1 bg-white border border-emerald-300 rounded-lg px-3 py-1.5 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-emerald-900">Target Branch</Label>
                        <select
                          value={data.openingStockBranchId}
                          onChange={(e) => updateField('openingStockBranchId', e.target.value)}
                          data-testid="product-opening-branch-select"
                          className="w-full text-xs mt-1 bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                        >
                          <option value={activeBranch?.id || ''}>{activeBranch?.name || 'Active Branch'}</option>
                          {branches
                            .filter((b) => b.id !== activeBranch?.id)
                            .map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex sm:flex-row gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="px-4 py-2 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={data.isSubmitting}
              data-testid="product-save-btn"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm disabled:opacity-50 transition"
            >
              {data.isSubmitting
                ? 'Saving...'
                : data.mode === 'create'
                  ? 'Save Product'
                  : 'Update Product'}
            </Button>
          </DialogFooter>
        </form>

        {/* Device Camera Barcode Scanner Modal */}
        <CameraBarcodeModal
          open={cameraScannerOpen}
          onClose={() => setCameraScannerOpen(false)}
          onScan={(scannedCode) => {
            updateField('barcodePrimary', scannedCode);
          }}
          title="Scan Item Barcode"
          description="Point your device camera at the item packaging barcode."
        />
      </DialogContent>
    </Dialog>
  );
}
