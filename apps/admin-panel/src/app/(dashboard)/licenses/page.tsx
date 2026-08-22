"use client";

import { useState } from 'react';
import { api } from '@/trpc/react';

const STATUS_OPTIONS = ['', 'active', 'trialing', 'past_due', 'canceled'] as const;

export default function LicensesPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();

  const { data, isLoading } = api.subscriptions.list.useQuery({
    status: status || undefined,
    search: search || undefined,
    limit: 15,
    cursor,
  });

  function badgeClass(s: string) {
    if (s === 'active') return 'badge-active';
    if (s === 'canceled') return 'badge-expired';
    return 'badge-inactive';
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Licencias</h2>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Buscar por cliente..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCursor(undefined); }}
          className="input max-w-sm"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setCursor(undefined); }}
          className="input max-w-xs"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || 'Todos los estados'}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Cliente</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Producto</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Plan</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Estado</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Tiendas</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Renovacion</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Cargando...</td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>No hay suscripciones</td>
              </tr>
            ) : (
              data?.items.map((sub) => (
                <tr key={sub.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="p-3">
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>{sub.client.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{sub.client.email}</div>
                  </td>
                  <td className="p-3" style={{ color: "var(--text-secondary)" }}>{sub.product.name}</td>
                  <td className="p-3" style={{ color: "var(--text-secondary)" }}>{sub.plan.name}</td>
                  <td className="p-3">
                    <span className={`badge ${badgeClass(sub.status)}`}>{sub.status}</span>
                  </td>
                  <td className="p-3" style={{ color: "var(--text-secondary)" }}>{sub.maxStoresOverride ?? sub.plan.maxStoresDefault}</td>
                  <td className="p-3" style={{ color: "var(--text-muted)" }}>
                    {sub.renewalDate ? new Date(sub.renewalDate).toLocaleDateString('es-AR') : '-'}
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
            Cargar mas
          </button>
        </div>
      )}
    </div>
  );
}
