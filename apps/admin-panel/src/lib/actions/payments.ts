import { prisma } from "@/lib/prisma";

export async function getPayments(clientId?: string) {
  const where: Record<string, unknown> = {};
  if (clientId) where.clientId = clientId;

  return prisma.payment.findMany({
    where,
    include: { client: true, plan: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPayment(data: {
  clientId: string;
  licenseId?: string;
  planId: string;
  amountCents: number;
  currency?: string;
  method: string;
  reference?: string;
  period?: string;
}) {
  return prisma.payment.create({
    data: {
      ...data,
      status: "completed",
      paidAt: Math.floor(Date.now() / 1000),
      createdAt: Math.floor(Date.now() / 1000),
    },
    include: { client: true, plan: true },
  });
}

export async function getPaymentsStats() {
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 86400;

  const [total, recent, byPlan] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amountCents: true }, _count: true }),
    prisma.payment.aggregate({
      _sum: { amountCents: true },
      _count: true,
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.payment.groupBy({
      by: ["planId"],
      _sum: { amountCents: true },
      _count: true,
    }),
  ]);

  return {
    totalRevenueCents: total._sum.amountCents || 0,
    totalCount: total._count,
    last30DaysRevenueCents: recent._sum.amountCents || 0,
    last30DaysCount: recent._count,
    byPlan,
  };
}
