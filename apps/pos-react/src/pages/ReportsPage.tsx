import { useState, useEffect, useCallback } from "react";
import { Text, Select } from "@radix-ui/themes";
import { BarChartIcon } from "@radix-ui/react-icons";
import { SalesRepository } from "@/repositories/sales.repository";
import { InventoryRepository, type InventoryReportData } from "@/repositories/inventory.repository";
import { CashRegisterRepository, type CashShiftData } from "@/repositories/cash-register.repository";
import type { ApiSaleStats, ApiPaymentMethodBreakdown, ApiTopProduct } from "@/services/sales.service";
import { useSettingsStore } from "@/stores/settings.store";
import { getPeriodTimestamps, type Period } from "@/lib/date";
import { SalesBarChart } from "@/components/reports/SalesBarChart";
import type { ChartPoint } from "@/components/reports/salesChartUtils";
import { TopProductsList } from "@/components/reports/TopProductsList";
import {
  PaymentMethodsWidget,
  type PaymentMethodDistribution,
} from "@/components/reports/PaymentMethodsWidget";
import { CashSummaryWidget } from "@/components/reports/CashSummaryWidget";
import { InventorySummaryWidget } from "@/components/reports/InventorySummaryWidget";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoy",
  week: "Últimos 7 días",
  month: "Últimos 30 días",
  custom: "Día específico",
};

function formatCustomDate(customDate?: string): string {
  if (!customDate) return "Hoy";
  const [year, month, day] = customDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getPeriodLabel(period: Period, customDate?: string): string {
  return period === "custom" ? formatCustomDate(customDate) : PERIOD_LABELS[period];
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const WEEKDAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

function buildHourlyPoints(sales: Array<{ createdAt: number; total: number }>): ChartPoint[] {
  const map = new Map<string, number>();
  for (let h = 0; h <= 23; h++) map.set(String(h).padStart(2, "0"), 0);
  for (const sale of sales) {
    const hour = String(new Date(sale.createdAt * 1000).getHours()).padStart(2, "0");
    map.set(hour, (map.get(hour) ?? 0) + sale.total);
  }
  return Array.from(map.entries()).map(([label, value]) => ({
    label,
    value,
    fullLabel: `${label}:00`,
  }));
}

function buildDailyPoints(
  from: number,
  to: number,
  sales: Array<{ createdAt: number; total: number }>,
): ChartPoint[] {
  const fromDate = new Date(from * 1000);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to * 1000);
  toDate.setHours(0, 0, 0, 0);

  const dayKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const map = new Map<string, number>();
  for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
    map.set(dayKey(d), 0);
  }
  for (const sale of sales) {
    const key = dayKey(new Date(sale.createdAt * 1000));
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + sale.total);
  }
  return Array.from(map.entries()).map(([key, value]) => {
    const date = new Date(`${key}T00:00:00`);
    return {
      label: `${WEEKDAY_LETTERS[date.getDay()]}${date.getDate()}/${date.getMonth() + 1}`,
      value,
      fullLabel: date.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    };
  });
}

const BAR_COLOR = "#60a5fa";
const PREV_BAR_COLOR = "#94a3b8";

function methodStyle(
  method: string,
  settingsMethods: { id: string; label: string; color: string }[],
): { label: string; color: string } {
  const match = settingsMethods.find((m) => m.id === method.toUpperCase());
  if (match) return { label: match.label, color: match.color };
  return { label: method, color: "#64748b" };
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous <= 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <Text
      size="1"
      weight="bold"
      color={up ? "green" : "red"}
      style={{ display: "block", marginTop: "4px" }}
    >
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% vs período anterior
    </Text>
  );
}

const CHART_PANEL_STYLE: React.CSSProperties = {
  padding: "16px",
  backgroundColor: "var(--bg-surface-hover)",
  borderRadius: "8px",
};

