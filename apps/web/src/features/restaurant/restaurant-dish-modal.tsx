'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Utensils,
  Plus,
  Trash2,
  Clock,
  Flame,
  ChefHat,
  Coffee,
  Cake,
  Leaf,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { apiClient, Product, CreateProductRequest } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { FoodDietaryType, KitchenStation } from '@pos/shared-types';

interface RestaurantDishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dishToEdit?: Product | null;
  onSuccess: () => void;
  tenantId?: string;
}

const COURSES = [
  'Starters & Appetizers',
  'Main Course',
  'Breads & Rice',
  'Tandoori & Grills',
  'Beverages & Shakes',
  'Desserts & Sweets',
  'Snacks & Fast Food',
];

export function RestaurantDishModal({
  open,
  onOpenChange,
  dishToEdit,
  onSuccess,
  tenantId,
}: RestaurantDishModalProps) {
  const { activeTenant } = useAuthStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState(COURSES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [foodType, setFoodType] = useState<FoodDietaryType>(FoodDietaryType.VEG);
  const [kitchenStation, setKitchenStation] = useState<KitchenStation>(KitchenStation.MAIN_KITCHEN);
  const [sellingPrice, setSellingPrice] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(15);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isMadeToOrder, setIsMadeToOrder] = useState(true);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Array<{ name: string; price: string }>>([
    { name: 'Half', price: '' },
    { name: 'Full', price: '' },
  ]);
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dishToEdit) {
      setName(dishToEdit.name || '');
      const cat = dishToEdit.categoryId || 'Main Course';
      if (COURSES.includes(cat)) {
        setCategory(cat);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(cat);
      }
      setFoodType((dishToEdit.foodType as FoodDietaryType) || FoodDietaryType.VEG);
      setKitchenStation((dishToEdit.kitchenStation as KitchenStation) || KitchenStation.MAIN_KITCHEN);
      setSellingPrice(dishToEdit.sellingPrice || '');
      setPrepTimeMinutes(dishToEdit.prepTimeMinutes || 15);
      setIsAvailable(dishToEdit.isAvailable !== false);
      setIsMadeToOrder(dishToEdit.isMadeToOrder !== false);
      if (dishToEdit.variants && dishToEdit.variants.length > 0) {
        setHasVariants(true);
        setVariants(dishToEdit.variants);
      } else {
        setHasVariants(false);
        setVariants([
          { name: 'Half', price: '' },
          { name: 'Full', price: '' },
        ]);
      }
      setImageUrl(dishToEdit.imageUrl || '');
    } else {
      setName('');
      setCategory(COURSES[0]);
      setCustomCategory('');
      setFoodType(FoodDietaryType.VEG);
      setKitchenStation(KitchenStation.MAIN_KITCHEN);
      setSellingPrice('');
      setPrepTimeMinutes(15);
      setIsAvailable(true);
      setIsMadeToOrder(true);
      setHasVariants(false);
      setVariants([
        { name: 'Half', price: '' },
        { name: 'Full', price: '' },
      ]);
      setImageUrl('');
    }
    setError(null);
  }, [dishToEdit, open]);

  const handleAddVariant = () => {
    setVariants([...variants, { name: '', price: '' }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: 'name' | 'price', val: string) => {
    const updated = [...variants];
    updated[index][field] = val;
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a dish name');
      return;
    }
    if (!sellingPrice.trim() || isNaN(parseFloat(sellingPrice))) {
      setError('Please enter a valid base selling price');
      return;
    }

    setSubmitting(true);
    setError(null);

    const activeTenantId = tenantId || activeTenant?.tenantId;
    if (!activeTenantId) {
      setError('No active tenant selected');
      setSubmitting(false);
      return;
    }

    try {
      const finalCategory = category === 'Other' ? customCategory.trim() || 'Kitchen' : category;
      const validVariants = hasVariants
        ? variants.filter((v) => v.name.trim() && v.price.trim())
        : undefined;

      const payload: CreateProductRequest = {
        name: name.trim(),
        sellingPrice: parseFloat(sellingPrice).toFixed(2),
        mrp: parseFloat(sellingPrice).toFixed(2),
        purchaseCost: '0.00',
        foodType,
        kitchenStation,
        prepTimeMinutes,
        isAvailable,
        isMadeToOrder,
        variants: validVariants,
        imageUrl: imageUrl.trim() || undefined,
        trackInventory: !isMadeToOrder,
        gstRatePercent: '5.00', // Standard Restaurant GST in India
      };

      if (dishToEdit) {
        await apiClient.updateProduct(activeTenantId, dishToEdit.id, payload);
      } else {
        await apiClient.createProduct(activeTenantId, payload);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save menu dish');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-slate-200">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <DialogHeader className="p-6 bg-slate-900 text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-white">
                  {dishToEdit ? 'Edit Restaurant Dish' : 'Add New Restaurant Dish'}
                </DialogTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure culinary attributes, kitchen station, portion pricing & dietary classification
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Form Body */}
          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Dish Name & Course */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Dish Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Paneer Butter Masala, Cold Coffee"
                  className="h-10 text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Course / Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {COURSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Other">Custom Category...</option>
                </select>
                {category === 'Other' && (
                  <Input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category"
                    className="h-9 text-xs mt-1.5"
                  />
                )}
              </div>
            </div>

            {/* 2. Dietary Indicator (Indian F&B Standard) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Dietary Classification *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Pure Veg */}
                <button
                  type="button"
                  onClick={() => setFoodType(FoodDietaryType.VEG)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    foodType === FoodDietaryType.VEG
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="w-5 h-5 rounded-md border-2 border-emerald-600 flex items-center justify-center shrink-0 bg-white">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  </span>
                  <div>
                    <p className="text-xs font-bold">Pure Veg</p>
                    <p className="text-[10px] text-slate-400">Green Dot</p>
                  </div>
                </button>

                {/* Non-Veg */}
                <button
                  type="button"
                  onClick={() => setFoodType(FoodDietaryType.NON_VEG)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    foodType === FoodDietaryType.NON_VEG
                      ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="w-5 h-5 rounded-md border-2 border-rose-600 flex items-center justify-center shrink-0 bg-white">
                    <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-rose-600" />
                  </span>
                  <div>
                    <p className="text-xs font-bold">Non-Veg</p>
                    <p className="text-[10px] text-slate-400">Brown/Red</p>
                  </div>
                </button>

                {/* Contains Egg */}
                <button
                  type="button"
                  onClick={() => setFoodType(FoodDietaryType.EGG)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    foodType === FoodDietaryType.EGG
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="w-5 h-5 rounded-md border-2 border-amber-500 flex items-center justify-center shrink-0 bg-white">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  </span>
                  <div>
                    <p className="text-xs font-bold">Egg</p>
                    <p className="text-[10px] text-slate-400">Yellow Dot</p>
                  </div>
                </button>

                {/* Vegan */}
                <button
                  type="button"
                  onClick={() => setFoodType(FoodDietaryType.VEGAN)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    foodType === FoodDietaryType.VEGAN
                      ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="w-5 h-5 rounded-md border-2 border-teal-600 flex items-center justify-center shrink-0 bg-white text-teal-600">
                    <Leaf className="w-3 h-3" />
                  </span>
                  <div>
                    <p className="text-xs font-bold">Vegan</p>
                    <p className="text-[10px] text-slate-400">Plant-based</p>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Kitchen Routing Station */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Kitchen Routing Station *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: KitchenStation.MAIN_KITCHEN,
                    label: 'Main Kitchen',
                    desc: 'Curries, Gravies, Mains',
                    icon: ChefHat,
                  },
                  {
                    id: KitchenStation.TANDOOR,
                    label: 'Tandoor & Grill',
                    desc: 'Naan, Kebabs, Tikkas',
                    icon: Flame,
                  },
                  {
                    id: KitchenStation.BEVERAGE_BAR,
                    label: 'Beverage Bar',
                    desc: 'Juices, Shakes, Teas',
                    icon: Coffee,
                  },
                  {
                    id: KitchenStation.BAKERY_DESSERT,
                    label: 'Bakery & Dessert',
                    desc: 'Pastries, Ice Creams',
                    icon: Cake,
                  },
                ].map((station) => {
                  const Icon = station.icon;
                  const isSelected = kitchenStation === station.id;
                  return (
                    <button
                      key={station.id}
                      type="button"
                      onClick={() => setKitchenStation(station.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white font-bold shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                      <div>
                        <p className="text-xs font-bold leading-tight">{station.label}</p>
                        <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {station.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Pricing & Preparation Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Base Selling Price (₹) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <Input
                    type="number"
                    step="0.5"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="250.00"
                    className="pl-7 h-10 text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Kitchen Prep Time (Mins)</Label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    value={prepTimeMinutes}
                    onChange={(e) => setPrepTimeMinutes(parseInt(e.target.value) || 15)}
                    className="pl-8 h-10 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Restaurant GST</Label>
                <div className="h-10 px-3 flex items-center bg-white border rounded-md text-xs font-bold text-slate-800 justify-between">
                  <span>5% GST</span>
                  <Badge variant="secondary" className="text-[10px] bg-slate-100">
                    Composite F&B
                  </Badge>
                </div>
              </div>
            </div>

            {/* 5. Portion Variations (Half / Full) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="portionVariants"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <Label htmlFor="portionVariants" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Offer Portion Sizes (e.g., Half / Full, Regular / Large)
                  </Label>
                </div>
                {hasVariants && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddVariant}
                    className="h-7 text-[11px] gap-1 font-bold text-slate-700"
                  >
                    <Plus className="w-3 h-3" /> Add Size
                  </Button>
                )}
              </div>

              {hasVariants && (
                <div className="space-y-2 p-3 bg-slate-50 border rounded-xl">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={v.name}
                        onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                        placeholder="Portion name (e.g. Half, Large)"
                        className="h-9 text-xs bg-white font-medium flex-1"
                      />
                      <div className="relative w-32">
                        <span className="absolute left-2.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                        <Input
                          type="number"
                          step="0.5"
                          value={v.price}
                          onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                          placeholder="Price"
                          className="pl-6 h-9 text-xs bg-white font-bold"
                        />
                      </div>
                      {variants.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVariant(idx)}
                          className="h-9 w-9 p-0 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Availability & Made-to-Order Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
              <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-slate-50 transition-all select-none">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Available on Menu</p>
                  <p className="text-[10px] text-slate-500">Uncheck to mark dish Sold Out (86&apos;d)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-slate-50 transition-all select-none">
                <input
                  type="checkbox"
                  checked={isMadeToOrder}
                  onChange={(e) => setIsMadeToOrder(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Made to Order (Cooked Food)</p>
                  <p className="text-[10px] text-slate-500">No shelf stock counting required</p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 bg-slate-50 border-t rounded-b-2xl flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5"
            >
              {submitting ? (
                'Saving Dish...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {dishToEdit ? 'Save Changes' : 'Add to Menu'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
