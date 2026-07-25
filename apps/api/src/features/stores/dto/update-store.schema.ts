import { z } from 'zod';

export const updateStoreSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
