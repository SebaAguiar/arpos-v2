import { z } from 'zod';

export const CloseCashRegisterSchema = z.object({
  closing_amount: z.number().int().nonnegative(),
});

export type CloseCashRegisterInput = z.infer<typeof CloseCashRegisterSchema>;
