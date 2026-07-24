import { OpenCashRegisterSchema } from './open-cash-register.schema';
import { CloseCashRegisterSchema } from './close-cash-register.schema';

describe('OpenCashRegisterSchema', () => {
  it('should accept valid input', () => {
    const result = OpenCashRegisterSchema.safeParse({ name: 'Main', opening_amount: 10000 });
    expect(result.success).toBe(true);
  });

  it('should accept zero opening_amount', () => {
    const result = OpenCashRegisterSchema.safeParse({ name: 'Main', opening_amount: 0 });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = OpenCashRegisterSchema.safeParse({ name: '', opening_amount: 10000 });
    expect(result.success).toBe(false);
  });

  it('should reject negative opening_amount', () => {
    const result = OpenCashRegisterSchema.safeParse({ name: 'Main', opening_amount: -100 });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer opening_amount', () => {
    const result = OpenCashRegisterSchema.safeParse({ name: 'Main', opening_amount: 10.5 });
    expect(result.success).toBe(false);
  });
});

describe('CloseCashRegisterSchema', () => {
  it('should accept valid input', () => {
    const result = CloseCashRegisterSchema.safeParse({ closing_amount: 15000 });
    expect(result.success).toBe(true);
  });

  it('should accept zero closing_amount', () => {
    const result = CloseCashRegisterSchema.safeParse({ closing_amount: 0 });
    expect(result.success).toBe(true);
  });

  it('should reject negative closing_amount', () => {
    const result = CloseCashRegisterSchema.safeParse({ closing_amount: -500 });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer closing_amount', () => {
    const result = CloseCashRegisterSchema.safeParse({ closing_amount: 10.5 });
    expect(result.success).toBe(false);
  });
});
