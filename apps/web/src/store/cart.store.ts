import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: string; // Decimal string (e.g. "140.00")
  mrp?: string;
  quantity: number;
  discountAmount?: string; // Decimal string (e.g. "0.00")
  gstRate: string; // Decimal string (e.g. "5.00")
  currentStock?: string;
}

export interface AddItemOptions {
  allowNegativeStock?: boolean;
}

export interface AddItemResult {
  success: boolean;
  blockedReason?: 'OUT_OF_STOCK' | 'EXCEEDS_STOCK';
  currentStock?: number;
  addedQuantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number, options?: AddItemOptions) => AddItemResult;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, options?: AddItemOptions) => void;
  updateDiscount: (productId: string, discount: string) => void;
  clearCart: () => void;
  getSubtotal: () => string;
  getDiscountTotal: () => string;
  getTaxTotal: () => string;
  getUnroundedTotal: () => string;
  getRoundingAdjustment: () => string;
  getGrandTotal: () => string;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item, quantity = 1, options) => {
    let result: AddItemResult = { success: true, addedQuantity: quantity };

    if (!options?.allowNegativeStock && item.currentStock !== undefined && item.currentStock !== null) {
      const maxStock = parseFloat(item.currentStock);
      if (!isNaN(maxStock)) {
        if (maxStock <= 0) {
          return {
            success: false,
            blockedReason: 'OUT_OF_STOCK',
            currentStock: 0,
            addedQuantity: 0,
          };
        }

        const existing = get().items.find((i) => i.productId === item.productId);
        const currentCartQty = existing ? existing.quantity : 0;

        if (currentCartQty + quantity > maxStock) {
          if (currentCartQty >= maxStock) {
            return {
              success: false,
              blockedReason: 'EXCEEDS_STOCK',
              currentStock: maxStock,
              addedQuantity: 0,
            };
          }
          const allowedAdd = maxStock - currentCartQty;
          result = {
            success: true,
            blockedReason: 'EXCEEDS_STOCK',
            currentStock: maxStock,
            addedQuantity: allowedAdd,
          };
          quantity = allowedAdd;
        }
      }
    }

    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          ),
        };
      }
      return {
        items: [...state.items, { ...item, quantity, discountAmount: item.discountAmount || '0.00' }],
      };
    });

    return result;
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity, options) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) => {
        if (i.productId !== productId) return i;
        let finalQty = quantity;
        if (!options?.allowNegativeStock && i.currentStock !== undefined && i.currentStock !== null) {
          const maxStock = parseFloat(i.currentStock);
          if (!isNaN(maxStock) && finalQty > maxStock) {
            finalQty = maxStock;
          }
        }
        return { ...i, quantity: finalQty };
      }),
    }));
  },

  updateDiscount: (productId, discount) => {
    const validDiscount = parseFloat(discount) >= 0 ? discount : '0.00';
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, discountAmount: validDiscount } : i,
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  getSubtotal: () => {
    const totalPaisa = get().items.reduce((acc, item) => {
      const pricePaisa = Math.round(parseFloat(item.price) * 100);
      return acc + pricePaisa * item.quantity;
    }, 0);
    return (totalPaisa / 100).toFixed(2);
  },

  getDiscountTotal: () => {
    const discountPaisa = get().items.reduce((acc, item) => {
      const discPaisa = Math.round(parseFloat(item.discountAmount || '0') * 100);
      return acc + discPaisa;
    }, 0);
    return (discountPaisa / 100).toFixed(2);
  },

  getTaxTotal: () => {
    const taxPaisa = get().items.reduce((acc, item) => {
      const pricePaisa = Math.round(parseFloat(item.price) * 100);
      const discPaisa = Math.round(parseFloat(item.discountAmount || '0') * 100);
      const taxablePaisa = Math.max(0, pricePaisa * item.quantity - discPaisa);
      const gstRate = parseFloat(item.gstRate || '0');
      // Mirroring backend billing.service.ts intra-state calculation:
      const lineCgstPaisa = Math.round((taxablePaisa * (gstRate / 2)) / 100);
      const lineSgstPaisa = Math.round((taxablePaisa * (gstRate / 2)) / 100);
      return acc + lineCgstPaisa + lineSgstPaisa;
    }, 0);
    return (taxPaisa / 100).toFixed(2);
  },

  getUnroundedTotal: () => {
    const subtotalPaisa = Math.round(parseFloat(get().getSubtotal()) * 100);
    const discPaisa = Math.round(parseFloat(get().getDiscountTotal()) * 100);
    const taxablePaisa = Math.max(0, subtotalPaisa - discPaisa);
    const taxPaisa = Math.round(parseFloat(get().getTaxTotal()) * 100);
    return ((taxablePaisa + taxPaisa) / 100).toFixed(2);
  },

  getRoundingAdjustment: () => {
    if (get().items.length === 0) return '0.00';
    const unroundedPaisa = Math.round(parseFloat(get().getUnroundedTotal()) * 100);
    const roundedPaisa = Math.round(unroundedPaisa / 100) * 100;
    const diffPaisa = roundedPaisa - unroundedPaisa;
    return (diffPaisa / 100).toFixed(2);
  },

  getGrandTotal: () => {
    if (get().items.length === 0) return '0.00';
    const unroundedPaisa = Math.round(parseFloat(get().getUnroundedTotal()) * 100);
    const roundedPaisa = Math.round(unroundedPaisa / 100) * 100;
    return (roundedPaisa / 100).toFixed(2);
  },
}));
