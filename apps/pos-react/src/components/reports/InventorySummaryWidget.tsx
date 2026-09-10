import { Text, Badge } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import type { InventoryReportData } from "@/repositories/inventory.repository";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { StatTile } from "@/components/ui/StatTile";

export interface InventorySummaryWidgetProps {
  report: InventoryReportData | null;
}

export function InventorySummaryWidget({ report }: InventorySummaryWidgetProps) {
  if (!report) {
    return (
      <SummaryCard title="Inventario">
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text size="2" color="gray">No hay datos de inventario</Text>
        </div>
      </SummaryCard>
    );
  }

  return (
    <SummaryCard title="Inventario">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "auto" }}>
        <StatTile label="Productos" value={report.totalProducts} />
        <StatTile label="Valor stock" value={`$${report.totalStockValue.toLocaleString("es-AR")}`} color="green" />
        <StatTile label="Stock bajo" value={report.lowStockCount} color="orange" />
        <StatTile label="Sin stock" value={report.outOfStockCount} color="red" />
      </div>
      {(report.lowStockProducts.length > 0 || report.outOfStockProducts.length > 0) && (
        <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {report.outOfStockProducts.length > 0 && (
            <Badge color="red" variant="soft" size="1">
              {report.outOfStockProducts.length} agotados
            </Badge>
          )}
          {report.lowStockProducts.length > 0 && (
            <Badge color="orange" variant="soft" size="1">
              <ExclamationTriangleIcon width={10} height={10} />
              {report.lowStockProducts.length} con stock bajo
            </Badge>
          )}
        </div>
      )}
    </SummaryCard>
  );
}
