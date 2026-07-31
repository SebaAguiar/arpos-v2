import { z } from 'zod';

export const ImportV1Schema = z.object({
  databaseUrl: z.string().url('A valid PostgreSQL connection URL is required'),
  primaryStoreId: z.string().optional(),
});

export type ImportV1Input = z.infer<typeof ImportV1Schema>;
