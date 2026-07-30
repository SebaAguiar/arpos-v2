import { now, toDate, toTimestamp, fromISOString } from '../timestamp.transformer';

describe('timestamp.transformer', () => {
  describe('now', () => {
    it('returns a Unix timestamp in seconds', () => {
      const result = now();
      expect(result).toBeGreaterThan(1_700_000_000);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('toDate', () => {
    it('converts Unix timestamp to Date', () => {
      const date = toDate(1_700_000_000);
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBe(1_700_000_000 * 1000);
    });
  });

  describe('toTimestamp', () => {
    it('converts Date to Unix timestamp', () => {
      const date = new Date(1_700_000_000 * 1000);
      expect(toTimestamp(date)).toBe(1_700_000_000);
    });
  });

  describe('fromISOString', () => {
    it('parses ISO string to Unix timestamp', () => {
      const result = fromISOString('2024-01-15T00:00:00.000Z');
      expect(result).toBe(1_705_276_800);
    });
  });
});
