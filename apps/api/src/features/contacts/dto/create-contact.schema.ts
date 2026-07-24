import { z } from 'zod';

export const CreateContactSchema = z.object({
  type: z.enum(['customer', 'supplier']).default('customer'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateContactInput = z.infer<typeof CreateContactSchema>;
