import { z } from 'zod';

export const CreateGlobalDailySchema = z.object({
  from: z.number().int().positive().optional(),
  to: z.number().int().positive().optional(),
  arcaConfigId: z.string().optional(),
});

export type CreateGlobalDailyInput = z.infer<typeof CreateGlobalDailySchema>;