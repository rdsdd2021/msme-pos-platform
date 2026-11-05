import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable, interval, merge } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export type RealtimeEventType =
  | 'ORDER_CREATED'
  | 'STOCK_CHANGED'
  | 'CATALOG_CHANGED'
  | 'CUSTOMER_UPDATED'
  | 'RESTAURANT_TABLE_CHANGED'
  | 'HEARTBEAT';

export interface RealtimeEvent<T = any> {
  tenantId: string;
  branchId?: string;
  type: RealtimeEventType;
  timestamp: string;
  data?: T;
}

@Injectable()
export class RealtimeEventsService {
  private readonly logger = new Logger(RealtimeEventsService.name);
  private readonly eventSubject = new Subject<RealtimeEvent>();

  /**
   * Broadcast a domain event across the tenant channel.
   */
  emit<T = any>(
    tenantId: string,
    type: RealtimeEventType,
    data?: T,
    branchId?: string,
  ): void {
    const event: RealtimeEvent<T> = {
      tenantId,
      branchId,
      type,
      timestamp: new Date().toISOString(),
      data,
    };
    this.logger.debug(`[RealtimeEvent] [Tenant: ${tenantId}] ${type}`);
    this.eventSubject.next(event);
  }

  /**
   * Get an Observable stream of events strictly filtered for a specific tenant.
   * Includes a periodic 15-second heartbeat ping to keep reverse proxy connections alive.
   */
  getTenantEventStream(tenantId: string): Observable<{ data: RealtimeEvent }> {
    // Filtered domain events stream
    const tenantEvents$ = this.eventSubject.asObservable().pipe(
      filter((e) => e.tenantId === tenantId),
      map((event) => ({ data: event })),
    );

    // Keep-alive heartbeat stream every 15 seconds
    const heartbeat$ = interval(15000).pipe(
      map(() => ({
        data: {
          tenantId,
          type: 'HEARTBEAT' as RealtimeEventType,
          timestamp: new Date().toISOString(),
        },
      })),
    );

    return merge(tenantEvents$, heartbeat$);
  }
}

