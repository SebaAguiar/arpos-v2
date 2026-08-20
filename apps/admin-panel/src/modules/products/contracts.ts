import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['saas', 'custom', 'internal']).default('saas'),
  clientId: z.string().optional(),
});

export type CreateProduct = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;

export const ProductParamsSchema = z.object({
  id: z.string().min(1),
});
