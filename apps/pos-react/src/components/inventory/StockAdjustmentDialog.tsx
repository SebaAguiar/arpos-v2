import { useState, useEffect } from "react";
import { Text, TextField, Select, Button } from "@radix-ui/themes";
import { Cross1Icon, PlusIcon, MinusIcon } from "@radix-ui/react-icons";
import { useInventoryStore } from "@/stores/inventory.store";
import { FormActions } from "@/components/ui/FormActions";

interface StockAdjustmentDialogProps {
  preselectedProductId?: string | null;
  onClose: () => void;
}

export function StockAdjustmentDialog({ preselectedProductId, onClose }: StockAdjustmentDialogProps) {
  const stock = useInventoryStore((s) => s.stock);
  const loading = useInventoryStore((s) => s.loading);
  const error = useInventoryStore((s) => s.error);
  const fetchStock = useInventoryStore((s) => s.fetchStock);
  const createMovement = useInventoryStore((s) => s.createMovement);
  const clearError = useInventoryStore((s) => s.clearError);

  useEffect(() => {
    if (stock.length === 0) fetchStock();
  }, [stock.length, fetchStock]);

  const [productId, setProductId] = useState(preselectedProductId ?? "");
  const [type, setType] = useState<"entry" | "exit" | "adjustment">("entry");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const selectedProduct = stock.find((p) => p.productId === productId);

  const handleSubmit = async () => {
    const qty = parseInt(quantity, 10);
    if (!productId || isNaN(qty) || qty === 0 || !reason.trim()) return;

    await createMovement({
      productId,
      type,
      quantity: type === "exit" ? -qty : qty,
      reason: reason.trim(),
    });
    onClose();
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
          width: "480px",
          padding: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <Text size="4" weight="bold">Registrar movimiento</Text>
          <button
            onClick={onClose}
            style={{ backgroundColor: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
          >
            <Cross1Icon width={18} height={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#e54d2e15",
              border: "1px solid #e54d2e30",
              borderRadius: "6px",
              marginBottom: "12px",
              cursor: "pointer",
            }}
            onClick={clearError}
          >
            <Text size="2" color="red">{error}</Text>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <Text size="2" color="gray" style={{ display: "block", marginBottom: "4px" }}>Producto</Text>
            <Select.Root value={productId} onValueChange={setProductId}>
              <Select.Trigger style={{ width: "100%" }} placeholder="Seleccionar producto" />
              <Select.Content position="popper">
                {stock.map((item) => (
                  <Select.Item key={item.productId} value={item.productId}>
                    {item.productCode} - {item.productName} (stock: {item.stockQuantity})
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>

          <div>
            <Text size="2" color="gray" style={{ display: "block", marginBottom: "4px" }}>Tipo</Text>
            <Select.Root value={type} onValueChange={(v) => setType(v as typeof type)}>
              <Select.Trigger style={{ width: "100%" }} />
              <Select.Content position="popper">
                <Select.Item value="entry">
                  <PlusIcon width={12} /> Entrada
                </Select.Item>
                <Select.Item value="exit">
                  <MinusIcon width={12} /> Salida
                </Select.Item>
                <Select.Item value="adjustment">
                  Ajuste
                </Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          <div>
            <Text size="2" color="gray" style={{ display: "block", marginBottom: "4px" }}>Cantidad</Text>
            <TextField.Root
              type="number"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {selectedProduct && (
              <Text size="1" color="gray" style={{ display: "block", marginTop: "4px" }}>
                Stock actual: {selectedProduct.stockQuantity}
              </Text>
            )}
          </div>

          <div>
            <Text size="2" color="gray" style={{ display: "block", marginBottom: "4px" }}>Razón</Text>
            <TextField.Root
              placeholder="Ej: Ingreso de mercadería, Ajuste por conteo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <FormActions marginTop="8px">
            <Button size="2" variant="soft" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              size="2"
              color="green"
              onClick={handleSubmit}
              disabled={loading || !productId || !quantity || !reason.trim()}
            >
              {loading ? "Guardando..." : "Registrar"}
            </Button>
          </FormActions>
        </div>
      </div>
    </div>
  );
}
