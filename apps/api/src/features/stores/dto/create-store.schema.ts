import { z } from 'zod';

export const createStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
