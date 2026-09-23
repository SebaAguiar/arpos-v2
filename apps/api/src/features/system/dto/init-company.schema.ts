import { z } from 'zod';

// License payload issued by the admin panel (/api/license/issue) for the
// subscription linked to the onboarding email. Persisted on the local company
// so a reinstalled POS re-detects the account plan on next startup.
export const InitAccountSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  name: z.string(),
  planSlug: z.string(),
  planName: z.string(),
  maxStores: z.number().int().nonnegative(),
  features: z.record(z.string(), z.boolean()),
  validFrom: z.string(),
  validUntil: z.string(),
});

export const InitCompanySchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  taxId: z.string().min(1, 'Tax ID is required'),
  adminEmail: z.string().email('Valid email is required'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
  account: InitAccountSchema.optional(),
});

export type InitAccount = z.infer<typeof InitAccountSchema>;
export type InitCompanyInput = z.infer<typeof InitCompanySchema>;