import { getClients } from "@/lib/actions/clients";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
        <Link href="/clients/new" className="btn-primary">
          + Nuevo Cliente
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-500">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Nombre
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Email
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Empresa
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Plan
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Dispositivos
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100">
                  <td className="py-3 text-sm font-medium text-gray-900">
                    {client.name}
                  </td>
                  <td className="py-3 text-sm text-gray-500">{client.email}</td>
                  <td className="py-3 text-sm text-gray-500">
                    {client.company || "-"}
                  </td>
                  <td className="py-3">
                    {client.activePlan ? (
                      <span className="badge-active">
                        {client.activePlan}
                      </span>
                    ) : (
                      <span className="badge-inactive">Sin licencia</span>
                    )}
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {client.totalDevices}
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Ver detalle
                    </Link>
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
