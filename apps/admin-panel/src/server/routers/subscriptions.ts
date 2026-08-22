import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const subscriptionsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, search, limit, cursor } = input;

      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { client: { name: { contains: search, mode: 'insensitive' } } },
          { client: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const items = await ctx.db.subscription.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          client: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true } },
          plan: { select: { id: true, name: true, slug: true, maxStoresDefault: true } },
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

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const sub = await ctx.db.subscription.findUnique({
      where: { id: input.id },
      include: { client: true, product: true, plan: true, instances: true },
    });
    if (!sub) throw new TRPCError({ code: 'NOT_FOUND', message: 'Suscripción no encontrada' });
    return sub;
  }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        productId: z.string(),
        planId: z.string(),
        status: z.string().default('active'),
        maxStoresOverride: z.number().nullable().optional(),
        priceOverrideCents: z.number().nullable().optional(),
        managedManually: z.boolean().default(false),
        internalNotes: z.string().nullable().optional(),
        renewalDate: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.subscription.create({ data: input });
    }),

  update: protectedProcedure
    .input(
      z
        .object({ id: z.string() })
        .merge(
          z.object({
            status: z.string().optional(),
            maxStoresOverride: z.number().nullable().optional(),
            priceOverrideCents: z.number().nullable().optional(),
            managedManually: z.boolean().optional(),
            internalNotes: z.string().nullable().optional(),
            renewalDate: z.date().nullable().optional(),
          }),
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.subscription.update({ where: { id }, data });
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.subscription.delete({ where: { id: input.id } });
  }),
});
