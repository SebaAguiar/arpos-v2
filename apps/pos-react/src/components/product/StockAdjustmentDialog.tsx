import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  Button,
  TextField,
  Text,
  Flex,
  Select,
} from "@radix-ui/themes";
import { ExclamationTriangleIcon, PlusIcon, MinusIcon, UpdateIcon } from "@radix-ui/react-icons";
import { InventoryService } from "@/services/inventory.service";
import type { Product } from "@/lib/types";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess: () => void;
}

type MovementType = "INCOME" | "EXPENSE" | "ADJUSTMENT";

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const [movType, setMovType] = useState<MovementType>("INCOME");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStock = product?.variants?.[0]?.stockItems?.[0]?.quantity ?? 0;

  useEffect(() => {
    if (open) {
      setMovType("INCOME");
      setQuantity("1");
      setReason("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!product) return;
      setError(null);

      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        setError("Ingresá una cantidad mayor a 0.");
        return;
      }

      if (!reason.trim()) {
        setError("Ingresá un motivo para el movimiento (ej. Compra de proveedor, merma, recuento).");
        return;
      }

      setSubmitting(true);
      try {
        await InventoryService.createMovement({
          productId: product.id,
          type: movType,
          quantity: qty,
          reason: reason.trim(),
        });
        onSuccess();
        onOpenChange(false);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo registrar el movimiento de stock.";
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [product, quantity, reason, movType, onSuccess, onOpenChange]
  );

  if (!product) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 440, padding: "24px" }}>
        <Dialog.Title style={{ marginBottom: "4px" }}>
          Ajustar Stock — {product.name}
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" style={{ marginBottom: "16px" }}>
          Stock actual: <strong style={{ color: "var(--text-primary)" }}>{currentStock} unidades</strong>
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            {error && (
              <Flex
                align="center"
                gap="2"
                style={{
                  padding: "10px 12px",
                  backgroundColor: "var(--color-danger-subtle)",
                  border: "1px solid var(--color-danger)",
                  borderRadius: "6px",
                }}
              >
                <ExclamationTriangleIcon color="var(--color-danger)" />
                <Text size="2" color="red">
                  {error}
                </Text>
              </Flex>
            )}

            <div>
              <Text size="1" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
                Tipo de movimiento *
              </Text>
              <Select.Root value={movType} onValueChange={(v) => setMovType(v as MovementType)}>
                <Select.Trigger style={{ width: "100%" }} aria-label="Tipo de movimiento de stock" />
                <Select.Content style={{ height: "auto" }}>
                  <Select.Item value="INCOME">
                    <Flex align="center" gap="2">
                      <PlusIcon color="green" />
                      <span>Ingreso (Compra / Entrante)</span>
                    </Flex>
                  </Select.Item>
                  <Select.Item value="EXPENSE">
                    <Flex align="center" gap="2">
                      <MinusIcon color="red" />
                      <span>Egreso (Merma / Salida)</span>
                    </Flex>
                  </Select.Item>
                  <Select.Item value="ADJUSTMENT">
                    <Flex align="center" gap="2">
                      <UpdateIcon color="blue" />
                      <span>Re-conteo (Ajuste directo)</span>
                    </Flex>
                  </Select.Item>
                </Select.Content>
              </Select.Root>
            </div>

            <div>
              <Text size="1" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
                Cantidad *
              </Text>
              <TextField.Root
                type="number"
                min="1"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                aria-label="Cantidad a mover"
              />
            </div>

            <div>
              <Text size="1" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
                Motivo / Notas *
              </Text>
              <TextField.Root
                placeholder="Ej. Factura A 0001-00045, Rotura de stock..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                aria-label="Motivo del movimiento de stock"
              />
            </div>

            <Flex justify="end" gap="3" style={{ marginTop: "16px" }}>
              <Dialog.Close>
                <Button type="button" variant="soft" color="gray">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Registrando..." : "Guardar movimiento"}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
