import { parseJsonField, stringifyJsonField } from '../json.transformer';

describe('json.transformer', () => {
  describe('parseJsonField', () => {
    it('parses a valid JSON string', () => {
      const result = parseJsonField('{"key": "value", "num": 42}');
      expect(result).toEqual({ key: 'value', num: 42 });
    });

    it('returns null for null input', () => {
      expect(parseJsonField(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(parseJsonField(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseJsonField('')).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      expect(parseJsonField('not-json')).toBeNull();
    });
  });

  describe('stringifyJsonField', () => {
    it('stringifies an object', () => {
      const result = stringifyJsonField({ key: 'value', num: 42 });
      expect(result).toBe('{"key":"value","num":42}');
    });

    it('returns null for null input', () => {
      expect(stringifyJsonField(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(stringifyJsonField(undefined)).toBeNull();
    });

    it('returns null for circular references', () => {
      const obj: Record<string, unknown> = { a: 1 };
      obj.self = obj;
      expect(stringifyJsonField(obj)).toBeNull();
    });
  });
});
