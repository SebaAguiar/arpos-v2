import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@arcom/prisma-schema';

const PHONE_REGEX = /^[0-9+()\s-]*$/;
const TAX_ID_REGEX = /^[0-9-]*$/;

const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().trim().toLowerCase().email('El email no tiene un formato válido'),
  type: z.enum(['persona', 'empresa']).default('persona'),
  source: z.string().default('saas_signup'),
  phone: z
    .string()
    .regex(PHONE_REGEX, 'El telefono solo admite numeros y los simbolos + ( ) -')
    .nullable()
    .optional(),
  company: z.string().nullable().optional(),
  taxId: z
    .string()
    .regex(TAX_ID_REGEX, 'El CUIT / Tax ID solo admite numeros y guiones')
    .nullable()
    .optional(),
  country: z.string().default('AR'),
  notes: z.string().nullable().optional(),
});

function isUniqueEmailError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

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
    try {
      return await ctx.db.client.create({ data: input });
    } catch (error) {
      if (isUniqueEmailError(error)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ya existe un cliente con ese email',
        });
      }
      throw error;
    }
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(clientSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      try {
        return await ctx.db.client.update({ where: { id }, data });
      } catch (error) {
        if (isUniqueEmailError(error)) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Ya existe un cliente con ese email',
          });
        }
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.client.delete({ where: { id: input.id } });
    }),
});
