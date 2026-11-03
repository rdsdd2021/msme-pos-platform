'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, Trash2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ProductPhotoUploadProps {
  imageUrl?: string | null;
  onChange: (imageUrl: string | null) => void;
  disabled?: boolean;
}

export function ProductPhotoUpload({
  imageUrl,
  onChange,
  disabled = false,
}: ProductPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
            // Export compressed JPEG at 0.82 quality
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

            <div className="flex items-center gap-2 mt-1.5">
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
                  Take a photo or upload from device gallery
                </p>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-7 text-xs px-2.5 bg-white hover:bg-slate-100 cursor-pointer font-medium"
                >
                  <Camera className="w-3.5 h-3.5 mr-1 text-emerald-600" />
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
    </div>
  );
}
