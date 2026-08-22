import { router, protectedProcedure } from '../trpc';

export const statsRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const [totalClients, totalSubscriptions, activeSubscriptions, totalPayments, openTickets, totalProjects] =
      await Promise.all([
        ctx.db.client.count(),
        ctx.db.subscription.count(),
        ctx.db.subscription.count({ where: { status: 'active' } }),
        ctx.db.payment.aggregate({ _sum: { amountCents: true }, where: { status: 'completed' } }),
        ctx.db.supportTicket.count({ where: { status: 'open' } }),
        ctx.db.project.count(),
      ]);

    return {
      totalClients,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue: totalPayments._sum.amountCents ?? 0,
      openTickets,
      totalProjects,
    };
  }),
});
