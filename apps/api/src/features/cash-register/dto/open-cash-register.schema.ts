import { z } from 'zod';

export const OpenCashRegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  opening_amount: z.number().int().nonnegative(),
});

export type OpenCashRegisterInput = z.infer<typeof OpenCashRegisterSchema>;
