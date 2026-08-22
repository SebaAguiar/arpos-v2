import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const supportRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        priority: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, priority, limit, cursor } = input;

      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const items = await ctx.db.supportTicket.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          client: { select: { id: true, name: true, email: true } },
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
      const ticket = await ctx.db.supportTicket.findUnique({
        where: { id: input.id },
        include: { client: true },
      });
      if (!ticket) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket no encontrado' });
      return ticket;
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        subject: z.string().min(1, 'El asunto es obligatorio'),
        description: z.string().nullable().optional(),
        status: z.string().default('open'),
        priority: z.string().default('medium'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.supportTicket.create({ data: input });
    }),

  update: protectedProcedure
    .input(
      z
        .object({ id: z.string() })
        .merge(
          z.object({
            status: z.string().optional(),
            priority: z.string().optional(),
            resolvedAt: z.date().nullable().optional(),
          }),
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (data.status === 'resolved' && !data.resolvedAt) {
        data.resolvedAt = new Date();
      }
      return ctx.db.supportTicket.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.supportTicket.delete({ where: { id: input.id } });
    }),
});
