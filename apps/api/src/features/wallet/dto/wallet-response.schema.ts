import { z } from 'zod';

export const WalletTransactionSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  type: z.string(),
  amount_cents: z.number().int(),
  balance_before: z.number().int(),
  balance_after: z.number().int(),
  reference: z.string().nullable(),
  reference_id: z.string().nullable(),
  notes: z.string().nullable(),
  created_by: z.string().nullable(),
  created_at: z.number().int(),
});

export const WalletBalanceSchema = z.object({
  contactId: z.string(),
  balance_cents: z.number().int(),
});

export type WalletTransactionDto = z.infer<typeof WalletTransactionSchema>;
export type WalletBalanceDto = z.infer<typeof WalletBalanceSchema>;
