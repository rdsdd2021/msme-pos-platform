export interface HealthResponse {
  status: 'ok' | 'error' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks?: Record<string, string>;
}
