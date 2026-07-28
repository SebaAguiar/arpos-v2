import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, license: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Pagos</h2>
        <Link href="/payments/new" className="btn-primary">
          + Registrar Pago
        </Link>
      </div>

      {payments.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-500">No hay pagos registrados</p>
        </div>
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Cliente
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Monto
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Método
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Estado
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Licencia
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100">
                  <td className="py-3 text-sm font-medium text-gray-900">
                    {payment.client.name}
                  </td>
                  <td className="py-3 text-sm text-gray-900">
                    ${(payment.amountCents / 100).toLocaleString("es-AR")}
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {payment.method}
                  </td>
                  <td className="py-3">
                    <span
                      className={
                        payment.status === "completed"
                          ? "badge-active"
                          : "badge-inactive"
                      }
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {payment.license?.key || "-"}
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {payment.paidAt
                      ? new Date(payment.paidAt * 1000).toLocaleDateString("es-AR")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
