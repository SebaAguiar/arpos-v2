import { z } from 'zod';

export const CreateDebitNoteSchema = z.object({
  invoiceId: z.string().min(1),
  reason: z.string().min(1, 'Reason is required'),
  amountCents: z.number().int().positive(),
});

export type CreateDebitNoteInput = z.infer<typeof CreateDebitNoteSchema>;
