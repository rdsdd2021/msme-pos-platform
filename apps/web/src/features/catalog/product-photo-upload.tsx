'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Upload, Trash2, Image as ImageIcon, RefreshCw, Globe, Search, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface ProductPhotoUploadProps {
  imageUrl?: string | null;
  productName?: string;
  onChange: (imageUrl: string | null) => void;
  disabled?: boolean;
}

interface WebSearchResult {
  title: string;
  subtitle?: string;
  imageUrl: string;
  source: string;
}

const STAPLE_IMAGE_MAP: Record<string, string> = {
  egg: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=480&q=80',
  eggs: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=480&q=80',
  atta: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=480&q=80',
  wheat: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=480&q=80',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=480&q=80',
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=480&q=80',
  butter: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=480&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=480&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=480&q=80',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=480&q=80',
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=480&q=80',
  apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=480&q=80',
  tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=480&q=80',
  soap: 'https://images.unsplash.com/photo-1607006314352-8758832a514e?w=480&q=80',
  oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=480&q=80',
};

const SUGGESTIONS = ['Atta', 'Rice', 'Eggs', 'Milk', 'Butter', 'Maggi', 'Tata Salt', 'Parle-G', 'Tea', 'Soap', 'Oil'];

export function ProductPhotoUpload({
  imageUrl,
  productName = '',
  onChange,
  disabled = false,
}: ProductPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Web search modal state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<WebSearchResult[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<WebSearchResult | null>(null);

  // Compress & resize image client-side using HTML5 Canvas
  const processImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG, JPG, WebP)');
        return;
      }

      setIsProcessing(true);
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDimension = 480;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            onChange(compressedDataUrl);
          }
          setIsProcessing(false);
        };
        img.onerror = () => {
          setIsProcessing(false);
        };
        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Perform Open Food Facts & staples search
  const performWebSearch = async (query: string) => {
    const q = query.trim();
    if (!q) return;

    setIsSearching(true);
    setSelectedPhoto(null);

    const collected: WebSearchResult[] = [];

    // 1. Check curated staples
    const lower = q.toLowerCase();
    for (const [key, url] of Object.entries(STAPLE_IMAGE_MAP)) {
      if (lower.includes(key) || key.includes(lower)) {
        collected.push({
          title: q,
          subtitle: 'Fresh Grocery Staple',
          imageUrl: url,
          source: 'Curated Kirana Staples',
        });
        break;
      }
    }

    // 2. Open Food Facts API
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          q
        )}&search_simple=1&action=process&json=1&page_size=20`,
        {
          headers: {
            'User-Agent': 'KiranaPOS - Web - Version 1.0.0',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products)) {
          for (const item of data.products) {
            const name = item.product_name || item.product_name_en || item.generic_name;
            const brands = item.brands || '';
            const img =
              item.image_front_small_url ||
              item.image_small_url ||
              item.image_front_url ||
              item.image_url;

            if (img && typeof img === 'string' && img.startsWith('http')) {
              collected.push({
                title: name ? String(name).trim() : q,
                subtitle: brands ? String(brands).trim() : 'Packaged Retail',
                imageUrl: img,
                source: 'Open Food Facts',
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('Web photo search error:', err);
    }

    setSearchResults(collected);
    setIsSearching(false);
  };

  // Convert selected remote photo to compressed data URL using HTML5 Canvas
  const handleSelectWebPhoto = async (photo: WebSearchResult) => {
    setIsProcessing(true);
    setSearchModalOpen(false);

    try {
      const response = await fetch(photo.imageUrl, { mode: 'cors' });
      const blob = await response.blob();
      const file = new File([blob], 'web-image.jpg', { type: blob.type || 'image/jpeg' });
      processImageFile(file);
    } catch {
      // Fallback: direct remote URL if CORS blocks canvas read
      onChange(photo.imageUrl);
      setIsProcessing(false);
    }
  };

  const openSearchModal = () => {
    const initialQ = productName.trim() || 'Atta';
    setSearchQuery(initialQ);
    setSearchModalOpen(true);
    performWebSearch(initialQ);
  };

  return (
    <div className="space-y-2" data-testid="product-photo-upload">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleFileChange}
        disabled={disabled || isProcessing}
        data-testid="product-photo-input"
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        disabled={disabled || isProcessing}
        data-testid="product-photo-camera-input"
        className="hidden"
      />

      {imageUrl ? (
        /* Image Preview Box */
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs">
            <img
              src={imageUrl}
              alt="Product preview"
              data-testid="product-photo-preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">Product Photo Added</p>
            <p className="text-[11px] text-slate-500">Optimized for fast offline checkout</p>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || isProcessing}
                onClick={openSearchModal}
                className="h-7 text-[11px] px-2.5 bg-white hover:bg-slate-50 cursor-pointer"
              >
                <Globe className="w-3 h-3 mr-1 text-emerald-600" />
                Search Web
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-[11px] px-2.5 bg-white hover:bg-slate-50 cursor-pointer"
              >
                <Upload className="w-3 h-3 mr-1 text-slate-500" />
                Change
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || isProcessing}
                onClick={() => cameraInputRef.current?.click()}
                className="h-7 text-[11px] px-2.5 bg-white hover:bg-slate-50 cursor-pointer"
              >
                <Camera className="w-3 h-3 mr-1 text-slate-500" />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || isProcessing}
                onClick={() => onChange(null)}
                data-testid="product-photo-remove-btn"
                className="h-7 text-[11px] px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Drop Zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-3.5 text-center transition flex flex-col items-center justify-center gap-1.5 ${
            dragOver ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-slate-50/70'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2 py-2 text-slate-600 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Optimizing image...</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-500">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">Add Product Photo</p>
                <p className="text-[11px] text-slate-500">
                  Search online, snap a photo, or upload from device
                </p>
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={openSearchModal}
                  className="h-7 text-xs px-2.5 bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 cursor-pointer font-semibold"
                >
                  <Globe className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Search from Internet
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-7 text-xs px-2.5 bg-white hover:bg-slate-100 cursor-pointer font-medium"
                >
                  <Camera className="w-3.5 h-3.5 mr-1 text-slate-600" />
                  Take Photo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 text-xs px-2.5 bg-white hover:bg-slate-100 cursor-pointer font-medium"
                >
                  <Upload className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Choose File
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Web Image Search Modal */}
      <Dialog open={searchModalOpen} onOpenChange={setSearchModalOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 bg-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-white">
                    Search Photos from Internet
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    Search millions of FMCG products and curated grocery imagery
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 space-y-3">
            {/* Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search product (e.g. Atta, Maggi, Tata Salt)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      performWebSearch(searchQuery);
                    }
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => performWebSearch(searchQuery)}
                disabled={isSearching}
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 font-semibold"
              >
                {isSearching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag);
                    performWebSearch(tag);
                  }}
                  className="px-2.5 py-0.5 text-[11px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap cursor-pointer transition font-medium border border-slate-200"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Results Grid */}
            <div className="h-72 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              {isSearching ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
                  <span className="text-xs">Searching online databases...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                  <Search className="h-8 w-8 text-slate-300" />
                  <span className="text-xs font-medium">No images found. Try another brand or generic term.</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {searchResults.map((item, idx) => {
                    const isSelected = selectedPhoto?.imageUrl === item.imageUrl;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedPhoto(item)}
                        className={`group relative bg-white border rounded-lg overflow-hidden cursor-pointer transition p-1 flex flex-col justify-between ${
                          isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <div className="w-full h-24 rounded bg-slate-100 overflow-hidden relative">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            crossOrigin="anonymous"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <div className="mt-1 px-0.5">
                          <p className="text-[11px] font-bold text-slate-800 truncate" title={item.title}>
                            {item.title}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate">{item.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with Selection Confirmation */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                {selectedPhoto ? selectedPhoto.title : 'Select a photo from the grid'}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchModalOpen(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedPhoto}
                  onClick={() => selectedPhoto && handleSelectWebPhoto(selectedPhoto)}
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4"
                >
                  Use This Photo
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
