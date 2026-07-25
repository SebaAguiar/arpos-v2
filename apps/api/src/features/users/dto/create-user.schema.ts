import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'manager', 'cashier']).default('cashier'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
