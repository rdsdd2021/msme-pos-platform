/**
 * ISO-8601 UTC timestamp string
 */
export type IsoTimestamp = string;

/**
 * UUID string
 */
export type Uuid = string;

/**
 * Monetary amount represented as a decimal string to avoid floating-point errors.
 * e.g. "125.50"
 */
export type MoneyString = string;

/**
 * Standard API error response shape
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string;
}

/**
 * Standard paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
}

/**
 * Standard cursor-based paginated response wrapper
 */
export interface CursorPaginatedResponse<T> {
  data: T[];
  next_cursor?: string;
  has_next: boolean;
}
