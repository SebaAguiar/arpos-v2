"use client";

import { api } from '@/trpc/react';

function formatCents(cents: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(cents / 100);
}

export default function DashboardPage() {
  const { data: stats, isLoading } = api.stats.overview.useQuery();

  if (isLoading) {
    return (
      <div>
        <h2 className="mb-6 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-24 rounded" style={{ background: "var(--border)" }} />
              <div className="mt-2 h-8 w-16 rounded" style={{ background: "var(--border)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Clientes", value: stats?.totalClients ?? 0, color: "var(--accent)" },
    { label: "Suscripciones activas", value: stats?.activeSubscriptions ?? 0, color: "#059669" },
    { label: "Total suscripciones", value: stats?.totalSubscriptions ?? 0, color: "#7C3AED" },
    { label: "Ingresos totales", value: formatCents(stats?.totalRevenue ?? 0), color: "#D97706" },
    { label: "Tickets abiertos", value: stats?.openTickets ?? 0, color: "#DC2626" },
    { label: "Proyectos", value: stats?.totalProjects ?? 0, color: "#0891B2" },
  ];

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{card.label}</p>
            <p className="mt-1 text-3xl font-bold" style={{ color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
