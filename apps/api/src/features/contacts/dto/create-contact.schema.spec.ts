import { CreateContactSchema } from './create-contact.schema';

describe('CreateContactSchema', () => {
  it('should accept valid contact with default type', () => {
    const result = CreateContactSchema.safeParse({ name: 'John Doe' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('customer');
    }
  });

  it('should accept supplier type', () => {
    const result = CreateContactSchema.safeParse({ name: 'Acme Corp', type: 'supplier' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('supplier');
    }
  });

  it('should reject empty name', () => {
    const result = CreateContactSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid type', () => {
    const result = CreateContactSchema.safeParse({ name: 'Test', type: 'partner' });
    expect(result.success).toBe(false);
  });

  it('should accept all optional fields', () => {
    const result = CreateContactSchema.safeParse({
      name: 'Full Contact',
      type: 'customer',
      email: 'test@example.com',
      phone: '+5491155551234',
      address: '123 Main St',
      tax_id: '20-12345678-9',
      notes: 'Important client',
    });
    expect(result.success).toBe(true);
  });
});
