import { z } from 'zod';

export const CreateTicketSchema = z.object({
  clientId: z.string().min(1),
  subject: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).default('open'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  resolvedAt: z.coerce.date().optional(),
});

export type CreateTicket = z.infer<typeof CreateTicketSchema>;

export const UpdateTicketSchema = CreateTicketSchema.partial().omit({ clientId: true });
export type UpdateTicket = z.infer<typeof UpdateTicketSchema>;

export const TicketParamsSchema = z.object({
  id: z.string().min(1),
});
