import { useState } from "react";
import { Text, Badge, Tabs, Select } from "@radix-ui/themes";
import { Cross1Icon, BarChartIcon } from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";

type Period = "today" | "7d" | "30d" | "90d";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoy",
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
};

const mockHourlySales = [
  { hour: "09", amount: 2500 },
  { hour: "10", amount: 5800 },
  { hour: "11", amount: 8200 },
  { hour: "12", amount: 12000 },
  { hour: "13", amount: 7500 },
  { hour: "14", amount: 4200 },
  { hour: "15", amount: 6800 },
  { hour: "16", amount: 9100 },
  { hour: "17", amount: 11300 },
  { hour: "18", amount: 8700 },
  { hour: "19", amount: 5400 },
  { hour: "20", amount: 3200 },
];

const mockTopProducts = [
  { name: "Remera Básica", quantity: 45, revenue: 112500 },
  { name: "Jeans Clásico", quantity: 22, revenue: 195800 },
  { name: "Zapatillas Run", quantity: 12, revenue: 180000 },
  { name: "Gorro Lana", quantity: 38, revenue: 68400 },
  { name: "Campera Slim", quantity: 8, revenue: 176000 },
];

const mockPayments = [
  { method: "Efectivo", percentage: 45, color: "#30a46c" },
  { method: "Débito", percentage: 28, color: "#3b82f6" },
  { method: "Crédito", percentage: 18, color: "#8b5cf6" },
  { method: "QR", percentage: 9, color: "#f59e0b" },
];

function BarChart({ data, maxVal }: { data: { label: string; value: number }[]; maxVal: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "120px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <Text size="1" color="gray">${(d.value / 1000).toFixed(1)}k</Text>
          <div
            style={{
              width: "100%",
              height: `${maxVal > 0 ? (d.value / maxVal) * 100 : 0}%`,
              backgroundColor: "#e54d2e",
              borderRadius: "3px 3px 0 0",
              minHeight: "4px",
            }}
          />
          <Text size="1" color="gray">{d.label}</Text>
        </div>
      ))}
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
      <div style={{ height: "8px", backgroundColor: "#252525", borderRadius: "4px", overflow: "hidden" }}>
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

  const totalSales = mockHourlySales.reduce((s, h) => s + h.amount, 0);
  const maxHourly = Math.max(...mockHourlySales.map((h) => h.amount));
  const totalProducts = mockTopProducts.reduce((s, p) => s + p.quantity, 0);
  const avgTicket = totalProducts > 0 ? Math.round(totalSales / Math.max(totalProducts / 2.5, 1)) : 0;

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
          backgroundColor: "#1a1a1a",
          borderRadius: "12px",
          border: "1px solid #2a2a2a",
          width: "700px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #2a2a2a",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BarChartIcon width={20} height={20} />
            <Text size="4" weight="bold">Dashboard</Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Select.Root value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <Select.Trigger style={{ width: "160px" }} />
              <Select.Content>
                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                  <Select.Item key={key} value={key}>{label}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <button
              onClick={closeDashboard}
              style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}
            >
              <Cross1Icon width={18} height={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
            <div style={{ padding: "14px", backgroundColor: "#252525", borderRadius: "8px" }}>
              <Text size="1" color="gray">Ventas</Text>
              <Text size="5" weight="bold" color="green" style={{ display: "block", marginTop: "4px" }}>
                ${totalSales.toLocaleString("es-AR")}
              </Text>
            </div>
            <div style={{ padding: "14px", backgroundColor: "#252525", borderRadius: "8px" }}>
              <Text size="1" color="gray">Transacciones</Text>
              <Text size="5" weight="bold" style={{ display: "block", marginTop: "4px" }}>
                {Math.round(totalProducts / 2.5)}
              </Text>
            </div>
            <div style={{ padding: "14px", backgroundColor: "#252525", borderRadius: "8px" }}>
              <Text size="1" color="gray">Ticket promedio</Text>
              <Text size="5" weight="bold" color="orange" style={{ display: "block", marginTop: "4px" }}>
                ${avgTicket.toLocaleString("es-AR")}
              </Text>
            </div>
            <div style={{ padding: "14px", backgroundColor: "#252525", borderRadius: "8px" }}>
              <Text size="1" color="gray">Productos vendidos</Text>
              <Text size="5" weight="bold" style={{ display: "block", marginTop: "4px" }}>
                {totalProducts}
              </Text>
            </div>
          </div>

          <Tabs.Root defaultValue="hourly">
            <Tabs.List>
              <Tabs.Trigger value="hourly">Ventas por hora</Tabs.Trigger>
              <Tabs.Trigger value="products">Top productos</Tabs.Trigger>
              <Tabs.Trigger value="payments">Medios de pago</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="hourly" style={{ paddingTop: "16px" }}>
              <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
                Ventas por hora — {PERIOD_LABELS[period]}
              </Text>
              <BarChart
                data={mockHourlySales.map((h) => ({ label: h.hour, value: h.amount }))}
                maxVal={maxHourly}
              />
            </Tabs.Content>

            <Tabs.Content value="products" style={{ paddingTop: "16px" }}>
              <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
                Productos más vendidos
              </Text>
              {mockTopProducts.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "8px 10px",
                    borderBottom: "1px solid #2a2a2a",
                  }}
                >
                  <Badge color="orange" variant="soft" size="1" style={{ minWidth: "24px", textAlign: "center" }}>
                    {i + 1}
                  </Badge>
                  <div style={{ flex: 1 }}>
                    <Text size="2" weight="bold">{p.name}</Text>
                    <Text size="1" color="gray" style={{ display: "block" }}>
                      {p.quantity} unidades
                    </Text>
                  </div>
                  <Text size="2" weight="bold" color="green">
                    ${p.revenue.toLocaleString("es-AR")}
                  </Text>
                </div>
              ))}
            </Tabs.Content>

            <Tabs.Content value="payments" style={{ paddingTop: "16px" }}>
              <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
                Distribución por medio de pago
              </Text>
              {mockPayments.map((p, i) => (
                <HorizontalBar key={i} label={p.method} percentage={p.percentage} color={p.color} />
              ))}
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
}
