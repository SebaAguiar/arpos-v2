import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    totalClients,
    activeLicenses,
    recentPayments,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.license.count({ where: { status: "active" } }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { client: true, plan: true },
    }),
  ]);

  // Server component (force-dynamic): runs once per request on the server, so
  // Date.now() is the intended source for the reporting window, not an impure render call.
  // eslint-disable-next-line react-hooks/purity
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 86400;

  const revenueAgg = await prisma.payment.aggregate({
    _sum: { amountCents: true },
    _count: true,
    where: { status: "completed", createdAt: { gte: thirtyDaysAgo } },
  });

  const revenue30d = (revenueAgg._sum.amountCents || 0) / 100;
  const payCount = revenueAgg._count;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h2>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Clientes</p>
          <p className="text-3xl font-bold text-gray-900">{totalClients}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Licencias Activas</p>
          <p className="text-3xl font-bold text-green-600">{activeLicenses}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Ingresos (30d)</p>
          <p className="text-3xl font-bold text-blue-600">
            ${revenue30d.toLocaleString("es-AR")}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pagos (30d)</p>
          <p className="text-3xl font-bold text-purple-600">{payCount}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Pagos Recientes
        </h3>
        {recentPayments.length === 0 ? (
          <p className="text-gray-500">No hay pagos registrados</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-2 text-left text-sm font-medium text-gray-500">
                  Cliente
                </th>
                <th className="pb-2 text-left text-sm font-medium text-gray-500">
                  Plan
                </th>
                <th className="pb-2 text-left text-sm font-medium text-gray-500">
                  Monto
                </th>
                <th className="pb-2 text-left text-sm font-medium text-gray-500">
                  Método
                </th>
                <th className="pb-2 text-left text-sm font-medium text-gray-500">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-900">
                    {payment.client.name}
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {payment.plan.name}
                  </td>
                  <td className="py-3 text-sm text-gray-900">
                    ${(payment.amountCents / 100).toLocaleString("es-AR")}
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {payment.method}
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {new Date(payment.paidAt! * 1000).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
