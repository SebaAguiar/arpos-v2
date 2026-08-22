import { router } from '../trpc';
import { authRouter } from './auth';
import { statsRouter } from './stats';
import { clientsRouter } from './clients';
import { productsRouter } from './products';
import { plansRouter } from './plans';
import { subscriptionsRouter } from './subscriptions';
import { projectsRouter } from './projects';
import { paymentsRouter } from './payments';
import { supportRouter } from './support';

export const appRouter = router({
  auth: authRouter,
  stats: statsRouter,
  clients: clientsRouter,
  products: productsRouter,
  plans: plansRouter,
  subscriptions: subscriptionsRouter,
  projects: projectsRouter,
  payments: paymentsRouter,
  support: supportRouter,
});

export type AppRouter = typeof appRouter;
