import { z } from 'zod';

export const ListMovementsSchema = z.object({
  productId: z.string().optional(),
  type: z.enum(['sale', 'entry', 'exit', 'adjustment']).optional(),
  from: z.coerce.number().int().optional(),
  to: z.coerce.number().int().optional(),
});

export type ListMovementsInput = z.infer<typeof ListMovementsSchema>;
