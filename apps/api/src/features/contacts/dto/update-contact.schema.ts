import { z } from 'zod';

export const UpdateContactSchema = z.object({
  type: z.enum(['customer', 'supplier']).optional(),
  name: z.string().min(1).optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;
