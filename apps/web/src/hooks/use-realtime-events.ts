'use client';

import { useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export type RealtimeEventType =
  | 'ORDER_CREATED'
  | 'STOCK_CHANGED'
  | 'CATALOG_CHANGED'
  | 'CUSTOMER_UPDATED'
  | 'RESTAURANT_TABLE_CHANGED'
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
  /** Silent periodic polling fallback interval in ms (default: 30000ms) */
  pollIntervalMs?: number;
  onPoll?: () => void;
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
  pollIntervalMs = 30000,
  onPoll,
}: UseRealtimeEventsOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onPollRef = useRef(onPoll);
  const callbacksRef = useRef({
    onEvent,
    onOrderCreated,
    onStockChanged,
    onCatalogChanged,
    onCustomerUpdated,
    onRestaurantTableChanged,
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
    };
  });

  const connect = useCallback(() => {
    if (!enabled || !tenantId || typeof window === 'undefined') return;

    const token = apiClient.getAccessToken();
    if (!token) return;

    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const baseUrl = apiClient.getBaseUrl();
    const url = `${baseUrl}/tenants/${tenantId}/events?token=${encodeURIComponent(token)}`;

    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

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
          }
        } catch {
          // ignore non-json messages
        }
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        // Exponential backoff reconnect
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };
    } catch {
      // EventSource instantiation failed
    }
  }, [enabled, tenantId]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  // Periodic polling fallback
  useEffect(() => {
    if (!enabled || !tenantId || pollIntervalMs <= 0) return;

    const interval = setInterval(() => {
      onPollRef.current?.();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [enabled, tenantId, pollIntervalMs]);
}

