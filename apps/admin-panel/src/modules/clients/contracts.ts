import { z } from 'zod';

export const CreateClientSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  type: z.enum(['persona', 'empresa']).default('persona'),
  source: z.string().max(50).default('manual'),
  phone: z.string().max(100).optional(),
  company: z.string().max(255).optional(),
  taxId: z.string().max(100).optional(),
  country: z.string().max(10).default('AR'),
  notes: z.string().optional(),
});

export type CreateClient = z.infer<typeof CreateClientSchema>;

export const UpdateClientSchema = CreateClientSchema.partial();
export type UpdateClient = z.infer<typeof UpdateClientSchema>;

export const ClientParamsSchema = z.object({
  id: z.string().min(1),
});
