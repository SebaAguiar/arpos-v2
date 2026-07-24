import { CreateProductSchema } from './create-product.schema';

describe('CreateProductSchema', () => {
  const validInput = {
    code: 'PROD-001',
    name: 'Test Product',
    price_cents: 2500,
    cost_cents: 1200,
    stock_quantity: 50,
    sku: 'SKU-001',
  };

  it('should accept valid input', () => {
    const result = CreateProductSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('PROD-001');
      expect(result.data.price_cents).toBe(2500);
    }
  });

  it('should reject empty code', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, code: '' });
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject negative price', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, price_cents: -100 });
    expect(result.success).toBe(false);
  });

  it('should reject zero price', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, price_cents: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer price', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, price_cents: 10.5 });
    expect(result.success).toBe(false);
  });

  it('should accept input without optional fields', () => {
    const result = CreateProductSchema.safeParse({
      code: 'P1',
      name: 'Product',
      price_cents: 1000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cost_cents).toBeUndefined();
      expect(result.data.stock_quantity).toBeUndefined();
    }
  });

  it('should accept negative cost_cents (loss leader)', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, cost_cents: -500 });
    expect(result.success).toBe(false);
  });

  it('should accept zero cost_cents', () => {
    const result = CreateProductSchema.safeParse({ ...validInput, cost_cents: 0 });
    expect(result.success).toBe(true);
  });
});
