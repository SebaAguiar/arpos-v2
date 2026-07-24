import { SaleFiltersSchema } from './sale-filters.schema';

describe('SaleFiltersSchema', () => {
  it('should accept empty query (no filters)', () => {
    const result = SaleFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.from).toBeUndefined();
      expect(result.data.to).toBeUndefined();
      expect(result.data.status).toBeUndefined();
    }
  });

  it('should parse numeric string from/to to numbers', () => {
    const result = SaleFiltersSchema.safeParse({ from: '1700000000', to: '1700100000' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.from).toBe(1700000000);
      expect(result.data.to).toBe(1700100000);
    }
  });

  it('should accept status filter', () => {
    const result = SaleFiltersSchema.safeParse({ status: 'completed' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('completed');
    }
  });

  it('should reject non-numeric from', () => {
    const result = SaleFiltersSchema.safeParse({ from: 'abc' });
    expect(result.success).toBe(false);
  });

  it('should reject non-numeric to', () => {
    const result = SaleFiltersSchema.safeParse({ to: 'abc' });
    expect(result.success).toBe(false);
  });
});
