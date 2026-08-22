"use client";

import { useState } from 'react';
import { api } from '@/trpc/react';

const STATUS_OPTIONS = ['', 'completed', 'pending', 'failed', 'refunded'] as const;

function formatCents(cents: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(cents / 100);
}

function badgeClass(s: string) {
  if (s === 'completed') return 'badge-active';
  if (s === 'failed' || s === 'refunded') return 'badge-expired';
  return 'badge-inactive';
}

export default function PaymentsPage() {
  const [status, setStatus] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();

  const { data, isLoading } = api.payments.list.useQuery({
    status: status || undefined,
    limit: 20,
    cursor,
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Pagos</h2>
      </div>

      <div className="mb-4 flex gap-3">
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
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Monto</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Estado</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Metodo</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Referencia</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Cargando...</td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>No hay pagos</td>
              </tr>
            ) : (
              data?.items.map((payment) => (
                <tr key={payment.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="p-3">
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>{payment.client.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{payment.client.email}</div>
                  </td>
                  <td className="p-3 font-medium" style={{ color: "var(--text-primary)" }}>
                    {formatCents(payment.amountCents)}
                  </td>
                  <td className="p-3">
                    <span className={`badge ${badgeClass(payment.status)}`}>{payment.status}</span>
                  </td>
                  <td className="p-3" style={{ color: "var(--text-secondary)" }}>{payment.method ?? '-'}</td>
                  <td className="p-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    {payment.externalRef ?? '-'}
                  </td>
                  <td className="p-3" style={{ color: "var(--text-muted)" }}>
                    {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('es-AR') : '-'}
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
