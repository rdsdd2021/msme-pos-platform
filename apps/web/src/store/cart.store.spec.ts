import { useCartStore } from './cart.store';

describe('useCartStore — Section 170 CGST Rounding & Financial Totals', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('returns zeros when cart is empty', () => {
    const { getSubtotal, getDiscountTotal, getTaxTotal, getUnroundedTotal, getRoundingAdjustment, getGrandTotal } =
      useCartStore.getState();

    expect(getSubtotal()).toBe('0.00');
    expect(getDiscountTotal()).toBe('0.00');
    expect(getTaxTotal()).toBe('0.00');
    expect(getUnroundedTotal()).toBe('0.00');
    expect(getRoundingAdjustment()).toBe('0.00');
    expect(getGrandTotal()).toBe('0.00');
  });

  it('rounds grand total up to nearest rupee when fraction >= ₹0.50 (e.g. ₹1019.55 -> ₹1020.00 with +0.45 adjustment)', () => {
    const { addItem } = useCartStore.getState();

    // Adding item: price 971.00, quantity 1, 5% GST
    // Taxable = 971.00
    // 5% GST split: 2.5% CGST = 24.28, 2.5% SGST = 24.28 -> total tax = 48.56 or 48.55
    // Let's create an item with price 971.00 and gstRate 5.00
    addItem({
      productId: 'prod-oil-1',
      name: 'Sunflower Oil 15L Tin',
      sku: 'OIL-TIN-15L',
      price: '971.00',
      gstRate: '5.00',
    });

    const state = useCartStore.getState();
    const unrounded = parseFloat(state.getUnroundedTotal());
    const roundingAdj = parseFloat(state.getRoundingAdjustment());
    const grandTotal = parseFloat(state.getGrandTotal());

    expect(unrounded).toBeCloseTo(1019.55, 1);
    expect(grandTotal).toBe(1020.00);
    expect(roundingAdj).toBeCloseTo(0.45, 1);
    expect(Math.round((unrounded + roundingAdj) * 100) / 100).toBe(grandTotal);
  });

  it('rounds grand total down to nearest rupee when fraction < ₹0.50 (e.g. ₹1019.40 -> ₹1019.00 with -0.40 adjustment)', () => {
    const { addItem } = useCartStore.getState();

    // Base price 1019.40 with 0% GST
    addItem({
      productId: 'prod-grain-1',
      name: 'Fresh Grain Sack',
      sku: 'GRAIN-SACK',
      price: '1019.40',
      gstRate: '0.00',
    });

    const state = useCartStore.getState();
    expect(state.getUnroundedTotal()).toBe('1019.40');
    expect(state.getRoundingAdjustment()).toBe('-0.40');
    expect(state.getGrandTotal()).toBe('1019.00');
  });

  it('preserves exact whole numbers without rounding difference', () => {
    const { addItem } = useCartStore.getState();

    addItem({
      productId: 'prod-whole',
      name: 'Packaged Tea',
      sku: 'TEA-PKG',
      price: '250.00',
      gstRate: '0.00',
    });

    const state = useCartStore.getState();
    expect(state.getUnroundedTotal()).toBe('250.00');
    expect(state.getRoundingAdjustment()).toBe('0.00');
    expect(state.getGrandTotal()).toBe('250.00');
  });
});

