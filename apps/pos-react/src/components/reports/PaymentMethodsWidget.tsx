import { Text } from "@radix-ui/themes";
import { HorizontalBar } from "./HorizontalBar";

export interface PaymentMethodDistribution {
  method: string;
  label: string;
  percentage: number;
  color: string;
}

export interface PaymentMethodsWidgetProps {
  distribution: PaymentMethodDistribution[];
}

export function PaymentMethodsWidget({ distribution }: PaymentMethodsWidgetProps) {
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
        Medios de pago
      </Text>
      {distribution.length === 0 ? (
        <Text size="2" color="gray" style={{ marginTop: "8px" }}>
          No hay datos de pagos
        </Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {distribution.map((p) => (
            <HorizontalBar key={p.method} label={p.label} percentage={p.percentage} color={p.color} />
          ))}
        </div>
      )}
    </div>
  );
}
