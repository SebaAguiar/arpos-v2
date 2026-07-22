import { useState } from "react";
import { Text, Badge } from "@radix-ui/themes";
import { Cross1Icon, CalendarIcon } from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import type { Sale } from "@/lib/types";

const mockSales: Sale[] = [
  {
    id: "1",
    ticketNumber: 1001,
    total: 12500,
    status: "COMPLETED",
    createdAt: Math.floor(Date.now() / 1000),
    items: [
      { id: "i1", description: "Remera Básica", productName: "Remera Básica", quantity: 2, unitPrice: 2500, subtotal: 5000 },
      { id: "i2", description: "Jeans Clásico", productName: "Jeans Clásico", quantity: 1, unitPrice: 8900, subtotal: 8900 },
    ],
    paymentMethods: [{ method: "CASH", amount: 12500 }],
  },
  {
    id: "2",
    ticketNumber: 1002,
    total: 1800,
    status: "COMPLETED",
    createdAt: Math.floor(Date.now() / 1000) - 3600,
    items: [
      { id: "i3", description: "Gorro Lana", productName: "Gorro Lana", quantity: 1, unitPrice: 1800, subtotal: 1800 },
    ],
    paymentMethods: [{ method: "DEBIT", amount: 1800 }],
  },
];

type Period = "today" | "week" | "month";

export function SalesHistoryDialog() {
  const [period, setPeriod] = useState<Period>("today");
  const closeSalesHistory = useDialogStore((s) => s.closeSalesHistory);

  const filteredSales = mockSales;

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
        {/* Header */}
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

        {/* Period tabs */}
        <div style={{ display: "flex", gap: "4px", padding: "12px 20px" }}>
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
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

        {/* Sales list */}
        <div style={{ flex: 1, overflow: "auto", padding: "0 20px" }}>
          {filteredSales.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <CalendarIcon width={32} height={32} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
              <Text size="2" color="gray">
                No hay ventas en este período
              </Text>
            </div>
          ) : (
            filteredSales.map((sale) => (
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
                      #{sale.ticketNumber}
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

        {/* Summary */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Text size="2" color="gray">
            {filteredSales.length} ventas
          </Text>
          <Text size="2" weight="bold">
            Total: ${filteredSales.reduce((s, sale) => s + sale.total, 0).toLocaleString("es-AR")}
          </Text>
        </div>
      </div>
    </div>
  );
}
