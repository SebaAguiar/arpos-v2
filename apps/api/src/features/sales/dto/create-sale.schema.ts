import { z } from 'zod';

const SaleItemSchema = z
  .object({
    productId: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    quantity: z.number().int().positive(),
    unit_price_cents: z.number().int().nonnegative(),
    discount_cents: z.number().int().nonnegative().optional(),
  })
  .refine(
    (item) => item.productId !== undefined || item.name !== undefined,
    'Either productId or name is required for a sale item',
  );

const PaymentMethodEnum = z.enum([
  'CASH', 'DEBIT', 'CREDIT', 'TRANSFER', 'MIXED',
  'QR', 'WALLET', 'POINTS',
]);

export const CreateSaleSchema = z.object({
  items: z.array(SaleItemSchema).min(1, 'At least one item is required'),
  total_cents: z.number().int().nonnegative(),
  discount_cents: z.number().int().nonnegative().optional(),
  tax_cents: z.number().int().nonnegative().optional(),
  payment_method: PaymentMethodEnum.transform((v) => v.toLowerCase()),
  payment_details: z.string().optional(),
  contact_id: z.string().optional(),
  notes: z.string().optional(),
  cash_register_id: z.string().optional(),
});

export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;
