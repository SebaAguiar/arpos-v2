import { Text, Badge } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import type { InventoryReportData } from "@/repositories/inventory.repository";

export interface InventorySummaryWidgetProps {
  report: InventoryReportData | null;
}

export function InventorySummaryWidget({ report }: InventorySummaryWidgetProps) {
  if (!report) {
    return (
      <div
        style={{
          padding: "16px",
          backgroundColor: "var(--bg-surface-hover)",
          borderRadius: "8px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text size="2" color="gray">No hay datos de inventario</Text>
      </div>
    );
  }

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
        Inventario
      </Text>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "auto" }}>
        <div style={{ padding: "10px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
          <Text size="1" color="gray">Productos</Text>
          <Text size="4" weight="bold" style={{ display: "block", marginTop: "4px" }}>
            {report.totalProducts}
          </Text>
        </div>
        <div style={{ padding: "10px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
          <Text size="1" color="gray">Valor stock</Text>
          <Text size="4" weight="bold" color="green" style={{ display: "block", marginTop: "4px" }}>
            ${report.totalStockValue.toLocaleString("es-AR")}
          </Text>
        </div>
        <div style={{ padding: "10px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
          <Text size="1" color="gray">Stock bajo</Text>
          <Text size="4" weight="bold" color="orange" style={{ display: "block", marginTop: "4px" }}>
            {report.lowStockCount}
          </Text>
        </div>
        <div style={{ padding: "10px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
          <Text size="1" color="gray">Sin stock</Text>
          <Text size="4" weight="bold" color="red" style={{ display: "block", marginTop: "4px" }}>
            {report.outOfStockCount}
          </Text>
        </div>
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
    </div>
  );
}
