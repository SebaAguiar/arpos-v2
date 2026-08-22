"use client";

import { useState } from 'react';
import { api } from '@/trpc/react';
import Link from 'next/link';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();
  const { data, isLoading, refetch } = api.clients.list.useQuery({ search, limit: 15, cursor });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Clientes</h2>
        <Link href="/clients/new" className="btn-primary">Nuevo cliente</Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, email o empresa..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCursor(undefined); }}
          className="input"
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Nombre</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Email</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Tipo</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Empresa</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Creado</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Cargando...</td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>No hay clientes</td>
              </tr>
            ) : (
              data?.items.map((client) => (
                <tr key={client.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="p-3 font-medium" style={{ color: "var(--text-primary)" }}>{client.name}</td>
                  <td className="p-3" style={{ color: "var(--text-secondary)" }}>{client.email}</td>
                  <td className="p-3">
                    <span className={`badge ${client.type === 'empresa' ? 'badge-active' : 'badge-inactive'}`}>
                      {client.type}
                    </span>
                  </td>
                  <td className="p-3" style={{ color: "var(--text-secondary)" }}>{client.company ?? '-'}</td>
                  <td className="p-3" style={{ color: "var(--text-muted)" }}>
                    {new Date(client.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="p-3">
                    <Link href={`/clients/${client.id}`} className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.nextCursor && (
        <div className="mt-4 flex justify-center">
          <button onClick={() => setCursor(data.nextCursor)} className="btn-secondary">
            Cargar más
          </button>
        </div>
      )}
    </div>
  );
}
