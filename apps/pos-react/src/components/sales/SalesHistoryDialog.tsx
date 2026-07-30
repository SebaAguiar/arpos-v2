import { useState, useEffect, useCallback, useMemo } from "react";
import { Text, Badge } from "@radix-ui/themes";
import { Cross1Icon, CalendarIcon } from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { SalesRepository } from "@/repositories/sales.repository";
import { printReceipt } from "@/services/receipt.service";
import { useCompanyStore } from "@/stores/company.store";
import { useSettingsStore } from "@/stores/settings.store";
import type { Sale, StoreConfig } from "@/lib/types";

type Period = "today" | "week" | "month";

function getPeriodTimestamps(period: Period): { from?: number; to?: number } {
  const now = Math.floor(Date.now() / 1000);
  switch (period) {
    case "today": {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return { from: Math.floor(todayStart.getTime() / 1000), to: now };
    }
    case "week":
      return { from: now - 7 * 86400, to: now };
    case "month":
      return { from: now - 30 * 86400, to: now };
  }
}

export function SalesHistoryDialog() {
  const [period, setPeriod] = useState<Period>("today");
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const closeSalesHistory = useDialogStore((s) => s.closeSalesHistory);
  const company = useCompanyStore((s) => s.company);
  const fetchCompany = useCompanyStore((s) => s.fetchCompany);
  const receiptHeader = useSettingsStore((s) => s.receiptHeader);
  const receiptFooter = useSettingsStore((s) => s.receiptFooter);

  const storeConfig: StoreConfig | null = useMemo(() => {
    if (!company) return null;
    return {
      name: company.name,
      address: company.address,
      phone: company.phone,
      email: company.email,
      taxRate: 0,
      creditSurcharge: 0,
      receiptHeader,
      receiptFooter,
    };
  }, [company, receiptHeader, receiptFooter]);

  const fetchSales = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const { from, to } = getPeriodTimestamps(p);
      const data = await SalesRepository.getAll({ from, to });
      setSales(data);
    } catch {
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales(period);
    if (!company) fetchCompany();
  }, [period, fetchSales, company, fetchCompany]);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
  };

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
          width: "600px",
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
          <Text size="4" weight="bold">
            Historial de ventas
          </Text>
          <button
            onClick={closeSalesHistory}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
          >
            <Cross1Icon width={18} height={18} />
          </button>
        </div>

        <div style={{ display: "flex", gap: "4px", padding: "12px 20px" }}>
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              style={{
                padding: "6px 14px",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                backgroundColor: period === p ? "var(--bg-surface-hover)" : "transparent",
                color: period === p ? "var(--text-primary)" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: period === p ? 600 : 400,
              }}
            >
              {p === "today" ? "Hoy" : p === "week" ? "Esta semana" : "Este mes"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "0 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Text size="2" color="gray">Cargando ventas...</Text>
            </div>
          ) : sales.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <CalendarIcon width={32} height={32} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
              <Text size="2" color="gray">
                No hay ventas en este período
              </Text>
            </div>
          ) : (
            sales.map((sale) => (
              <div
                key={sale.id}
                style={{
                  padding: "12px",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Text size="2" weight="bold">
                      #{sale.ticketNumber || sale.id.slice(0, 8)}
                    </Text>
                    <Badge
                      color={sale.status === "COMPLETED" ? "green" : "red"}
                      variant="soft"
                      size="1"
                    >
                      {sale.status === "COMPLETED" ? "Completada" : "Cancelada"}
                    </Badge>
                  </div>
                  <Text size="3" weight="bold" color="orange">
                    ${sale.total.toLocaleString("es-AR")}
                  </Text>
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  {new Date(sale.createdAt * 1000).toLocaleString("es-AR")}
                </div>

                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {sale.paymentMethods.map((pm, i) => (
                    <Badge key={i} color="blue" variant="soft" size="1">
                      {pm.method}: ${pm.amount.toLocaleString("es-AR")}
                    </Badge>
                  ))}
                </div>

                <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => printReceipt(sale, storeConfig)}
                    style={{
                      padding: "4px 8px",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      backgroundColor: "transparent",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: "11px",
                    }}
                  >
                    Imprimir
                  </button>
                  {sale.status === "COMPLETED" && (
                    <button
                      style={{
                        padding: "4px 8px",
                        border: "1px solid var(--accent)",
                        borderRadius: "4px",
                        backgroundColor: "transparent",
                        color: "var(--accent)",
                        cursor: "pointer",
                        fontSize: "11px",
                      }}
                    >
                      Anular
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Text size="2" color="gray">
            {sales.length} ventas
          </Text>
          <Text size="2" weight="bold">
            Total: ${sales.reduce((s, sale) => s + sale.total, 0).toLocaleString("es-AR")}
          </Text>
        </div>
      </div>
    </div>
  );
}
