import { z } from 'zod';

export const CreateCashMovementSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount_cents: z.number().int().positive(),
  description: z.string().min(1).max(200),
});

export type CreateCashMovementInput = z.infer<typeof CreateCashMovementSchema>;
