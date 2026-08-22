import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const paymentsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        clientId: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, clientId, limit, cursor } = input;

      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (clientId) where.clientId = clientId;

      const items = await ctx.db.payment.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          client: { select: { id: true, name: true, email: true } },
          subscription: { select: { id: true, status: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const next = items.pop();
        nextCursor = next?.id;
      }

      return { items, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const payment = await ctx.db.payment.findUnique({
        where: { id: input.id },
        include: { client: true, subscription: true, project: true },
      });
      if (!payment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Pago no encontrado' });
      return payment;
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        subscriptionId: z.string().nullable().optional(),
        projectId: z.string().nullable().optional(),
        amountCents: z.number().min(0),
        currency: z.string().default('ARS'),
        status: z.string().default('pending'),
        method: z.string().nullable().optional(),
        externalRef: z.string().nullable().optional(),
        paidAt: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.payment.create({ data: input });
    }),

  update: protectedProcedure
    .input(
      z
        .object({ id: z.string() })
        .merge(
          z.object({
            status: z.string().optional(),
            method: z.string().nullable().optional(),
            externalRef: z.string().nullable().optional(),
            paidAt: z.date().nullable().optional(),
          }),
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.payment.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.payment.delete({ where: { id: input.id } });
    }),
});
