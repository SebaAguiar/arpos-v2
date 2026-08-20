import { z } from 'zod';

export const CreateProjectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1).max(255),
  type: z.enum(['dev_custom', 'integration', 'migration', 'support']).default('dev_custom'),
  status: z.enum(['backlog', 'planned', 'in_progress', 'review', 'done', 'cancelled']).default('backlog'),
  startDate: z.coerce.date().optional(),
  estimatedEndDate: z.coerce.date().optional(),
  budgetCents: z.number().int().nonnegative().optional(),
  repoUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export type CreateProject = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = CreateProjectSchema.partial();
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;

export const ProjectParamsSchema = z.object({
  id: z.string().min(1),
});
