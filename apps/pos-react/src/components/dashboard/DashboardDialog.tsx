import { useState, useEffect, useCallback } from "react";
import { Text, Tabs, Select } from "@radix-ui/themes";
import { Cross1Icon, BarChartIcon } from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { SalesRepository } from "@/repositories/sales.repository";
import type { ApiSaleStats, ApiPaymentMethodBreakdown } from "@/services/sales.service";

type Period = "today" | "7d" | "30d" | "90d";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoy",
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
};

function getPeriodTimestamps(period: Period): { from?: number; to?: number } {
  const now = Math.floor(Date.now() / 1000);
  switch (period) {
    case "today": {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return { from: Math.floor(todayStart.getTime() / 1000), to: now };
    }
    case "7d":
      return { from: now - 7 * 86400, to: now };
    case "30d":
      return { from: now - 30 * 86400, to: now };
    case "90d":
      return { from: now - 90 * 86400, to: now };
  }
}

const METHOD_COLORS: Record<string, string> = {
  CASH: "#30a46c",
  DEBIT: "#3b82f6",
  CREDIT: "#8b5cf6",
  QR: "#f59e0b",
  WALLET: "#ec4899",
  TRANSFER: "#06b6d4",
  POINTS: "#64748b",
};

const BAR_CHART_HEIGHT = 140;
const BAR_LABEL_HEIGHT = 28;

function BarChart({ data, maxVal }: { data: { label: string; value: number }[]; maxVal: number }) {
  const barMaxHeight = BAR_CHART_HEIGHT - BAR_LABEL_HEIGHT;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: `${BAR_CHART_HEIGHT}px` }}>
      {data.map((d, i) => {
        const barPx = maxVal > 0 ? Math.round((d.value / maxVal) * barMaxHeight) : 0;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
            <Text size="1" color="gray">{d.value >= 1000 ? `$${(d.value / 1000).toFixed(1)}k` : `$${d.value.toLocaleString("es-AR")}`}</Text>
            <div
              style={{
                width: "100%",
                height: `${Math.max(barPx, 3)}px`,
                backgroundColor: "var(--accent)",
                borderRadius: "3px 3px 0 0",
              }}
            />
            <Text size="1" color="gray">{d.label}</Text>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBar({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <Text size="2">{label}</Text>
        <Text size="2" color="gray">{percentage}%</Text>
      </div>
      <div style={{ height: "8px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "4px", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${percentage}%`,
            backgroundColor: color,
            borderRadius: "4px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

export function DashboardDialog() {
  const closeDashboard = useDialogStore((s) => s.closeDashboard);
  const [period, setPeriod] = useState<Period>("today");
  const [stats, setStats] = useState<ApiSaleStats | null>(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState<ApiPaymentMethodBreakdown[]>([]);
  const [hourlySales, setHourlySales] = useState<{ hour: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: Period) => {
    try {
      const { from, to } = getPeriodTimestamps(p);
      const [statsData, paymentsData, salesData] = await Promise.all([
        SalesRepository.getStats({ from, to }),
        SalesRepository.getByPaymentMethod({ from, to }),
        SalesRepository.getAll({ from, to }),
      ]);

      setStats(statsData);
      setPaymentBreakdown(paymentsData);

      const hourlyMap = new Map<string, number>();
      for (let h = 0; h <= 23; h++) {
        hourlyMap.set(String(h).padStart(2, "0"), 0);
      }
      for (const sale of salesData) {
        const date = new Date(sale.createdAt * 1000);
        const hour = String(date.getHours()).padStart(2, "0");
        hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + sale.total);
      }
      const allHours = Array.from(hourlyMap.entries()).map(([hour, amount]) => ({ hour, amount }));
      setHourlySales(allHours);
    } catch (err) {
      console.error("[Dashboard] Error fetching data:", err);
      setStats(null);
      setPaymentBreakdown([]);
      setHourlySales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      await fetchData(period);
    };
    void load();
    const interval = setInterval(() => fetchData(period), 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [period, fetchData]);

  const handlePeriodChange = (value: string) => {
    setLoading(true);
    setPeriod(value as Period);
  };

  const totalRevenue = (stats?.totalRevenue ?? 0) / 100;
  const totalTransactions = stats?.totalSales ?? 0;
  const averageTicket = (stats?.averageTicket ?? 0) / 100;
  const maxHourly = Math.max(...hourlySales.map((h) => h.amount), 1);

  const totalPaymentCents = paymentBreakdown.reduce((s, p) => s + p.total_cents, 0);
  const paymentDistribution = paymentBreakdown.map((p) => ({
    method: p.payment_method,
    percentage: totalPaymentCents > 0 ? Math.round((p.total_cents / totalPaymentCents) * 100) : 0,
    color: METHOD_COLORS[p.payment_method] ?? "#64748b",
  }));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          width: "700px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BarChartIcon width={20} height={20} />
            <Text size="4" weight="bold">Dashboard</Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Select.Root value={period} onValueChange={handlePeriodChange}>
              <Select.Trigger className="select-compact" style={{ width: "160px" }} />
              <Select.Content position="popper">
                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                  <Select.Item key={key} value={key}>{label}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <button
              onClick={closeDashboard}
              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
            >
              <Cross1Icon width={18} height={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Text size="2" color="gray">Cargando datos...</Text>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
                <div style={{ padding: "14px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                  <Text size="1" color="gray">Ventas</Text>
                  <Text size="5" weight="bold" color="green" style={{ display: "block", marginTop: "4px" }}>
                    ${totalRevenue.toLocaleString("es-AR")}
                  </Text>
                </div>
                <div style={{ padding: "14px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                  <Text size="1" color="gray">Transacciones</Text>
                  <Text size="5" weight="bold" style={{ display: "block", marginTop: "4px" }}>
                    {totalTransactions}
                  </Text>
                </div>
                <div style={{ padding: "14px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                  <Text size="1" color="gray">Ticket promedio</Text>
                  <Text size="5" weight="bold" color="orange" style={{ display: "block", marginTop: "4px" }}>
                    ${averageTicket.toLocaleString("es-AR")}
                  </Text>
                </div>
                <div style={{ padding: "14px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                  <Text size="1" color="gray">Métodos de pago</Text>
                  <Text size="5" weight="bold" style={{ display: "block", marginTop: "4px" }}>
                    {paymentBreakdown.length}
                  </Text>
                </div>
              </div>

              <Tabs.Root defaultValue="hourly">
                <Tabs.List>
                  <Tabs.Trigger value="hourly">Ventas por hora</Tabs.Trigger>
                  <Tabs.Trigger value="payments">Medios de pago</Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="hourly" style={{ paddingTop: "16px" }}>
                  <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
                    Ventas por hora — {PERIOD_LABELS[period]}
                  </Text>
                  <BarChart
                    data={hourlySales.map((h) => ({ label: h.hour, value: h.amount }))}
                    maxVal={maxHourly}
                  />
                </Tabs.Content>

                <Tabs.Content value="payments" style={{ paddingTop: "16px" }}>
                  <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
                    Distribución por medio de pago
                  </Text>
                  {paymentDistribution.length === 0 ? (
                    <Text size="2" color="gray">No hay datos de pagos</Text>
                  ) : (
                    paymentDistribution.map((p, i) => (
                      <HorizontalBar key={i} label={p.method} percentage={p.percentage} color={p.color} />
                    ))
                  )}
                </Tabs.Content>
              </Tabs.Root>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
