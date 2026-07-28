import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Soporte</h2>
      </div>

      {tickets.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-500">No hay tickets de soporte</p>
        </div>
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Asunto
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Cliente
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Prioridad
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Estado
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-100">
                  <td className="py-3 text-sm font-medium text-gray-900">
                    {ticket.subject}
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {ticket.client.name}
                  </td>
                  <td className="py-3">
                    <span
                      className={
                        ticket.priority === "urgent"
                          ? "badge bg-red-100 text-red-800"
                          : ticket.priority === "high"
                          ? "badge bg-orange-100 text-orange-800"
                          : "badge bg-gray-100 text-gray-800"
                      }
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={
                        ticket.status === "open"
                          ? "badge bg-yellow-100 text-yellow-800"
                          : ticket.status === "resolved"
                          ? "badge-active"
                          : "badge-inactive"
                      }
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {new Date(ticket.createdAt * 1000).toLocaleDateString("es-AR")}
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
