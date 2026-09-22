import { z } from 'zod';

export const CreateProductSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price_cents: z.number().int().nonnegative().optional(),
  cost_cents: z.number().int().nonnegative().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  sku: z.string().optional(),
  category_id: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
