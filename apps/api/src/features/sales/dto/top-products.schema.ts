import { z } from 'zod';

export const TopProductsSchema = z.object({
  from: z.string().regex(/^\d+$/).transform(Number).optional(),
  to: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type TopProductsInput = z.infer<typeof TopProductsSchema>;
