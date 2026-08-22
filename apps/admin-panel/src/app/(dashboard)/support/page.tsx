"use client";

import { useState } from 'react';
import { api } from '@/trpc/react';

const STATUS_OPTIONS = ['', 'open', 'in_progress', 'resolved', 'closed'] as const;
const PRIORITY_OPTIONS = ['', 'low', 'medium', 'high', 'urgent'] as const;

function badgeClass(status: string, priority: string) {
  if (status === 'resolved' || status === 'closed') return 'badge-active';
  if (priority === 'urgent' || priority === 'high') return 'badge-expired';
  return 'badge-inactive';
}

export default function SupportPage() {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();

  const { data, isLoading } = api.support.list.useQuery({
    status: status || undefined,
    priority: priority || undefined,
    limit: 20,
    cursor,
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Soporte</h2>
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
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setCursor(undefined); }}
          className="input max-w-xs"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p || 'Todas las prioridades'}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Asunto</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Cliente</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Estado</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Prioridad</th>
              <th className="p-3 font-medium" style={{ color: "var(--text-muted)" }}>Creado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Cargando...</td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>No hay tickets</td>
              </tr>
            ) : (
              data?.items.map((ticket) => (
                <tr key={ticket.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="p-3 font-medium" style={{ color: "var(--text-primary)" }}>{ticket.subject}</td>
                  <td className="p-3">
                    <div className="font-medium" style={{ color: "var(--text-secondary)" }}>{ticket.client.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{ticket.client.email}</div>
                  </td>
                  <td className="p-3">
                    <span className={`badge ${badgeClass(ticket.status, ticket.priority)}`}>{ticket.status}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="p-3" style={{ color: "var(--text-muted)" }}>
                    {new Date(ticket.createdAt).toLocaleDateString('es-AR')}
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
