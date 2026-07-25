import { z } from 'zod';

export const CreateMovementSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(['entry', 'exit', 'adjustment']),
  quantity: z.number().int(),
  reason: z.string().min(1).max(200),
});

export type CreateMovementInput = z.infer<typeof CreateMovementSchema>;
