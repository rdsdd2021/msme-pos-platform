'use client';

import React, { useState } from 'react';
import { useCartStore, CartItem } from '@/store/cart.store';

// Demo catalog items available for Kirana POS
const CATALOG_ITEMS: Omit<CartItem, 'quantity'>[] = [
  { productId: 'prod-oil-1l', name: 'Fortune Sunflower Oil 1L', sku: 'FORT-SUN-1L', price: '140.00', gstRate: '5.00' },
  { productId: 'prod-rice-5kg', name: 'India Gate Basmati Rice 5kg', sku: 'IG-RICE-5KG', price: '520.00', gstRate: '0.00' },
  { productId: 'prod-salt-1kg', name: 'Tata Salt 1kg', sku: 'TATA-SALT-1KG', price: '28.00', gstRate: '0.00' },
  { productId: 'prod-sugar-1kg', name: 'Madhur Pure Sugar 1kg', sku: 'MADHUR-SUGAR-1KG', price: '48.00', gstRate: '5.00' },
  { productId: 'prod-tea-500g', name: 'Tata Tea Gold 500g', sku: 'TATA-TEA-500G', price: '290.00', gstRate: '5.00' },
];

export default function PosCheckoutScreen() {
  const { items, addItem, removeItem, updateQuantity, clearCart, getSubtotal, getTaxTotal, getGrandTotal } = useCartStore();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = CATALOG_ITEMS.find(
      (item) => item.sku.toLowerCase() === barcodeInput.trim().toLowerCase(),
    );
    if (matched) {
      addItem(matched);
      setBarcodeInput('');
    } else {
      alert(`Barcode/SKU "${barcodeInput}" not found`);
    }
  };

  const handleCheckout = (method: string) => {
    if (items.length === 0) return;
    const invNumber = `INV-${Date.now().toString().slice(-6)}`;
    setPaymentSuccess(`Sale completed via ${method.toUpperCase()}! Invoice: ${invNumber}`);
    clearCart();
  };

  const filteredCatalog = CATALOG_ITEMS.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 text-gray-900">
      {/* Left: Product Grid & Barcode Scanner */}
      <div className="flex-1 p-6 flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Kirana POS Billing</h1>
            <p className="text-sm text-gray-500">Fast barcode scanner wedge & touch checkout</p>
          </div>

          {/* Barcode scanner input (Keyboard-wedge supported) */}
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Scan Barcode / Enter SKU..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Add
            </button>
          </form>
        </header>

        {/* Search Filter */}
        <div>
          <input
            type="text"
            placeholder="Search catalog by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(100vh-220px)]">
          {filteredCatalog.map((product) => (
            <div
              key={product.productId}
              onClick={() => addItem(product)}
              className="border border-gray-200 rounded-xl p-4 bg-white hover:border-blue-500 hover:shadow-sm cursor-pointer transition flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-mono text-gray-400">{product.sku}</span>
                <h3 className="font-semibold text-gray-800 text-base mt-1">{product.name}</h3>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  GST {product.gstRate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Cart & Checkout Summary */}
      <div className="w-full lg:w-96 bg-white border-l border-gray-200 p-6 flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-bold text-gray-900">Current Cart ({items.length})</h2>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:underline font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Success Banner */}
          {paymentSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs font-medium">
              {paymentSuccess}
            </div>
          )}

          {/* Cart Item List */}
          <div className="mt-4 flex flex-col gap-3 max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">Cart is empty. Scan products to bill.</p>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between border-b pb-2">
                  <div className="flex-1 pr-2">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{item.name}</p>
                    <p className="text-xs text-gray-500">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-gray-100 text-gray-700 flex items-center justify-center font-bold hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-gray-100 text-gray-700 flex items-center justify-center font-bold hover:bg-gray-200"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-xs text-red-500 hover:text-red-700 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bill Summary & Payment Buttons */}
        <div className="border-t pt-4 mt-6">
          <div className="flex justify-between text-sm text-gray-600 py-1">
            <span>Subtotal:</span>
            <span>₹{getSubtotal()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 py-1">
            <span>GST Tax:</span>
            <span>₹{getTaxTotal()}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2 mt-2">
            <span>Grand Total:</span>
            <span>₹{getGrandTotal()}</span>
          </div>

          {/* Payment Actions */}
          <div className="grid grid-cols-2 gap-2 mt-6">
            <button
              onClick={() => handleCheckout('cash')}
              disabled={items.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-sm"
            >
              Cash (F1)
            </button>
            <button
              onClick={() => handleCheckout('upi')}
              disabled={items.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-sm"
            >
              UPI (F2)
            </button>
            <button
              onClick={() => handleCheckout('card')}
              disabled={items.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-sm"
            >
              Card (F3)
            </button>
            <button
              onClick={() => handleCheckout('credit')}
              disabled={items.length === 0}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-sm"
            >
              Khata (F4)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

