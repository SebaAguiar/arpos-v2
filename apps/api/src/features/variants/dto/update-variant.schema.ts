import { z } from 'zod';

export const UpdateVariantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  price_cents: z.number().int().nonnegative().optional(),
  cost_cents: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateVariantInput = z.infer<typeof UpdateVariantSchema>;
