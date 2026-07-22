import { Text, Card } from "@radix-ui/themes";
import { BarChartIcon } from "@radix-ui/react-icons";

export function ReportsPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <BarChartIcon width={20} height={20} />
        <Text size="5" weight="bold">Reportes</Text>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <Card>
          <Text size="2" color="gray">Ventas hoy</Text>
          <Text size="6" weight="bold" style={{ display: "block", marginTop: "4px" }}>$0</Text>
        </Card>
        <Card>
          <Text size="2" color="gray">Ticket promedio</Text>
          <Text size="6" weight="bold" style={{ display: "block", marginTop: "4px" }}>$0</Text>
        </Card>
        <Card>
          <Text size="2" color="gray">Productos vendidos</Text>
          <Text size="6" weight="bold" style={{ display: "block", marginTop: "4px" }}>0</Text>
        </Card>
      </div>

      <Card style={{ marginTop: "16px" }}>
        <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
          Gráfico de ventas
        </Text>
        <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Text size="2" color="gray">Próximamente — gráfico de ventas diarias</Text>
        </div>
      </Card>
    </div>
  );
}
