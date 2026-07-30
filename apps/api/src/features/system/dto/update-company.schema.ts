import { z } from 'zod';

export const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  taxId: z.string().min(1).optional(),
  address: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
