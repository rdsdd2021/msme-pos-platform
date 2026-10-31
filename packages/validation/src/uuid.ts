const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates a UUID v4 string.
 */
export function isValidUuid(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return UUID_REGEX.test(value);
}
