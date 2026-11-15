'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Utensils,
  Plus,
  Search,
  Edit2,
  Clock,
  ChefHat,
  Flame,
  Coffee,
  Cake,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { apiClient, Product } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { RestaurantDishModal } from './restaurant-dish-modal';
import { FoodDietaryType, KitchenStation } from '@pos/shared-types';

interface RestaurantMenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string;
  onMenuUpdated?: () => void;
}

export function RestaurantMenuModal({
  open,
  onOpenChange,
  tenantId,
  onMenuUpdated,
}: RestaurantMenuModalProps) {
  const { activeTenant } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDietary, setSelectedDietary] = useState<string>('ALL');
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [dishToEdit, setDishToEdit] = useState<Product | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const activeTenantId = tenantId || activeTenant?.tenantId;

  const fetchDishes = async () => {
    if (!activeTenantId) return;
    try {
      setLoading(true);
      const res = await apiClient.getProducts(activeTenantId);
      setProducts(res);
    } catch (err) {
      console.error('Failed to load menu dishes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDishes();
    }
  }, [open, activeTenantId]);

  const handleToggleAvailability = async (dish: Product) => {
    if (!activeTenantId) return;
    const newStatus = dish.isAvailable === false ? true : false;

    try {
      setTogglingId(dish.id);
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === dish.id ? { ...p, isAvailable: newStatus } : p)),
      );

      await apiClient.updateProduct(activeTenantId, dish.id, {
        isAvailable: newStatus,
      });

      if (onMenuUpdated) onMenuUpdated();
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      // Revert on error
      fetchDishes();
    } finally {
      setTogglingId(null);
    }
  };

  const filteredDishes = useMemo(() => {
    return products.filter((p) => {
      // 1. Search Query
      if (
        searchQuery &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // 2. Dietary Filter
      if (selectedDietary !== 'ALL') {
        if (selectedDietary === 'VEG' && p.foodType !== FoodDietaryType.VEG && p.foodType !== FoodDietaryType.VEGAN) {
          return false;
        }
        if (selectedDietary === 'NON_VEG' && p.foodType !== FoodDietaryType.NON_VEG) {
          return false;
        }
        if (selectedDietary === 'EGG' && p.foodType !== FoodDietaryType.EGG) {
          return false;
        }
      }

      // 3. Station Filter
      if (selectedStation !== 'ALL') {
        if (p.kitchenStation !== selectedStation) {
          return false;
        }
      }

      return true;
    });
  }, [products, searchQuery, selectedDietary, selectedStation]);

  const handleOpenAddDish = () => {
    setDishToEdit(null);
    setDishModalOpen(true);
  };

  const handleEditDish = (dish: Product) => {
    setDishToEdit(dish);
    setDishModalOpen(true);
  };

  const getDietaryIcon = (foodType?: string | null) => {
    if (foodType === FoodDietaryType.NON_VEG) {
      return (
        <span
          title="Non-Veg"
          className="w-4 h-4 rounded border-2 border-rose-600 flex items-center justify-center shrink-0 bg-white"
        >
          <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-rose-600" />
        </span>
      );
    }
    if (foodType === FoodDietaryType.EGG) {
      return (
        <span
          title="Contains Egg"
          className="w-4 h-4 rounded border-2 border-amber-500 flex items-center justify-center shrink-0 bg-white"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
        </span>
      );
    }
    // Default to veg indicator
    return (
      <span
        title="Pure Veg"
        className="w-4 h-4 rounded border-2 border-emerald-600 flex items-center justify-center shrink-0 bg-white"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-600" />
      </span>
    );
  };

  const getStationBadge = (station?: string | null) => {
    switch (station) {
      case KitchenStation.TANDOOR:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
            <Flame className="w-3 h-3 text-amber-600" /> Tandoor
          </span>
        );
      case KitchenStation.BEVERAGE_BAR:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
            <Coffee className="w-3 h-3 text-sky-600" /> Bar
          </span>
        );
      case KitchenStation.BAKERY_DESSERT:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-100 text-pink-800">
            <Cake className="w-3 h-3 text-pink-600" /> Dessert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
            <ChefHat className="w-3 h-3 text-slate-500" /> Kitchen
          </span>
        );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 rounded-2xl flex flex-col border-slate-200">
          {/* Header */}
          <DialogHeader className="p-5 bg-slate-900 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                    Restaurant Menu & Dish Management
                    <Badge variant="secondary" className="bg-slate-800 text-amber-400 border-slate-700 text-[10px]">
                      {products.length} Dishes
                    </Badge>
                  </DialogTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toggle live dish availability (86&apos;d), adjust portion pricing & assign kitchen stations
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchDishes}
                  disabled={loading}
                  className="h-9 w-9 p-0 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  onClick={handleOpenAddDish}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> Add Menu Dish
                </Button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Search */}
              <div className="sm:col-span-5 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes by name or code..."
                  className="pl-8 h-9 text-xs bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-amber-400"
                />
              </div>

              {/* Dietary Filter */}
              <div className="sm:col-span-4 flex items-center gap-1 overflow-x-auto">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'VEG', label: '🟢 Veg' },
                  { id: 'NON_VEG', label: '🔴 Non-Veg' },
                  { id: 'EGG', label: '🟡 Egg' },
                ].map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setSelectedDietary(tag.id)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all whitespace-nowrap ${
                      selectedDietary === tag.id
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* Station Filter */}
              <div className="sm:col-span-3">
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 text-white px-2.5 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                >
                  <option value="ALL">All Stations</option>
                  <option value={KitchenStation.MAIN_KITCHEN}>Main Kitchen</option>
                  <option value={KitchenStation.TANDOOR}>Tandoor & Grill</option>
                  <option value={KitchenStation.BEVERAGE_BAR}>Beverage Bar</option>
                  <option value={KitchenStation.BAKERY_DESSERT}>Bakery & Dessert</option>
                </select>
              </div>
            </div>
          </DialogHeader>

          {/* Dishes List */}
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-2.5">
            {filteredDishes.length === 0 ? (
              <div className="py-16 text-center">
                <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">No dishes match your filter</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting search filters or add a new dish.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenAddDish}
                  className="mt-4 text-xs font-bold gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Dish
                </Button>
              </div>
            ) : (
              filteredDishes.map((dish) => {
                const isAvail = dish.isAvailable !== false;
                return (
                  <div
                    key={dish.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isAvail
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        : 'bg-rose-50/40 border-rose-200 opacity-80'
                    }`}
                  >
                    {/* Left: Indicator & Dish Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5">{getDietaryIcon(dish.foodType)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-900 leading-snug truncate">
                            {dish.name}
                          </h4>
                          {getStationBadge(dish.kitchenStation)}
                          {dish.prepTimeMinutes && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                              <Clock className="w-3 h-3" /> {dish.prepTimeMinutes}m
                            </span>
                          )}
                          {!isAvail && (
                            <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-black uppercase">
                              Sold Out (86&apos;d)
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                          <span>{dish.categoryId || 'Main Course'}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-slate-400">{dish.sku}</span>
                          {dish.variants && dish.variants.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] text-amber-700 font-semibold">
                                {dish.variants.map((v) => `${v.name}: ₹${v.price}`).join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Pricing & Quick Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <div className="text-right">
                        <p className="text-base font-black text-slate-900">
                          ₹{parseFloat(dish.sellingPrice || '0').toFixed(2)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">+5% GST</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* 1-Click Availability Toggle */}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={togglingId === dish.id}
                          onClick={() => handleToggleAvailability(dish)}
                          className={`h-8 px-2.5 text-xs font-bold gap-1 rounded-lg transition-all ${
                            isAvail
                              ? 'border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                              : 'border-rose-300 text-rose-800 bg-rose-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                          }`}
                        >
                          {isAvail ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> In Stock
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Sold Out
                            </>
                          )}
                        </Button>

                        {/* Edit Button */}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditDish(dish)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Dish Modal */}
      <RestaurantDishModal
        open={dishModalOpen}
        onOpenChange={setDishModalOpen}
        dishToEdit={dishToEdit}
        tenantId={tenantId}
        onSuccess={() => {
          fetchDishes();
          if (onMenuUpdated) onMenuUpdated();
        }}
      />
    </>
  );
}
