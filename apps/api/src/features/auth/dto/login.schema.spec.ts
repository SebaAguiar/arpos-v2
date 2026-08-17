import { LoginSchema } from './login.schema';

describe('LoginSchema', () => {
  it('should accept valid login input', () => {
    const result = LoginSchema.safeParse({
      email: 'admin@arcom.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = LoginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty email', () => {
    const result = LoginSchema.safeParse({
      email: '',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const result = LoginSchema.safeParse({
      email: 'admin@arcom.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing password', () => {
    const result = LoginSchema.safeParse({
      email: 'admin@arcom.com',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing email', () => {
    const result = LoginSchema.safeParse({
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });
});
