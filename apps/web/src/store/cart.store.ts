import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: string; // Decimal string (e.g. "140.00")
  quantity: number;
  gstRate: string; // Decimal string (e.g. "5.00")
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => string;
  getTaxTotal: () => string;
  getGrandTotal: () => string;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item, quantity = 1) => {
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
        items: [...state.items, { ...item, quantity }],
      };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i,
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

  getTaxTotal: () => {
    const taxPaisa = get().items.reduce((acc, item) => {
      const pricePaisa = Math.round(parseFloat(item.price) * 100);
      const itemTaxPaisa = Math.round((pricePaisa * item.quantity * parseFloat(item.gstRate)) / 100);
      return acc + itemTaxPaisa;
    }, 0);
    return (taxPaisa / 100).toFixed(2);
  },

  getGrandTotal: () => {
    const subtotalPaisa = Math.round(parseFloat(get().getSubtotal()) * 100);
    const taxPaisa = Math.round(parseFloat(get().getTaxTotal()) * 100);
    return ((subtotalPaisa + taxPaisa) / 100).toFixed(2);
  },
}));

