import { z } from 'zod';

export const UserFiltersSchema = z.object({
  role: z.string().optional(),
  is_active: z.string().optional().transform((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
});

export type UserFiltersInput = z.infer<typeof UserFiltersSchema>;
