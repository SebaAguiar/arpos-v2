import { centsToDecimal, decimalToCents, formatCents } from '../cents.transformer';

describe('cents.transformer', () => {
  describe('centsToDecimal', () => {
    it.each([
      [0, 0],
      [100, 1],
      [250, 2.5],
      [999, 9.99],
      [10000, 100],
      [1, 0.01],
    ])('converts %d cents to %d', (cents, expected) => {
      expect(centsToDecimal(cents)).toBe(expected);
    });
  });

  describe('decimalToCents', () => {
    it.each([
      [0, 0],
      [1, 100],
      [2.5, 250],
      [9.99, 999],
      [100, 10000],
      [0.01, 1],
      [10.999, 1100],
      [10.001, 1000],
    ])('converts %d to %d cents', (decimal, expected) => {
      expect(decimalToCents(decimal)).toBe(expected);
    });

    it('returns 0 for NaN', () => {
      expect(decimalToCents(NaN)).toBe(0);
    });

    it('returns 0 for Infinity', () => {
      expect(decimalToCents(Infinity)).toBe(0);
    });
  });

  describe('formatCents', () => {
    it('formats cents as locale string', () => {
      const result = formatCents(2500, 'en-US');
      expect(result).toBe('25.00');
    });
  });
});
