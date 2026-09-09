import { z } from 'zod';

// Local identity session (offline-first, free plan). The POS resolves its
// device identity locally without any dependency on the admin license panel.
// The license only gates launcher updates / paid features, never the core POS.
export const LocalSessionSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().max(120).optional(),
});

export type LocalSessionInput = z.infer<typeof LocalSessionSchema>;