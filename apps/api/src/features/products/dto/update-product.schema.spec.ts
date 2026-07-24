import { UpdateProductSchema } from './update-product.schema';

describe('UpdateProductSchema', () => {
  it('should accept partial update with name only', () => {
    const result = UpdateProductSchema.safeParse({ name: 'New Name' });
    expect(result.success).toBe(true);
  });

  it('should accept partial update with price_cents only', () => {
    const result = UpdateProductSchema.safeParse({ price_cents: 3000 });
    expect(result.success).toBe(true);
  });

  it('should accept empty object (no-op update)', () => {
    const result = UpdateProductSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept all fields', () => {
    const result = UpdateProductSchema.safeParse({
      name: 'Widget Pro',
      description: 'Updated desc',
      price_cents: 5000,
      cost_cents: 2000,
      sku: 'SKU-999',
      category_id: 'cat-1',
      is_active: false,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = UpdateProductSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject negative price', () => {
    const result = UpdateProductSchema.safeParse({ price_cents: -100 });
    expect(result.success).toBe(false);
  });

  it('should reject negative cost', () => {
    const result = UpdateProductSchema.safeParse({ cost_cents: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject non-boolean is_active', () => {
    const result = UpdateProductSchema.safeParse({ is_active: 'yes' });
    expect(result.success).toBe(false);
  });
});
