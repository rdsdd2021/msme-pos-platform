import { isValidMoneyString, moneyStringToPaisa, paisaToMoneyString } from './money';

describe('isValidMoneyString', () => {
  it('accepts valid money strings', () => {
    expect(isValidMoneyString('0.00')).toBe(true);
    expect(isValidMoneyString('125.50')).toBe(true);
    expect(isValidMoneyString('1000')).toBe(true);
    expect(isValidMoneyString('9999.99')).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isValidMoneyString('-1.00')).toBe(false);
    expect(isValidMoneyString('abc')).toBe(false);
    expect(isValidMoneyString(125.5)).toBe(false);
    expect(isValidMoneyString(null)).toBe(false);
    expect(isValidMoneyString('')).toBe(false);
  });
});

describe('moneyStringToPaisa', () => {
  it('converts correctly', () => {
    expect(moneyStringToPaisa('1.00')).toBe(100);
    expect(moneyStringToPaisa('125.50')).toBe(12550);
    expect(moneyStringToPaisa('0.01')).toBe(1);
    expect(moneyStringToPaisa('1000')).toBe(100000);
  });

  it('throws on invalid input', () => {
    expect(() => moneyStringToPaisa('-5.00')).toThrow();
    expect(() => moneyStringToPaisa('abc')).toThrow();
  });
});

describe('paisaToMoneyString', () => {
  it('converts correctly', () => {
    expect(paisaToMoneyString(100)).toBe('1.00');
    expect(paisaToMoneyString(12550)).toBe('125.50');
    expect(paisaToMoneyString(1)).toBe('0.01');
    expect(paisaToMoneyString(100000)).toBe('1000.00');
  });

  it('throws on invalid input', () => {
    expect(() => paisaToMoneyString(-1)).toThrow();
    expect(() => paisaToMoneyString(1.5)).toThrow();
  });
});
