import { useState, useEffect, useCallback } from "react";
import { Text, Tabs, Select, Badge } from "@radix-ui/themes";
import {
  BarChartIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon,
  CrossCircledIcon,

} from "@radix-ui/react-icons";
import { SalesRepository } from "@/repositories/sales.repository";
import { InventoryRepository, type InventoryReportData } from "@/repositories/inventory.repository";
import { CashRegisterRepository, type CashShiftData } from "@/repositories/cash-register.repository";
import type { ApiSaleStats, ApiPaymentMethodBreakdown, ApiTopProduct } from "@/services/sales.service";

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
            <Text size="1" color="gray">
              {d.value >= 1000 ? `$${(d.value / 1000).toFixed(1)}k` : `$${d.value.toLocaleString("es-AR")}`}
            </Text>
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

export function ReportsPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [stats, setStats] = useState<ApiSaleStats | null>(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState<ApiPaymentMethodBreakdown[]>([]);
  const [hourlySales, setHourlySales] = useState<{ hour: string; amount: number }[]>([]);
  const [topProducts, setTopProducts] = useState<ApiTopProduct[]>([]);
  const [inventoryReport, setInventoryReport] = useState<InventoryReportData | null>(null);
  const [shifts, setShifts] = useState<CashShiftData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: Period) => {
    try {
      const { from, to } = getPeriodTimestamps(p);
      const [statsData, paymentsData, salesData, topProductsData, invReport, shiftsData] = await Promise.all([
        SalesRepository.getStats({ from, to }),
        SalesRepository.getByPaymentMethod({ from, to }),
        SalesRepository.getAll({ from, to }),
        SalesRepository.getTopProducts({ from, to, limit: 10 }),
        InventoryRepository.getReport(),
        CashRegisterRepository.getAll(),
      ]);

      setStats(statsData);
      setPaymentBreakdown(paymentsData);
      setTopProducts(topProductsData);
      setInventoryReport(invReport);
      setShifts(shiftsData.filter((s) => s.status === "CLOSED"));

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
      console.error("[Reports] Error fetching data:", err);
      setStats(null);
      setPaymentBreakdown([]);
      setHourlySales([]);
      setTopProducts([]);
      setInventoryReport(null);
      setShifts([]);
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

  const maxProductRevenue = Math.max(...topProducts.map((p) => p.total_cents / 100), 1);

  return (
    <div className="page" style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BarChartIcon width={20} height={20} />
          <Text size="5" weight="bold">Reportes</Text>
        </div>
        <Select.Root
          value={period}
          onValueChange={(v) => {
            setLoading(true);
            setPeriod(v as Period);
          }}
        >
          <Select.Trigger className="select-compact" style={{ width: "180px" }} />
          <Select.Content>
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
              <Select.Item key={key} value={key}>{label}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Text size="2" color="gray">Cargando datos...</Text>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
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

          {/* Tabs */}
          <Tabs.Root defaultValue="hourly">
            <Tabs.List>
              <Tabs.Trigger value="hourly">Ventas por hora</Tabs.Trigger>
              <Tabs.Trigger value="payments">Medios de pago</Tabs.Trigger>
              <Tabs.Trigger value="products">Top productos</Tabs.Trigger>
              <Tabs.Trigger value="inventory">Inventario</Tabs.Trigger>
              <Tabs.Trigger value="cash">Caja</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="hourly" style={{ paddingTop: "16px" }}>
              <div style={{ padding: "16px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
                  Ventas por hora — {PERIOD_LABELS[period]}
                </Text>
                <BarChart
                  data={hourlySales.map((h) => ({ label: h.hour, value: h.amount }))}
                  maxVal={maxHourly}
                />
              </div>
            </Tabs.Content>

            <Tabs.Content value="payments" style={{ paddingTop: "16px" }}>
              <div style={{ padding: "16px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
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
              </div>
            </Tabs.Content>

            <Tabs.Content value="products" style={{ paddingTop: "16px" }}>
              <div style={{ padding: "16px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
                  Top productos más vendidos — {PERIOD_LABELS[period]}
                </Text>
                {topProducts.length === 0 ? (
                  <Text size="2" color="gray">No hay datos de productos</Text>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {topProducts.map((product, i) => (
                      <div
                        key={product.productId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "8px 12px",
                          backgroundColor: "var(--bg-surface)",
                          borderRadius: "6px",
                        }}
                      >
                        <Text size="1" color="gray" style={{ width: "20px", textAlign: "right" }}>
                          {i + 1}
                        </Text>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text size="2" weight="bold" style={{ display: "block" }}>
                            {product.productName}
                          </Text>
                          <Text size="1" color="gray">{product.productCode}</Text>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ textAlign: "right" }}>
                            <Text size="1" color="gray">Unidades</Text>
                            <Text size="2" weight="bold" style={{ display: "block" }}>
                              {product.quantity}
                            </Text>
                          </div>
                          <div style={{ textAlign: "right", minWidth: "80px" }}>
                            <Text size="1" color="gray">Total</Text>
                            <Text size="2" weight="bold" color="green" style={{ display: "block" }}>
                              ${(product.total_cents / 100).toLocaleString("es-AR")}
                            </Text>
                          </div>
                          <div style={{ width: "100px" }}>
                            <div style={{ height: "6px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "3px", overflow: "hidden" }}>
                              <div
                                style={{
                                  height: "100%",
                                  width: `${(product.total_cents / 100 / maxProductRevenue) * 100}%`,
                                  backgroundColor: "var(--accent)",
                                  borderRadius: "3px",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tabs.Content>

            <Tabs.Content value="inventory" style={{ paddingTop: "16px" }}>
              {!inventoryReport ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Text size="2" color="gray">No hay datos de inventario</Text>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* KPI Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                    <div style={{ padding: "14px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                      <Text size="1" color="gray">Productos</Text>
                      <Text size="5" weight="bold" style={{ display: "block", marginTop: "4px" }}>
                        {inventoryReport.totalProducts}
                      </Text>
                    </div>
                    <div style={{ padding: "14px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                      <Text size="1" color="gray">Valor stock</Text>
                      <Text size="5" weight="bold" color="green" style={{ display: "block", marginTop: "4px" }}>
                        ${inventoryReport.totalStockValue.toLocaleString("es-AR")}
                      </Text>
                    </div>
                    <div style={{ padding: "14px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                      <Text size="1" color="gray">Stock bajo</Text>
                      <Text size="5" weight="bold" color="orange" style={{ display: "block", marginTop: "4px" }}>
                        {inventoryReport.lowStockCount}
                      </Text>
                    </div>
                    <div style={{ padding: "14px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                      <Text size="1" color="gray">Sin stock</Text>
                      <Text size="5" weight="bold" color="red" style={{ display: "block", marginTop: "4px" }}>
                        {inventoryReport.outOfStockCount}
                      </Text>
                    </div>
                  </div>

                  {/* Categories */}
                  {inventoryReport.byCategory.length > 0 && (
                    <div style={{ padding: "16px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                      <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
                        Valor por categoría
                      </Text>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {inventoryReport.byCategory.map((cat, i) => {
                          const pct = inventoryReport.totalStockValue > 0
                            ? Math.round((cat.value / inventoryReport.totalStockValue) * 100)
                            : 0;
                          return (
                            <div key={i} style={{ padding: "8px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                <Text size="2">{cat.category ?? "Sin categoría"}</Text>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                  <Text size="2" weight="bold">${cat.value.toLocaleString("es-AR")}</Text>
                                  <Text size="1" color="gray">({cat.count} prod.)</Text>
                                </div>
                              </div>
                              <div style={{ height: "6px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, backgroundColor: "var(--accent)", borderRadius: "3px" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Low Stock Products */}
                  {inventoryReport.lowStockProducts.length > 0 && (
                    <div style={{ padding: "16px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <ExclamationTriangleIcon width={16} height={16} color="orange" />
                        <Text size="3" weight="bold">Productos con stock bajo</Text>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {inventoryReport.lowStockProducts.map((p) => (
                          <div key={p.productId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
                            <div>
                              <Text size="2" weight="bold">{p.productName}</Text>
                              <Text size="1" color="gray">{p.productCode}</Text>
                            </div>
                            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                              <Badge color="orange" variant="soft" size="1">{p.stockQuantity} uds.</Badge>
                              <Text size="2" color="gray">${p.price.toLocaleString("es-AR")}</Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Out of Stock Products */}
                  {inventoryReport.outOfStockProducts.length > 0 && (
                    <div style={{ padding: "16px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <CrossCircledIcon width={16} height={16} color="red" />
                        <Text size="3" weight="bold">Productos sin stock</Text>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {inventoryReport.outOfStockProducts.map((p) => (
                          <div key={p.productId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
                            <div>
                              <Text size="2" weight="bold">{p.productName}</Text>
                              <Text size="1" color="gray">{p.productCode}</Text>
                            </div>
                            <Badge color="red" variant="soft" size="1">Sin stock</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {inventoryReport.lowStockProducts.length === 0 && inventoryReport.outOfStockProducts.length === 0 && (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <CheckCircledIcon width={20} height={20} color="green" />
                      <Text size="2" color="gray" style={{ display: "block", marginTop: "8px" }}>
                        Todo en orden — no hay productos con stock bajo o sin stock
                      </Text>
                    </div>
                  )}
                </div>
              )}
            </Tabs.Content>

            <Tabs.Content value="cash" style={{ paddingTop: "16px" }}>
              {shifts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Text size="2" color="gray">No hay turnos de caja registrados</Text>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* KPI Cards */}
                  {(() => {
                    const totalSales = shifts.reduce((s, sh) => s + sh.totalSalesCents / 100, 0);
                    let totalDiff = 0;
                    for (const sh of shifts) {
                      if (sh.closingAmount != null) {
                        const expected = sh.openingAmount + sh.totalSalesCents / 100 + sh.incomeCents / 100 - sh.expenseCents / 100;
                        totalDiff += sh.closingAmount - expected;
                      }
                    }
                    const totalMovements = shifts.reduce((s, sh) => s + sh.movementCount, 0);
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                        <div style={{ padding: "14px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                          <Text size="1" color="gray">Turnos</Text>
                          <Text size="5" weight="bold" style={{ display: "block", marginTop: "4px" }}>{shifts.length}</Text>
                        </div>
                        <div style={{ padding: "14px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                          <Text size="1" color="gray">Ventas totales</Text>
                          <Text size="5" weight="bold" color="green" style={{ display: "block", marginTop: "4px" }}>
                            ${totalSales.toLocaleString("es-AR")}
                          </Text>
                        </div>
                        <div style={{ padding: "14px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                          <Text size="1" color="gray">Diferencia neta</Text>
                          <Text size="5" weight="bold" color={totalDiff >= 0 ? "green" : "red"} style={{ display: "block", marginTop: "4px" }}>
                            {totalDiff >= 0 ? "+" : ""}${Math.abs(totalDiff).toLocaleString("es-AR")}
                          </Text>
                        </div>
                        <div style={{ padding: "14px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                          <Text size="1" color="gray">Movimientos</Text>
                          <Text size="5" weight="bold" style={{ display: "block", marginTop: "4px" }}>{totalMovements}</Text>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Shifts list */}
                  <div style={{ padding: "16px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                    <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
                      Historial de turnos
                    </Text>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {shifts.map((shift) => {
                        const expected = shift.openingAmount + shift.totalSalesCents / 100 + shift.incomeCents / 100 - shift.expenseCents / 100;
                        const diff = shift.closingAmount != null ? shift.closingAmount - expected : 0;
                        const diffColor = diff === 0 ? "green" : diff > 0 ? "blue" : "red";
                        return (
                          <div key={shift.id} style={{ padding: "12px", backgroundColor: "var(--bg-surface)", borderRadius: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                              <div>
                                <Text size="2" weight="bold">{shift.name}</Text>
                                <Text size="1" color="gray">
                                  {shift.openedAt ? new Date(shift.openedAt * 1000).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                </Text>
                              </div>
                              <Badge color={diffColor as "green" | "blue" | "red"} variant="soft" size="1">
                                {diff === 0 ? "Cuadrado" : diff > 0 ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`}
                              </Badge>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", fontSize: "12px" }}>
                              <div><Text size="1" color="gray">Apertura</Text><Text size="2" weight="bold" style={{ display: "block" }}>${shift.openingAmount.toFixed(2)}</Text></div>
                              <div><Text size="1" color="gray">Ventas</Text><Text size="2" weight="bold" style={{ display: "block" }}>${(shift.totalSalesCents / 100).toLocaleString("es-AR")}</Text></div>
                              <div><Text size="1" color="gray">Ingresos</Text><Text size="2" weight="bold" color="green" style={{ display: "block" }}>+${(shift.incomeCents / 100).toFixed(2)}</Text></div>
                              <div><Text size="1" color="gray">Egresos</Text><Text size="2" weight="bold" color="red" style={{ display: "block" }}>-${(shift.expenseCents / 100).toFixed(2)}</Text></div>
                            </div>
                            {shift.paymentSummary.length > 0 && (
                              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
                                <Text size="1" color="gray" style={{ display: "block", marginBottom: "4px" }}>Métodos de pago</Text>
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                  {shift.paymentSummary.map((pm, i) => (
                                    <Badge key={i} color="gray" variant="soft" size="1">
                                      {pm.payment_method}: ${(pm.total_cents / 100).toLocaleString("es-AR")} ({pm.count} op.)
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {shift.closingAmount != null && (
                              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                                <Text size="1" color="gray">Esperado: ${expected.toFixed(2)}</Text>
                                <Text size="1" weight="bold">
                                  Cierre: ${shift.closingAmount.toFixed(2)}
                                </Text>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </Tabs.Content>
          </Tabs.Root>
        </>
      )}
    </div>
  );
}
