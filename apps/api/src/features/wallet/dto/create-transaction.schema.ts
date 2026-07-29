import { z } from 'zod';

export const CreditWalletSchema = z.object({
  amount_cents: z.number().int().positive('Amount must be positive'),
  notes: z.string().optional(),
});

export const DebitWalletSchema = z.object({
  amount_cents: z.number().int().positive('Amount must be positive'),
  notes: z.string().optional(),
});

export type CreditWalletInput = z.infer<typeof CreditWalletSchema>;
export type DebitWalletInput = z.infer<typeof DebitWalletSchema>;
