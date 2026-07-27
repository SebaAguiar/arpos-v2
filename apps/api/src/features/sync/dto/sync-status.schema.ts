import { z } from 'zod';

export const SyncPendingSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type SyncPendingInput = z.infer<typeof SyncPendingSchema>;

export const CleanupSchema = z.object({
  older_than_days: z.number().int().positive().optional(),
});

export type CleanupInput = z.infer<typeof CleanupSchema>;
