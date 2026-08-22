"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/trpc/react';

function formatCents(cents: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(cents / 100);
}

function badgeClass(s: string) {
  if (s === 'active') return 'badge-active';
  if (s === 'canceled' || s === 'failed') return 'badge-expired';
  return 'badge-inactive';
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: client, isLoading } = api.clients.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 h-8 w-48 animate-pulse rounded" style={{ background: "var(--border)" }} />
        <div className="card h-32 animate-pulse" style={{ background: "var(--surface)" }} />
      </div>
    );
  }

  if (!client) {
    return (
      <div>
        <p style={{ color: "var(--text-muted)" }}>Cliente no encontrado</p>
        <Link href="/clients" className="mt-4 inline-block text-sm font-medium" style={{ color: "var(--accent)" }}>
          Volver a clientes
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/clients" className="text-sm font-medium hover:opacity-80" style={{ color: "var(--accent)" }}>
          &larr; Volver a clientes
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{client.name}</h2>
          <p style={{ color: "var(--text-muted)" }}>{client.email}</p>
        </div>
        <span className={`badge ${client.type === 'empresa' ? 'badge-active' : 'badge-inactive'}`}>
          {client.type}
        </span>
      </div>

      {/* Info */}
      <div className="card mb-6">
        <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Informacion</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span style={{ color: "var(--text-muted)" }}>Empresa:</span>{' '}
            <span style={{ color: "var(--text-secondary)" }}>{client.company ?? '-'}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Telefono:</span>{' '}
            <span style={{ color: "var(--text-secondary)" }}>{client.phone ?? '-'}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Tax ID:</span>{' '}
            <span style={{ color: "var(--text-secondary)" }}>{client.taxId ?? '-'}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Pais:</span>{' '}
            <span style={{ color: "var(--text-secondary)" }}>{client.country}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Fuente:</span>{' '}
            <span style={{ color: "var(--text-secondary)" }}>{client.source}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Creado:</span>{' '}
            <span style={{ color: "var(--text-secondary)" }}>{new Date(client.createdAt).toLocaleDateString('es-AR')}</span>
          </div>
        </div>
        {client.notes && (
          <div className="mt-4 text-sm">
            <span style={{ color: "var(--text-muted)" }}>Notas:</span>{' '}
            <span style={{ color: "var(--text-secondary)" }}>{client.notes}</span>
          </div>
        )}
      </div>

      {/* Subscriptions */}
      <div className="card mb-6">
        <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Suscripciones ({client.subscriptions.length})
        </h3>
        {client.subscriptions.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sin suscripciones</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="p-2 font-medium" style={{ color: "var(--text-muted)" }}>Producto</th>
                <th className="p-2 font-medium" style={{ color: "var(--text-muted)" }}>Plan</th>
                <th className="p-2 font-medium" style={{ color: "var(--text-muted)" }}>Estado</th>
                <th className="p-2 font-medium" style={{ color: "var(--text-muted)" }}>Renovacion</th>
              </tr>
            </thead>
            <tbody>
              {client.subscriptions.map((sub) => (
                <tr key={sub.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="p-2" style={{ color: "var(--text-secondary)" }}>{sub.product?.name ?? sub.productId}</td>
                  <td className="p-2" style={{ color: "var(--text-secondary)" }}>{sub.plan?.name ?? sub.planId}</td>
                  <td className="p-2"><span className={`badge ${badgeClass(sub.status)}`}>{sub.status}</span></td>
                  <td className="p-2" style={{ color: "var(--text-muted)" }}>
                    {sub.renewalDate ? new Date(sub.renewalDate).toLocaleDateString('es-AR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Projects */}
      <div className="card mb-6">
        <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Proyectos ({client.projects.length})
        </h3>
        {client.projects.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sin proyectos</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="p-2 font-medium" style={{ color: "var(--text-muted)" }}>Nombre</th>
                <th className="p-2 font-medium" style={{ color: "var(--text-muted)" }}>Tipo</th>
                <th className="p-2 font-medium" style={{ color: "var(--text-muted)" }}>Estado</th>
                <th className="p-2 font-medium" style={{ color: "var(--text-muted)" }}>Presupuesto</th>
              </tr>
            </thead>
            <tbody>
              {client.projects.map((project) => (
                <tr key={project.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="p-2 font-medium" style={{ color: "var(--text-primary)" }}>{project.name}</td>
                  <td className="p-2" style={{ color: "var(--text-secondary)" }}>{project.type}</td>
                  <td className="p-2"><span className={`badge ${badgeClass(project.status)}`}>{project.status}</span></td>
                  <td className="p-2" style={{ color: "var(--text-secondary)" }}>
                    {project.budgetCents ? formatCents(project.budgetCents) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent payments */}
      <div className="card">
        <h3 className="mb-3 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Pagos recientes ({client.payments.length})
        </h3>
        {client.payments.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sin pagos</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="p-2 font-medium" style={{ color: "var(--text-muted)" }}>Monto</th>
                <th className="p-2 font-medium" style={{ color: "var(--text-muted)" }}>Estado</th>
                <th className="p-2 font-medium" style={{ color: "var(--text-muted)" }}>Metodo</th>
                <th className="p-2 font-medium" style={{ color: "var(--text-muted)" }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {client.payments.map((payment) => (
                <tr key={payment.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="p-2 font-medium" style={{ color: "var(--text-primary)" }}>
                    {formatCents(payment.amountCents)}
                  </td>
                  <td className="p-2"><span className={`badge ${badgeClass(payment.status)}`}>{payment.status}</span></td>
                  <td className="p-2" style={{ color: "var(--text-secondary)" }}>{payment.method ?? '-'}</td>
                  <td className="p-2" style={{ color: "var(--text-muted)" }}>
                    {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('es-AR') : '-'}
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
