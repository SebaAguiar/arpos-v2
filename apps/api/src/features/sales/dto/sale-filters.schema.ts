import { z } from 'zod';

export const SaleFiltersSchema = z.object({
  from: z.string().regex(/^\d+$/).transform(Number).optional(),
  to: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.string().optional(),
});

export type SaleFiltersInput = z.infer<typeof SaleFiltersSchema>;
