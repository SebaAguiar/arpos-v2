import { z } from 'zod';

export const CreateInvoiceSchema = z.object({
  saleId: z.string().min(1),
  arcaConfigId: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
