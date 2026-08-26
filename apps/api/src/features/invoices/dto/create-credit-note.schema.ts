import { z } from 'zod';

export const CreateCreditNoteSchema = z.object({
  invoiceId: z.string().min(1),
  reason: z.string().min(1, 'Reason is required'),
  amountCents: z.number().int().positive().optional(),
});

export type CreateCreditNoteInput = z.infer<typeof CreateCreditNoteSchema>;
