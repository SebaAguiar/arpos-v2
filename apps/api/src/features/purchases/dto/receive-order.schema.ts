import { z } from 'zod';

export const ReceiveItemSchema = z.object({
  itemId: z.string().min(1),
  quantity_received: z.number().int().min(1),
});

export const ReceiveOrderSchema = z.object({
  orderId: z.string().min(1),
  receipt_number: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(ReceiveItemSchema).min(1, 'At least one item is required'),
});

export type ReceiveOrderInput = z.infer<typeof ReceiveOrderSchema>;
