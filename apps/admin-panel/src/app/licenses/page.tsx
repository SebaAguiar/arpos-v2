import { getLicenses } from "@/lib/actions/licenses";

export default async function LicensesPage() {
  const licenses = await getLicenses();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Licencias</h2>
      </div>

      {licenses.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-500">No hay licencias creadas</p>
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
                  Plan
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Estado
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Key
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Expira
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Instance
                </th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((license) => (
                <tr key={license.id} className="border-b border-gray-100">
                  <td className="py-3 text-sm font-medium text-gray-900">
                    {license.client.name}
                  </td>
                  <td className="py-3">
                    <span className="badge bg-blue-100 text-blue-800">
                      {license.plan.name}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={
                        license.status === "active"
                          ? "badge-active"
                          : license.status === "expired"
                          ? "badge-expired"
                          : "badge-inactive"
                      }
                    >
                      {license.status}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-xs text-gray-400">
                    {license.key}
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {license.expiresAt
                      ? new Date(license.expiresAt * 1000).toLocaleDateString("es-AR")
                      : "Nunca"}
                  </td>
                  <td className="py-3 font-mono text-xs text-gray-400">
                    {license.instanceId
                      ? `${license.instanceId.slice(0, 8)}...`
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
