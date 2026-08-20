import { z } from 'zod';

export const CreateSubscriptionSchema = z.object({
  clientId: z.string().min(1),
  productId: z.string().min(1),
  planId: z.string().min(1),
  status: z.enum(['active', 'paused', 'cancelled', 'expired']).default('active'),
  maxStoresOverride: z.number().int().positive().optional(),
  priceOverrideCents: z.number().int().nonnegative().optional(),
  managedManually: z.boolean().default(false),
  internalNotes: z.string().optional(),
  startDate: z.coerce.date().optional(),
  renewalDate: z.coerce.date().optional(),
});

export type CreateSubscription = z.infer<typeof CreateSubscriptionSchema>;

export const UpdateSubscriptionSchema = CreateSubscriptionSchema.partial();
export type UpdateSubscription = z.infer<typeof UpdateSubscriptionSchema>;

export const SubscriptionParamsSchema = z.object({
  id: z.string().min(1),
});
