import { z } from 'zod';

export const InvoiceFiltersSchema = z.object({
  status: z.string().optional(),
  document_type: z.string().optional(),
  from: z
    .string()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .optional(),
  to: z
    .string()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .optional(),
});

export type InvoiceFiltersInput = z.infer<typeof InvoiceFiltersSchema>;
