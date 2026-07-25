import { useEffect, useState } from "react";
import { Text, Select, Badge } from "@radix-ui/themes";
import { Cross1Icon, CalendarIcon } from "@radix-ui/react-icons";
import { useInventoryStore } from "@/stores/inventory.store";

interface StockMovementsDialogProps {
  preselectedProductId?: string | null;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  sale: "Venta",
  entry: "Entrada",
  exit: "Salida",
  adjustment: "Ajuste",
};

const TYPE_COLORS: Record<string, "green" | "red" | "blue" | "orange"> = {
  sale: "red",
  entry: "green",
  exit: "orange",
  adjustment: "blue",
};

export function StockMovementsDialog({ preselectedProductId, onClose }: StockMovementsDialogProps) {
  const movements = useInventoryStore((s) => s.movements);
  const loading = useInventoryStore((s) => s.loading);
  const error = useInventoryStore((s) => s.error);
  const fetchMovements = useInventoryStore((s) => s.fetchMovements);
  const clearError = useInventoryStore((s) => s.clearError);

  const [productId] = useState(preselectedProductId ?? "");
  const [typeFilter, setTypeFilter] = useState<string>("");

  useEffect(() => {
    const filters: { productId?: string; type?: string } = {};
    if (productId) filters.productId = productId;
    if (typeFilter) filters.type = typeFilter;
    fetchMovements(filters);
  }, [productId, typeFilter, fetchMovements]);

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
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <Text size="4" weight="bold">Historial de movimientos</Text>
          <button
            onClick={onClose}
            style={{ backgroundColor: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
          >
            <Cross1Icon width={18} height={18} />
          </button>
        </div>

        <div style={{ padding: "12px 20px", display: "flex", gap: "8px" }}>
          <Select.Root value={typeFilter} onValueChange={setTypeFilter}>
            <Select.Trigger style={{ width: "140px" }} placeholder="Todos los tipos" />
            <Select.Content>
              <Select.Item value="">Todos</Select.Item>
              <Select.Item value="sale">Ventas</Select.Item>
              <Select.Item value="entry">Entradas</Select.Item>
              <Select.Item value="exit">Salidas</Select.Item>
              <Select.Item value="adjustment">Ajustes</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>

        {error && (
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#e54d2e15",
              border: "1px solid #e54d2e30",
              borderRadius: "6px",
              margin: "0 20px 8px",
              cursor: "pointer",
            }}
            onClick={clearError}
          >
            <Text size="2" color="red">{error}</Text>
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto", padding: "0 20px 16px" }}>
          {loading && movements.length === 0 ? (
            <Text size="2" color="gray" style={{ display: "block", textAlign: "center", padding: "24px" }}>
              Cargando...
            </Text>
          ) : movements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <CalendarIcon width={32} height={32} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
              <Text size="2" color="gray">No hay movimientos registrados</Text>
            </div>
          ) : (
            movements.map((mov) => (
              <div
                key={mov.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  backgroundColor: "var(--bg-surface-hover)",
                  borderRadius: "6px",
                  marginBottom: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                  <Badge color={TYPE_COLORS[mov.type] ?? "gray"} variant="soft" size="1">
                    {TYPE_LABELS[mov.type] ?? mov.type}
                  </Badge>
                  <div>
                    <Text size="2" style={{ display: "block" }}>
                      {mov.productCode && `${mov.productCode} - `}{mov.productName ?? mov.productId}
                    </Text>
                    <Text size="1" color="gray" style={{ display: "block" }}>{mov.reason}</Text>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Text
                    size="2"
                    weight="bold"
                    color={mov.quantity > 0 ? "green" : "red"}
                  >
                    {mov.quantity > 0 ? "+" : ""}{mov.quantity}
                  </Text>
                  <Text size="1" color="gray" style={{ display: "block" }}>
                    {new Date(mov.createdAt * 1000).toLocaleDateString("es-AR")}
                  </Text>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
