import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const plansRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.plan.findMany({
      include: { product: { select: { id: true, name: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const plan = await ctx.db.plan.findUnique({
      where: { id: input.id },
      include: { product: true },
    });
    if (!plan) throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan no encontrado' });
    return plan;
  }),

  create: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        name: z.string().min(1, 'El nombre es obligatorio'),
        slug: z.string().min(1, 'El slug es obligatorio'),
        maxStoresDefault: z.number().default(1),
        priceDefaultCents: z.number().default(0),
        currency: z.string().default('ARS'),
        features: z.record(z.boolean()).default({}),
        sortOrder: z.number().default(0),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.plan.create({ data: input });
    }),

  update: protectedProcedure
    .input(
      z.object({ id: z.string() }).merge(
        z.object({
          name: z.string().optional(),
          slug: z.string().optional(),
          maxStoresDefault: z.number().optional(),
          priceDefaultCents: z.number().optional(),
          currency: z.string().optional(),
          features: z.record(z.boolean()).optional(),
          sortOrder: z.number().optional(),
          isActive: z.boolean().optional(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.plan.update({ where: { id }, data });
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.plan.delete({ where: { id: input.id } });
  }),
});
