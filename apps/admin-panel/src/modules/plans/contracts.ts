import { z } from 'zod';

export const CreatePlanSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  maxStoresDefault: z.number().int().positive().default(1),
  priceDefaultCents: z.number().int().nonnegative().default(0),
  currency: z.string().max(10).default('ARS'),
  features: z.record(z.boolean()).default({}),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type CreatePlan = z.infer<typeof CreatePlanSchema>;

export const UpdatePlanSchema = CreatePlanSchema.partial().omit({ productId: true });
export type UpdatePlan = z.infer<typeof UpdatePlanSchema>;

export const PlanParamsSchema = z.object({
  id: z.string().min(1),
});
