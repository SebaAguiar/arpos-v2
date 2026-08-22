import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextRequest } from 'next/server';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/trpc';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
    onError({ error, path }) {
      console.error(`[tRPC] ${path ?? '<no-path>'}:`, error.message);
    },
  });

export { handler as GET, handler as POST };
