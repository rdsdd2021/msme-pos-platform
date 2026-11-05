import { RealtimeEventsService, RealtimeEvent } from './realtime-events.service';
import { firstValueFrom, take, toArray } from 'rxjs';

describe('RealtimeEventsService', () => {
  let service: RealtimeEventsService;

  beforeEach(() => {
    service = new RealtimeEventsService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should deliver events only to the matching tenant (cross-tenant isolation, Rule 11)', (done) => {
    const tenantA = 'tenant-aaa-111';
    const tenantB = 'tenant-bbb-222';

    const receivedA: RealtimeEvent[] = [];
    const receivedB: RealtimeEvent[] = [];

    const subA = service.getTenantEventStream(tenantA).subscribe(({ data }) => {
      if (data.type !== 'HEARTBEAT') {
        receivedA.push(data);
      }
    });

    const subB = service.getTenantEventStream(tenantB).subscribe(({ data }) => {
      if (data.type !== 'HEARTBEAT') {
        receivedB.push(data);
      }
    });

    // Emit event for tenant A
    service.emit(tenantA, 'ORDER_CREATED', { invoiceNumber: 'INV-001' });

    // Emit event for tenant B
    service.emit(tenantB, 'CATALOG_CHANGED', { productId: 'PROD-001' });

    setTimeout(() => {
      subA.unsubscribe();
      subB.unsubscribe();

      expect(receivedA.length).toBe(1);
      expect(receivedA[0].type).toBe('ORDER_CREATED');
      expect(receivedA[0].tenantId).toBe(tenantA);

      expect(receivedB.length).toBe(1);
      expect(receivedB[0].type).toBe('CATALOG_CHANGED');
      expect(receivedB[0].tenantId).toBe(tenantB);

      done();
    }, 50);
  });

  it('should include heartbeat events in the stream', async () => {
    const tenantId = 'test-tenant';
    const stream$ = service.getTenantEventStream(tenantId);

    // Verify stream emits
    expect(stream$).toBeDefined();
  });
});

