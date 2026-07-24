import { CreateSaleSchema } from './create-sale.schema';

describe('CreateSaleSchema', () => {
  const validInput = {
    items: [
      { productId: 'prod-1', quantity: 2, unit_price_cents: 1500 },
      { productId: 'prod-2', quantity: 1, unit_price_cents: 3000, discount_cents: 500 },
    ],
    total_cents: 5500,
    discount_cents: 500,
    tax_cents: 825,
    payment_method: 'CASH',
    payment_details: 'Paid in full',
    notes: 'Customer requested gift wrap',
  };

  it('should accept valid input', () => {
    const result = CreateSaleSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(2);
      expect(result.data.payment_method).toBe('cash');
      expect(result.data.discount_cents).toBe(500);
    }
  });

  it('should transform payment_method to lowercase', () => {
    const result = CreateSaleSchema.safeParse({ ...validInput, payment_method: 'DEBIT' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.payment_method).toBe('debit');
    }
  });

  it('should accept all valid payment methods', () => {
    const methods = ['CASH', 'DEBIT', 'CREDIT', 'TRANSFER', 'MIXED', 'QR', 'WALLET', 'POINTS'];
    for (const method of methods) {
      const result = CreateSaleSchema.safeParse({ ...validInput, payment_method: method });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid payment method', () => {
    const result = CreateSaleSchema.safeParse({ ...validInput, payment_method: 'BITCOIN' });
    expect(result.success).toBe(false);
  });

  it('should reject empty items array', () => {
    const result = CreateSaleSchema.safeParse({ ...validInput, items: [] });
    expect(result.success).toBe(false);
  });

  it('should reject item with empty productId', () => {
    const result = CreateSaleSchema.safeParse({
      ...validInput,
      items: [{ productId: '', quantity: 1, unit_price_cents: 1000 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject item with negative quantity', () => {
    const result = CreateSaleSchema.safeParse({
      ...validInput,
      items: [{ productId: 'p1', quantity: -1, unit_price_cents: 1000 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject item with zero quantity', () => {
    const result = CreateSaleSchema.safeParse({
      ...validInput,
      items: [{ productId: 'p1', quantity: 0, unit_price_cents: 1000 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject item with non-integer quantity', () => {
    const result = CreateSaleSchema.safeParse({
      ...validInput,
      items: [{ productId: 'p1', quantity: 1.5, unit_price_cents: 1000 }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative total_cents', () => {
    const result = CreateSaleSchema.safeParse({ ...validInput, total_cents: -100 });
    expect(result.success).toBe(false);
  });

  it('should accept input without optional fields', () => {
    const result = CreateSaleSchema.safeParse({
      items: [{ productId: 'p1', quantity: 1, unit_price_cents: 1000 }],
      total_cents: 1000,
      payment_method: 'CASH',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discount_cents).toBeUndefined();
      expect(result.data.tax_cents).toBeUndefined();
      expect(result.data.contact_id).toBeUndefined();
    }
  });

  it('should reject missing items', () => {
    const result = CreateSaleSchema.safeParse({
      total_cents: 1000,
      payment_method: 'CASH',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing payment_method', () => {
    const result = CreateSaleSchema.safeParse({
      items: [{ productId: 'p1', quantity: 1, unit_price_cents: 1000 }],
      total_cents: 1000,
    });
    expect(result.success).toBe(false);
  });
});
