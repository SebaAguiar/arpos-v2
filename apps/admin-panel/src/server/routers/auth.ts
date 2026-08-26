import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { signAuthToken } from '../token';

export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().trim().toLowerCase().email('El email no tiene un formato válido'),
        password: z.string().min(1, 'La contraseña es obligatoria'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.adminUser.findUnique({
        where: { email: input.email },
      });

      if (!user || !user.active) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciales inválidas' });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciales inválidas' });
      }

      const token = signAuthToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.adminUser.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuario no encontrado' });
    }

    return user;
  }),
});
