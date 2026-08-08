import { Text } from "@radix-ui/themes";
import type { CashShiftData } from "@/repositories/cash-register.repository";

export interface CashSummaryWidgetProps {
  shifts: CashShiftData[];
}

export function CashSummaryWidget({ shifts }: CashSummaryWidgetProps) {
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
    <div
      style={{
        padding: "16px",
        backgroundColor: "var(--bg-surface-hover)",
        borderRadius: "8px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
        Caja
      </Text>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "auto" }}>
        <div style={{ padding: "10px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
          <Text size="1" color="gray">Turnos</Text>
          <Text size="4" weight="bold" style={{ display: "block", marginTop: "4px" }}>
            {shifts.length}
          </Text>
        </div>
        <div style={{ padding: "10px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
          <Text size="1" color="gray">Ventas totales</Text>
          <Text size="4" weight="bold" color="green" style={{ display: "block", marginTop: "4px" }}>
            ${totalSales.toLocaleString("es-AR")}
          </Text>
        </div>
        <div style={{ padding: "10px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
          <Text size="1" color="gray">Diferencia neta</Text>
          <Text
            size="4"
            weight="bold"
            color={totalDiff >= 0 ? "green" : "red"}
            style={{ display: "block", marginTop: "4px" }}
          >
            {totalDiff >= 0 ? "+" : ""}${Math.abs(totalDiff).toLocaleString("es-AR")}
          </Text>
        </div>
        <div style={{ padding: "10px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
          <Text size="1" color="gray">Movimientos</Text>
          <Text size="4" weight="bold" style={{ display: "block", marginTop: "4px" }}>
            {totalMovements}
          </Text>
        </div>
      </div>
    </div>
  );
}
