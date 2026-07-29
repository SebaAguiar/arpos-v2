import { z } from 'zod';

export const UpdateOrderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity_ordered: z.number().int().min(1),
  unit_cost_cents: z.number().int().min(0),
});

export const UpdateOrderSchema = z.object({
  supplierId: z.string().min(1).optional(),
  status: z.enum(['draft', 'ordered', 'partial', 'received', 'cancelled']).optional(),
  expected_date: z.number().int().optional(),
  notes: z.string().optional(),
  items: z.array(UpdateOrderItemSchema).optional(),
});

export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
