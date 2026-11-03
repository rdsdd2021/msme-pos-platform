export interface SyncOperationPayload {
  operationId: string;
  deviceId: string;
  sequence: number;
  operationType: string;
  schemaVersion: number;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface SyncPushBatchRequest {
  deviceId: string;
  operations: SyncOperationPayload[];
}

export interface SyncOperationAck {
  operationId: string;
  status: 'accepted' | 'rejected' | 'already_processed';
  serverEntityId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface SyncPushResponse {
  results: SyncOperationAck[];
  processedCount: number;
}

export interface SyncPullDeltaResponse<T = Record<string, unknown>> {
  cursor: string;
  hasMore: boolean;
  categories: T[];
  products: T[];
  customers?: T[];
}

export interface DeviceInvoiceRangeAllocation {
  id: string;
  tenantId: string;
  branchId: string;
  deviceId: string;
  seriesPrefix: string;
  startNumber: number;
  endNumber: number;
  nextNumber: number;
  isExhausted: boolean;
}

