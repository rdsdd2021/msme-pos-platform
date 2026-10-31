/**
 * Validates a monetary string value.
 * Money is always represented as a decimal string (e.g., "125.50") to avoid
 * floating-point errors. Never use float/double for monetary values.
 */
export function isValidMoneyString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^\d+(\.\d{1,4})?$/.test(value) && parseFloat(value) >= 0;
}

/**
 * Parses a money string to an integer representing paisa (smallest INR unit).
 * Use this for arithmetic to avoid floating-point issues.
 */
export function moneyStringToPaisa(value: string): number {
  if (!isValidMoneyString(value)) {
    throw new Error(`Invalid money string: ${value}`);
  }
  const [rupees, paise = '00'] = value.split('.');
  const paisaStr = paise.padEnd(2, '0').slice(0, 2);
  return parseInt(rupees ?? '0', 10) * 100 + parseInt(paisaStr, 10);
}

/**
 * Converts paisa integer back to a money string with 2 decimal places.
 */
export function paisaToMoneyString(paisa: number): string {
  if (!Number.isInteger(paisa) || paisa < 0) {
    throw new Error(`Invalid paisa value: ${paisa}`);
  }
  const rupees = Math.floor(paisa / 100);
  const paisaRemainder = paisa % 100;
  return `${rupees}.${String(paisaRemainder).padStart(2, '0')}`;
}
