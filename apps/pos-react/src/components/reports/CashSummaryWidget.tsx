import type { CashShiftData } from "@/repositories/cash-register.repository";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { StatTile } from "@/components/ui/StatTile";

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
    <SummaryCard title="Caja">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "auto" }}>
        <StatTile label="Turnos" value={shifts.length} />
        <StatTile
          label="Ventas totales"
          value={`$${totalSales.toLocaleString("es-AR")}`}
          color="green"
        />
        <StatTile
          label="Diferencia neta"
          value={`${totalDiff >= 0 ? "+" : ""}$${Math.abs(totalDiff).toLocaleString("es-AR")}`}
          color={totalDiff >= 0 ? "green" : "red"}
        />
        <StatTile label="Movimientos" value={totalMovements} />
      </div>
    </SummaryCard>
  );
}
