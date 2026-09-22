import { z } from 'zod';

export const CreateVariantSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  size: z.string().optional(),
  color: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  price_cents: z.number().int().nonnegative().optional(),
  cost_cents: z.number().int().nonnegative().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
});

export type CreateVariantInput = z.infer<typeof CreateVariantSchema>;
