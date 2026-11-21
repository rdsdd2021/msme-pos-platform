'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export type RealtimeEventType =
  | 'ORDER_CREATED'
  | 'STOCK_CHANGED'
  | 'CATALOG_CHANGED'
  | 'CUSTOMER_UPDATED'
  | 'RESTAURANT_TABLE_CHANGED'
  | 'KOT_CREATED'
  | 'KOT_STATUS_CHANGED'
  | 'RESTAURANT_SETTINGS_CHANGED'
  | 'HEARTBEAT';

export interface RealtimeEventPayload {
  tenantId: string;
  branchId?: string;
  type: RealtimeEventType;
  timestamp: string;
  data?: any;
}

export interface UseRealtimeEventsOptions {
  tenantId?: string | null;
  enabled?: boolean;
  onEvent?: (event: RealtimeEventPayload) => void;
  onOrderCreated?: (data: any) => void;
  onStockChanged?: (data: any) => void;
  onCatalogChanged?: (data: any) => void;
  onCustomerUpdated?: (data: any) => void;
  onRestaurantTableChanged?: (data: any) => void;
  onKotCreated?: (data: any) => void;
  onKotStatusChanged?: (data: any) => void;
  onRestaurantSettingsChanged?: (data: any) => void;
  /** Silent periodic polling fallback interval in ms (default: 30000ms) */
  pollIntervalMs?: number;
  onPoll?: () => void;
}

/**
 * Synthesizes a pleasant dual-tone kitchen order chime (D5 -> A5)
 * using the native browser Web Audio API without requiring external audio files.
 */
export function playKitchenChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // First tone (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Second tone (880 Hz - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.6);
  } catch {
    // Silently continue if audio context is blocked by user gesture policy
  }
}

export function useRealtimeEvents({
  tenantId,
  enabled = true,
  onEvent,
  onOrderCreated,
  onStockChanged,
  onCatalogChanged,
  onCustomerUpdated,
  onRestaurantTableChanged,
  onKotCreated,
  onKotStatusChanged,
  onRestaurantSettingsChanged,
  pollIntervalMs = 30000,
  onPoll,
}: UseRealtimeEventsOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDestroyedRef = useRef(false);
  const onPollRef = useRef(onPoll);
  const callbacksRef = useRef({
    onEvent,
    onOrderCreated,
    onStockChanged,
    onCatalogChanged,
    onCustomerUpdated,
    onRestaurantTableChanged,
    onKotCreated,
    onKotStatusChanged,
    onRestaurantSettingsChanged,
  });

  // Keep latest callbacks in ref without triggering reconnection loops
  useEffect(() => {
    onPollRef.current = onPoll;
    callbacksRef.current = {
      onEvent,
      onOrderCreated,
      onStockChanged,
      onCatalogChanged,
      onCustomerUpdated,
      onRestaurantTableChanged,
      onKotCreated,
      onKotStatusChanged,
      onRestaurantSettingsChanged,
    };
  });

  const connect = useCallback(() => {
    if (isDestroyedRef.current || !enabled || !tenantId || typeof window === 'undefined') {
      return;
    }

    const token = typeof apiClient?.getAccessToken === 'function' ? apiClient.getAccessToken() : null;
    if (!token) {
      // If auth is still hydrating, retry in 1000ms until token is available
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isDestroyedRef.current) connect();
      }, 1000);
      return;
    }

    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const baseUrl = typeof apiClient?.getBaseUrl === 'function' ? apiClient.getBaseUrl() : '';
    const url = `${baseUrl}/tenants/${tenantId}/events?token=${encodeURIComponent(token)}`;

    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isDestroyedRef.current) {
          setIsConnected(true);
        }
      };

      es.onmessage = (message) => {
        try {
          const payload: RealtimeEventPayload = JSON.parse(message.data);
          if (payload.type === 'HEARTBEAT') return;

          const cb = callbacksRef.current;
          cb.onEvent?.(payload);

          switch (payload.type) {
            case 'ORDER_CREATED':
              cb.onOrderCreated?.(payload.data);
              break;
            case 'STOCK_CHANGED':
              cb.onStockChanged?.(payload.data);
              break;
            case 'CATALOG_CHANGED':
              cb.onCatalogChanged?.(payload.data);
              break;
            case 'CUSTOMER_UPDATED':
              cb.onCustomerUpdated?.(payload.data);
              break;
            case 'RESTAURANT_TABLE_CHANGED':
              cb.onRestaurantTableChanged?.(payload.data);
              break;
            case 'KOT_CREATED':
              cb.onKotCreated?.(payload.data);
              break;
            case 'KOT_STATUS_CHANGED':
              cb.onKotStatusChanged?.(payload.data);
              break;
            case 'RESTAURANT_SETTINGS_CHANGED':
              cb.onRestaurantSettingsChanged?.(payload.data);
              break;
          }
        } catch {
          // ignore non-json messages
        }
      };

      es.onerror = async () => {
        if (!isDestroyedRef.current) {
          setIsConnected(false);
        }
        es.close();
        eventSourceRef.current = null;

        // In case 401 token expiry caused the disconnect, attempt silent refresh before reconnecting
        try {
          if (typeof apiClient?.handleTokenRefresh === 'function') {
            await apiClient.handleTokenRefresh();
          }
        } catch {
          // ignore refresh error, reconnect timer will retry
        }

        // Schedule resilient reconnection
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!isDestroyedRef.current) {
            connect();
          }
        }, 3000);
      };
    } catch {
      // EventSource instantiation failed - schedule retry
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isDestroyedRef.current) {
          connect();
        }
      }, 5000);
    }
  }, [enabled, tenantId]);

  useEffect(() => {
    isDestroyedRef.current = false;

    // Immediately connect
    connect();

    // Listen to token arrival or refresh so SSE connects the instant auth succeeds
    const unsubscribeToken = typeof apiClient?.onTokenChange === 'function'
      ? apiClient.onTokenChange((newToken) => {
          if (newToken && !isDestroyedRef.current) {
            connect();
          }
        })
      : undefined;

    return () => {
      isDestroyedRef.current = true;
      if (unsubscribeToken) unsubscribeToken();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsConnected(false);
    };
  }, [connect]);

  // Periodic polling fallback ensuring data is never stale even during temporary network drops
  useEffect(() => {
    if (!enabled || !tenantId || pollIntervalMs <= 0) return;

    const interval = setInterval(() => {
      onPollRef.current?.();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [enabled, tenantId, pollIntervalMs]);

  return { isConnected };
}


