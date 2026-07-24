import { z } from 'zod';

export const InitCompanySchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  taxId: z.string().min(1, 'Tax ID is required'),
  adminEmail: z.string().email('Valid email is required'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export type InitCompanyInput = z.infer<typeof InitCompanySchema>;
