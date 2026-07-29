import { z } from 'zod';

export const CreateOrderItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity_ordered: z.number().int().min(1),
  unit_cost_cents: z.number().int().min(0),
});

export const CreateOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  expected_date: z.number().int().optional(),
  notes: z.string().optional(),
  items: z.array(CreateOrderItemSchema).min(1, 'At least one item is required'),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