export function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [customDate, setCustomDate] = useState<string>(todayISO());
  const [stats, setStats] = useState<ApiSaleStats | null>(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState<ApiPaymentMethodBreakdown[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [topProducts, setTopProducts] = useState<ApiTopProduct[]>([]);
  const [inventoryReport, setInventoryReport] = useState<InventoryReportData | null>(null);
  const [shifts, setShifts] = useState<CashShiftData[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevStats, setPrevStats] = useState<ApiSaleStats | null>(null);
  const [prevPaymentBreakdown, setPrevPaymentBreakdown] = useState<ApiPaymentMethodBreakdown[]>([]);
  const [prevChartData, setPrevChartData] = useState<ChartPoint[] | null>(null);

  const fetchData = useCallback(async (p: Period, customDateValue?: string) => {
    try {
      const { from, to } = getPeriodTimestamps(p, customDateValue);
      const granularityIsHourly = p === "today" || p === "custom";

      const prevFrom = from !== undefined && to !== undefined ? from - (to - from) : undefined;
      const prevTo = from;

      const [statsData, paymentsData, salesData, topProductsData, invReport, shiftsData] = await Promise.all([
        SalesRepository.getStats({ from, to }),
        SalesRepository.getByPaymentMethod({ from, to }),
        SalesRepository.getAll({ from, to }),
        SalesRepository.getTopProducts({ from, to, limit: 10 }),
        InventoryRepository.getReport(),
        CashRegisterRepository.getAll(),
      ]);

      const [prevStatsData, prevPaymentsData, prevSalesData] = await Promise.all([
        SalesRepository.getStats({ from: prevFrom, to: prevTo }),
        SalesRepository.getByPaymentMethod({ from: prevFrom, to: prevTo }),
        granularityIsHourly
          ? Promise.resolve([])
          : SalesRepository.getAll({ from: prevFrom, to: prevTo }),
      ]);

      const chart = granularityIsHourly
        ? buildHourlyPoints(salesData)
        : buildDailyPoints(from ?? 0, to ?? 0, salesData);

      setStats(statsData);
      setPaymentBreakdown(paymentsData);
      setTopProducts(topProductsData);
      setInventoryReport(invReport);
      setShifts(shiftsData.filter((s) => s.status === "CLOSED"));
      setPrevStats(prevStatsData);
      setPrevPaymentBreakdown(prevPaymentsData);
      setChartData(chart);
      setPrevChartData(
        granularityIsHourly
          ? null
          : buildDailyPoints(prevFrom ?? 0, prevTo ?? 0, prevSalesData),
      );
    } catch (err) {
      console.error("[Reports] Error fetching data:", err);
      setStats(null);
      setPaymentBreakdown([]);
      setChartData([]);
      setTopProducts([]);
      setInventoryReport(null);
      setShifts([]);
      setPrevStats(null);
      setPrevPaymentBreakdown([]);
      setPrevChartData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      await fetchData(period, period === "custom" ? customDate : undefined);
    };
    void load();
    const interval = setInterval(() => fetchData(period, period === "custom" ? customDate : undefined), 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [period, customDate, fetchData]);

  const totalRevenue = (stats?.totalRevenue ?? 0) / 100;
  const totalTransactions = stats?.totalSales ?? 0;
  const averageTicket = (stats?.averageTicket ?? 0) / 100;
  const maxChart = Math.max(...chartData.map((c) => c.value), ...(prevChartData ?? []).map((c) => c.value), 1);

  const prevTotalRevenue = (prevStats?.totalRevenue ?? 0) / 100;
  const prevTotalTransactions = prevStats?.totalSales ?? 0;
  const prevAverageTicket = (prevStats?.averageTicket ?? 0) / 100;
  const prevPaymentCount = prevPaymentBreakdown.length;

  const settingsMethods = useSettingsStore((s) => s.paymentMethods);

  const totalPaymentCents = paymentBreakdown.reduce((s, p) => s + p.total_cents, 0);
  const paymentDistribution: PaymentMethodDistribution[] = paymentBreakdown.map((p) => {
    const { label, color } = methodStyle(p.payment_method, settingsMethods);
    return {
      method: p.payment_method,
      label,
      percentage: totalPaymentCents > 0 ? Math.round((p.total_cents / totalPaymentCents) * 100) : 0,
      color,
    };
  });

  return (
    <div className="page">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BarChartIcon width={20} height={20} />
          <Text size="5" weight="bold">Reportes</Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Select.Root
            value={period}
            onValueChange={(v) => {
              setLoading(true);
              setPeriod(v as Period);
            }}
          >
            <Select.Trigger className="select-compact" style={{ width: "180px" }} />
            <Select.Content position="popper">
              {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                <Select.Item key={key} value={key}>{label}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          {period === "custom" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                if (e.target.value) {
                  setCustomDate(e.target.value);
                  setLoading(true);
                }
              }}
              style={{
                height: "32px",
                padding: "0 8px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: "14px",
              }}
            />
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Text size="2" color="gray">Cargando datos...</Text>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                padding: "14px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "8px",
              }}
            >
              <Text size="1" color="gray">Ventas</Text>
              <Text size="5" weight="bold" color="green" style={{ display: "block", marginTop: "4px" }}>
                ${totalRevenue.toLocaleString("es-AR")}
              </Text>
              <DeltaBadge current={totalRevenue} previous={prevTotalRevenue} />
            </div>
            <div
              style={{
                padding: "14px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "8px",
              }}
            >
              <Text size="1" color="gray">Transacciones</Text>
              <Text size="5" weight="bold" style={{ display: "block", marginTop: "4px" }}>
                {totalTransactions}
              </Text>
              <DeltaBadge current={totalTransactions} previous={prevTotalTransactions} />
            </div>
            <div
              style={{
                padding: "14px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "8px",
              }}
            >
              <Text size="1" color="gray">Ticket promedio</Text>
              <Text size="5" weight="bold" color="orange" style={{ display: "block", marginTop: "4px" }}>
                ${averageTicket.toLocaleString("es-AR")}
              </Text>
              <DeltaBadge current={averageTicket} previous={prevAverageTicket} />
            </div>
            <div
              style={{
                padding: "14px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "8px",
              }}
            >
              <Text size="1" color="gray">Métodos de pago</Text>
              <Text size="5" weight="bold" style={{ display: "block", marginTop: "4px" }}>
                {paymentBreakdown.length}
              </Text>
              <DeltaBadge current={paymentBreakdown.length} previous={prevPaymentCount} />
            </div>
          </div>

          {/* Row 1: chart + top products (60 / 40) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: "12px",
              marginBottom: "12px",
              alignItems: "start",
            }}
          >
            <div style={{ gridColumn: "span 7", ...CHART_PANEL_STYLE }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <Text size="3" weight="bold">
                  Ventas {period === "today" || period === "custom" ? "por hora" : "por día"} —{" "}
                  {getPeriodLabel(period, customDate)}
                </Text>
                {period !== "today" && period !== "custom" && prevChartData && (
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "2px",
                          backgroundColor: BAR_COLOR,
                        }}
                      />
                      <Text size="1" color="gray">Este período</Text>
                    </div>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "2px",
                          backgroundColor: PREV_BAR_COLOR,
                        }}
                      />
                      <Text size="1" color="gray">Anterior</Text>
                    </div>
                  </div>
                )}
              </div>
              <SalesBarChart data={chartData} prevData={prevChartData ?? undefined} maxVal={maxChart} />
            </div>
            <div style={{ gridColumn: "span 5" }}>
              <TopProductsList products={topProducts} limit={5} />
            </div>
          </div>

          {/* Row 2: mini-widgets */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
            }}
          >
            <PaymentMethodsWidget distribution={paymentDistribution} />
            <CashSummaryWidget shifts={shifts} />
            <InventorySummaryWidget report={inventoryReport} />
          </div>
        </>
      )}
    </div>
  );
}
