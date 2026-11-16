'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { apiClient, Product, Category } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { RestaurantDishModal } from './restaurant-dish-modal';
import { FoodDietaryType, KitchenStation } from '@pos/shared-types';
import { useRealtimeEvents } from '@/hooks/use-realtime-events';

const COURSES = [
  'All Courses',
  'Starters & Appetizers',
  'Main Course',
  'Breads & Rice',
  'Tandoori & Grills',
  'Desserts & Sweets',
  'Beverages & Shakes',
  'Snacks & Fast Food',
];

export function RestaurantMenuView() {
  const { activeTenant } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDietary, setSelectedDietary] = useState<string>('ALL');
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [selectedCourse, setSelectedCourse] = useState<string>('All Courses');
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [dishToEdit, setDishToEdit] = useState<Product | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const activeTenantId = activeTenant?.tenantId;

  const fetchDishes = useCallback(async () => {
    if (!activeTenantId) return;
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        apiClient.getProducts(activeTenantId),
        apiClient.getCategories(activeTenantId).catch(() => []),
      ]);
      setProducts(prodRes || []);
      setCategories(catRes || []);
    } catch (err) {
      console.error('Failed to load menu dishes:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTenantId]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const getDishCategoryName = useCallback((dish: Product) => {
    if (dish.categoryId && categoryMap.has(dish.categoryId)) {
      return categoryMap.get(dish.categoryId)!;
    }
    return dish.category || dish.categoryName || 'Main Course';
  }, [categoryMap]);

  // Real-time SSE updates when mobile waiters or cloud sync updates catalog
  useRealtimeEvents({
    tenantId: activeTenantId,
    onCatalogChanged: () => {
      fetchDishes();
    },
    pollIntervalMs: 15000,
    onPoll: fetchDishes,
  });

  const handleToggleAvailability = async (dish: Product) => {
    if (!activeTenantId) return;
    const newStatus = dish.isAvailable === false ? true : false;

    try {
      setTogglingId(dish.id);
      setProducts((prev) =>
        prev.map((p) => (p.id === dish.id ? { ...p, isAvailable: newStatus } : p)),
      );

      await apiClient.updateProduct(activeTenantId, dish.id, {
        isAvailable: newStatus,
      });
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      fetchDishes();
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenAddDish = () => {
    setDishToEdit(null);
    setDishModalOpen(true);
  };

  const handleOpenEditDish = (dish: Product) => {
    setDishToEdit(dish);
    setDishModalOpen(true);
  };

  // KPIs
  const totalDishes = products.length;
  const vegCount = products.filter(
    (p) => p.foodType === FoodDietaryType.VEG || p.foodType === 'veg' || p.foodType === 'vegan',
  ).length;
  const nonVegCount = products.filter(
    (p) => p.foodType === FoodDietaryType.NON_VEG || p.foodType === 'non_veg',
  ).length;
  const eggCount = products.filter(
    (p) => p.foodType === FoodDietaryType.EGG || p.foodType === 'egg',
  ).length;
  const soldOutCount = products.filter((p) => p.isAvailable === false).length;

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return products.filter((dish) => {
      const q = searchQuery.toLowerCase().trim();
      const catName = getDishCategoryName(dish).toLowerCase();
      const matchSearch =
        !q ||
        dish.name.toLowerCase().includes(q) ||
        catName.includes(q) ||
        (dish.sku && dish.sku.toLowerCase().includes(q));

      const matchDietary =
        selectedDietary === 'ALL' ||
        (selectedDietary === 'VEG' &&
          (dish.foodType === FoodDietaryType.VEG || dish.foodType === 'veg' || dish.foodType === 'vegan')) ||
        (selectedDietary === 'NON_VEG' &&
          (dish.foodType === FoodDietaryType.NON_VEG || dish.foodType === 'non_veg')) ||
        (selectedDietary === 'EGG' &&
          (dish.foodType === FoodDietaryType.EGG || dish.foodType === 'egg'));

      const matchStation =
        selectedStation === 'ALL' || dish.kitchenStation === selectedStation;

      const matchCourse =
        selectedCourse === 'All Courses' ||
        catName === selectedCourse.toLowerCase();

      return matchSearch && matchDietary && matchStation && matchCourse;
    });
  }, [products, searchQuery, selectedDietary, selectedStation, selectedCourse, getDishCategoryName]);

  const getDietaryIcon = (foodType?: string | null) => {
    if (foodType === FoodDietaryType.NON_VEG || foodType === 'non_veg') {
      return (
        <span
          title="Non-Veg"
          className="w-4 h-4 rounded border-2 border-rose-600 flex items-center justify-center shrink-0 bg-white shadow-2xs"
        >
          <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-rose-600" />
        </span>
      );
    }
    if (foodType === FoodDietaryType.EGG || foodType === 'egg') {
      return (
        <span
          title="Contains Egg"
          className="w-4 h-4 rounded border-2 border-amber-500 flex items-center justify-center shrink-0 bg-white shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
        </span>
      );
    }
    return (
      <span
        title="Pure Veg"
        className="w-4 h-4 rounded border-2 border-emerald-600 flex items-center justify-center shrink-0 bg-white shadow-2xs"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-600" />
      </span>
    );
  };

  const getStationBadge = (station?: string | null) => {
    switch (station) {
      case KitchenStation.TANDOOR:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            <Flame className="w-3 h-3 text-amber-600" /> Tandoor
          </span>
        );
      case KitchenStation.BEVERAGE_BAR:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
            <Coffee className="w-3 h-3 text-sky-600" /> Bar
          </span>
        );
      case KitchenStation.BAKERY_DESSERT:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">
            <Cake className="w-3 h-3 text-pink-600" /> Dessert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            <ChefHat className="w-3 h-3 text-slate-500" /> Main Kitchen
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden" data-testid="restaurant-menu-view">
      {/* Top Header Banner */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 flex-shrink-0 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 shadow-2xs">
              <Utensils className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Restaurant Menu & Dishes
                </h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
                  Live Cloud Sync
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage dishes, portion pricing (Half/Full), dietary types, kitchen routing, and live 86&apos;d availability.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDishes}
              disabled={loading}
              className="h-9 px-3 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>Refresh Menu</span>
            </Button>
            <Button
              size="sm"
              onClick={handleOpenAddDish}
              data-testid="btn-add-menu-dish"
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Dish</span>
            </Button>
          </div>
        </div>

        {/* KPI Strip (Matching Mobile Experience) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Dishes</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">{totalDishes}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              🍽️
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Pure Veg</span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{vegCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              🟢
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Non-Veg / Egg</span>
              <p className="text-xl font-black text-rose-700 mt-0.5">{nonVegCount + eggCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
              🔴
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">86&apos;d / Sold Out</span>
              <p className="text-xl font-black text-amber-700 mt-0.5">{soldOutCount}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              🚫
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name, SKU, or category..."
              className="pl-8 h-8.5 text-xs bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Dietary Chips */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/60">
              {[
                { id: 'ALL', label: 'All Items' },
                { id: 'VEG', label: '🟢 Pure Veg' },
                { id: 'NON_VEG', label: '🔴 Non-Veg' },
                { id: 'EGG', label: '🟡 Egg' },
              ].map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedDietary(tag.id)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    selectedDietary === tag.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Station Dropdown */}
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white text-slate-700 px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Kitchen Stations</option>
              <option value={KitchenStation.MAIN_KITCHEN}>Main Kitchen</option>
              <option value={KitchenStation.TANDOOR}>Tandoor & Grill</option>
              <option value={KitchenStation.BEVERAGE_BAR}>Beverage Bar</option>
              <option value={KitchenStation.BAKERY_DESSERT}>Bakery & Dessert</option>
            </select>
          </div>
        </div>

        {/* Course Tabs Navigation */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {COURSES.map((course) => (
            <button
              key={course}
              onClick={() => setSelectedCourse(course)}
              className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCourse === course
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {course}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes Catalog Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredDishes.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-white border border-dashed border-slate-300 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-3 shadow-2xs">
              <Utensils className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No dishes found in menu</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {searchQuery || selectedDietary !== 'ALL' || selectedCourse !== 'All Courses'
                ? 'No menu items match your active search and course filters. Try adjusting your filter parameters.'
                : 'Your restaurant menu is currently empty. Start by adding your first dish or syncing from your mobile app!'}
            </p>
            <Button
              size="sm"
              onClick={handleOpenAddDish}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Add Menu Dish
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDishes.map((dish) => {
              const isAvail = dish.isAvailable !== false;
              const hasVariants = dish.variants && Array.isArray(dish.variants) && dish.variants.length > 0;
              const basePrice = parseFloat(dish.sellingPrice || '0');
              const categoryName = getDishCategoryName(dish);

              return (
                <div
                  key={dish.id}
                  className={`bg-white rounded-2xl border transition-all p-4.5 flex flex-col justify-between hover:shadow-md ${
                    isAvail ? 'border-slate-200/90 hover:border-slate-300' : 'border-rose-200 bg-rose-50/25'
                  }`}
                >
                  <div>
                    {/* Top row: Dietary tag, category badge, and 86'd status */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        {getDietaryIcon(dish.foodType)}
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                          {categoryName}
                        </span>
                      </div>
                      {getStationBadge(dish.kitchenStation)}
                    </div>

                    {/* Dish Name */}
                    <h3 className="font-bold text-slate-900 text-sm leading-snug tracking-tight">
                      {dish.name}
                    </h3>

                    {/* Code & Prep Time */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      {dish.sku && <span className="font-mono text-slate-500 font-semibold">{dish.sku}</span>}
                      {dish.prepTimeMinutes && (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" /> {dish.prepTimeMinutes} mins
                        </span>
                      )}
                    </div>

                    {/* Pricing & Portion Variants */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100">
                      {hasVariants ? (
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Portion Pricing
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {dish.variants!.map((v, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-bold"
                              >
                                <span>{v.name}:</span>
                                <span className="text-emerald-700">₹{parseFloat(v.price).toFixed(2)}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-black text-slate-900">₹{basePrice.toFixed(2)}</span>
                          <span className="text-[10px] font-semibold text-slate-400">/ portion</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Live 86'd Toggle */}
                    <button
                      type="button"
                      disabled={togglingId === dish.id}
                      onClick={() => handleToggleAvailability(dish)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isAvail
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                      }`}
                    >
                      {isAvail ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>In Stock</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>86&apos;d (Sold Out)</span>
                        </>
                      )}
                    </button>

                    {/* Edit Dish Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditDish(dish)}
                      className="h-7.5 px-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 mr-1 text-slate-500" />
                      <span>Edit Dish</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Dish Modal */}
      <RestaurantDishModal
        open={dishModalOpen}
        onOpenChange={setDishModalOpen}
        dishToEdit={dishToEdit}
        tenantId={activeTenantId}
        onSuccess={() => {
          fetchDishes();
        }}
      />
    </div>
  );
}
