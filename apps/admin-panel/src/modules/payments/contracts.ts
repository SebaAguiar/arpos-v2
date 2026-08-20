import { z } from 'zod';

export const CreatePaymentSchema = z.object({
  clientId: z.string().min(1),
  subscriptionId: z.string().optional(),
  projectId: z.string().optional(),
  amountCents: z.number().int().positive(),
  currency: z.string().max(10).default('ARS'),
  status: z.enum(['pending', 'approved', 'rejected', 'refunded', 'cancelled']).default('pending'),
  method: z.string().max(50).optional(),
  externalRef: z.string().max(255).optional(),
  paidAt: z.coerce.date().optional(),
});

export type CreatePayment = z.infer<typeof CreatePaymentSchema>;

export const UpdatePaymentSchema = CreatePaymentSchema.partial().omit({ clientId: true });
export type UpdatePayment = z.infer<typeof UpdatePaymentSchema>;

export const PaymentParamsSchema = z.object({
  id: z.string().min(1),
});
