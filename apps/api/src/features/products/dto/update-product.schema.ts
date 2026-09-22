import { z } from 'zod';

export const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price_cents: z.number().int().nonnegative().optional(),
  cost_cents: z.number().int().nonnegative().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  sku: z.string().optional(),
  category_id: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
