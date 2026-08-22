import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const productsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findMany({
        where: input?.search
          ? { name: { contains: input.search, mode: 'insensitive' } }
          : {},
        include: { plans: true, client: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: { plans: true, client: true },
      });
      if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Producto no encontrado' });
      return product;
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1, 'El nombre es obligatorio'), type: z.string().default('saas'), clientId: z.string().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.create({ data: input });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), type: z.string().optional(), clientId: z.string().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.product.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.delete({ where: { id: input.id } });
    }),
});
