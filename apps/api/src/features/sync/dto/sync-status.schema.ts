import { z } from 'zod';

export const SyncPendingSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type SyncPendingInput = z.infer<typeof SyncPendingSchema>;

export const CleanupSchema = z.object({
  older_than_days: z.number().int().positive().optional(),
});

export type CleanupInput = z.infer<typeof CleanupSchema>;

export const PullQuerySchema = z.object({
  since: z.coerce.number().int().optional(),
});

export type PullQueryInput = z.infer<typeof PullQuerySchema>;

export const SyncConfigSchema = z.object({
  cloud_url: z.string().url().optional(),
  cloud_jwt: z.string().min(1).optional(),
  subscription: z
    .object({
      status: z.enum(['active', 'inactive']),
      tier: z.string().optional(),
      expiresAt: z.number().int().optional(),
    })
    .optional(),
});

export type SyncConfigInput = z.infer<typeof SyncConfigSchema>;
