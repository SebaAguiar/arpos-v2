import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { type NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from './db';

export interface Context {
  db: typeof db;
  user: { id: string; email: string; role: string } | null;
  req: NextRequest;
}

export async function createContext({ req }: { req: NextRequest }): Promise<Context> {
  let user: Context['user'] = null;

  const token =
    req.cookies.get('arcom_token')?.value ??
    req.headers.get('authorization')?.replace('Bearer ', '');

  if (token) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
      user = { id: decoded.id, email: decoded.email, role: decoded.role };
    } catch {
      user = null;
    }
  }

  return { db, user, req };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof Error && 'issues' in error.cause ? error.cause.issues : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(enforceAuth);
