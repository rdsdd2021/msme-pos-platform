'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, RefreshCw, Volume2, VolumeX, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CameraBarcodeModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  description?: string;
}

export function CameraBarcodeModal({
  open,
  onClose,
  onScan,
  title = 'Scan Barcode via Camera',
  description = 'Point your device camera at the item barcode to scan it instantly.',
}: CameraBarcodeModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [simulatedBarcode, setSimulatedBarcode] = useState('');
  const animationFrameId = useRef<number | null>(null);

  // Play a crisp confirmation chime using Web Audio API
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  // Handle successful barcode recognition
  const handleBarcodeDetected = useCallback(
    (code: string) => {
      const clean = code.trim();
      if (!clean) return;
      playBeep();
      onScan(clean);
      onClose();
    },
    [onScan, onClose, playBeep]
  );

  // Start device camera
  useEffect(() => {
    if (!open) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      setIsScanning(false);
      return;
    }

    let activeStream: MediaStream | null = null;
    let isCancelled = false;

    async function startCamera() {
      setErrorMessage(null);
      setHasCamera(null);

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setHasCamera(false);
        setErrorMessage('Camera access is not supported by this browser.');
        return;
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (isCancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        activeStream = mediaStream;
        setStream(mediaStream);
        setHasCamera(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        if (isCancelled) return;
        setHasCamera(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage('Camera permission was denied. Please allow camera access in browser permissions.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMessage('No camera found on this device.');
        } else {
          setErrorMessage(err.message || 'Unable to access camera.');
        }
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [open, facingMode]);

  // Barcode detection loop using browser native BarcodeDetector if available
  useEffect(() => {
    if (!open || !hasCamera || !videoRef.current) return;

    let detector: any = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        detector = new (window as any).BarcodeDetector({
          formats: [
            'ean_13',
            'ean_8',
            'upc_a',
            'upc_e',
            'code_128',
            'code_39',
            'code_93',
            'qr_code',
          ],
        });
      } catch {
        detector = null;
      }
    }

    let isScanningActive = true;
    setIsScanning(true);

    async function scanFrame() {
      if (!isScanningActive || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState >= 2 && detector) {
        try {
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0 && isScanningActive) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              isScanningActive = false;
              handleBarcodeDetected(rawValue);
              return;
            }
          }
        } catch {
          // Frame dropped, continue scanning
        }
      }

      if (isScanningActive) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanningActive = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [open, hasCamera, handleBarcodeDetected]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      data-testid="camera-barcode-modal"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">{title}</h3>
              <p className="text-[11px] text-slate-400">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              title={soundEnabled ? 'Mute Scan Sound' : 'Enable Scan Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              data-testid="camera-barcode-close-btn"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-video sm:aspect-4/3 w-full bg-black flex items-center justify-center overflow-hidden">
          {hasCamera === true && (
            <video
              ref={videoRef}
              data-testid="camera-barcode-video"
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
          )}

          {/* Aim / Viewfinder overlay */}
          {hasCamera === true && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="relative w-64 h-40 border-2 border-emerald-400/70 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center">
                {/* Corner reticles */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400 -mt-0.5 -ml-0.5" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400 -mt-0.5 -mr-0.5" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400 -mb-0.5 -ml-0.5" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400 -mb-0.5 -mr-0.5" />

                {/* Animated scanning laser line */}
                <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              </div>
            </div>
          )}

          {/* Loading state */}
          {hasCamera === null && (
            <div className="flex flex-col items-center gap-2 text-slate-400 p-6 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-xs">Initializing device camera...</span>
            </div>
          )}

          {/* Error / No camera state */}
          {hasCamera === false && (
            <div className="flex flex-col items-center gap-2 text-rose-400 p-6 text-center max-w-sm">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <span className="text-xs font-semibold">{errorMessage || 'Camera unavailable'}</span>
              <span className="text-[11px] text-slate-400 mt-1">
                You can still enter or test barcode manually below.
              </span>
            </div>
          )}
        </div>

        {/* Footer controls & fallback test simulator */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
              }
              className="text-xs bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Flip Camera ({facingMode === 'environment' ? 'Rear' : 'Front'})
            </Button>

            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {isScanning ? 'Scanner Active' : 'Standby'}
            </span>
          </div>

          {/* Fallback / Manual barcode input simulation */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
            <input
              type="text"
              placeholder="Or test / enter barcode..."
              value={simulatedBarcode}
              onChange={(e) => setSimulatedBarcode(e.target.value)}
              data-testid="camera-barcode-simulate-input"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (simulatedBarcode.trim()) {
                    handleBarcodeDetected(simulatedBarcode.trim());
                  }
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              data-testid="camera-barcode-simulate-btn"
              disabled={!simulatedBarcode.trim()}
              onClick={() => {
                if (simulatedBarcode.trim()) {
                  handleBarcodeDetected(simulatedBarcode.trim());
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 cursor-pointer shrink-0"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
