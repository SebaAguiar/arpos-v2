import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const projectsRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), clientId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input?.status) where.status = input.status;
      if (input?.clientId) where.clientId = input.clientId;

      return ctx.db.project.findMany({
        where,
        include: { client: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const project = await ctx.db.project.findUnique({
      where: { id: input.id },
      include: { client: true, payments: true },
    });
    if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Proyecto no encontrado' });
    return project;
  }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        name: z.string().min(1),
        type: z.string().default('dev_custom'),
        status: z.string().default('backlog'),
        startDate: z.date().nullable().optional(),
        estimatedEndDate: z.date().nullable().optional(),
        budgetCents: z.number().nullable().optional(),
        repoUrl: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.create({ data: input });
    }),

  update: protectedProcedure
    .input(
      z
        .object({ id: z.string() })
        .merge(
          z.object({
            name: z.string().optional(),
            type: z.string().optional(),
            status: z.string().optional(),
            startDate: z.date().nullable().optional(),
            estimatedEndDate: z.date().nullable().optional(),
            budgetCents: z.number().nullable().optional(),
            repoUrl: z.string().nullable().optional(),
            notes: z.string().nullable().optional(),
          }),
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.project.update({ where: { id }, data });
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.project.delete({ where: { id: input.id } });
  }),
});
