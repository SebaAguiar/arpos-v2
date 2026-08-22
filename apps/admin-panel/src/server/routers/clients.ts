import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  type: z.enum(['persona', 'empresa']).default('persona'),
  source: z.string().default('saas_signup'),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  country: z.string().default('AR'),
  notes: z.string().nullable().optional(),
});

export const clientsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search, limit, cursor } = input;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { company: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const items = await ctx.db.client.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
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
      const client = await ctx.db.client.findUnique({
        where: { id: input.id },
        include: {
          subscriptions: { include: { product: { select: { name: true } }, plan: { select: { name: true } } } },
          projects: true,
          payments: { take: 5, orderBy: { createdAt: 'desc' } },
        },
      });
      if (!client) throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente no encontrado' });
      return client;
    }),

  create: protectedProcedure.input(clientSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.client.create({ data: input });
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(clientSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.client.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.client.delete({ where: { id: input.id } });
    }),
});
