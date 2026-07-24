import { UpdateContactSchema } from './update-contact.schema';

describe('UpdateContactSchema', () => {
  it('should accept partial update with name only', () => {
    const result = UpdateContactSchema.safeParse({ name: 'New Name' });
    expect(result.success).toBe(true);
  });

  it('should accept empty object (no-op update)', () => {
    const result = UpdateContactSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept all fields', () => {
    const result = UpdateContactSchema.safeParse({
      type: 'supplier',
      name: 'Acme Corp',
      email: 'info@acme.com',
      phone: '+5491155551234',
      address: '123 Main St',
      tax_id: '20-12345678-9',
      notes: 'Updated notes',
      is_active: false,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = UpdateContactSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid type', () => {
    const result = UpdateContactSchema.safeParse({ type: 'partner' });
    expect(result.success).toBe(false);
  });

  it('should accept valid type values', () => {
    expect(UpdateContactSchema.safeParse({ type: 'customer' }).success).toBe(true);
    expect(UpdateContactSchema.safeParse({ type: 'supplier' }).success).toBe(true);
  });
});
