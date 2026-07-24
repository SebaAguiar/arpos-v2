import { useMemo } from "react";
import { Text, TextField, Badge } from "@radix-ui/themes";
import { PersonIcon, BackpackIcon } from "@radix-ui/react-icons";
import { useCartStore } from "@/stores/cart.store";

interface SummaryPanelProps {
  onCharge: () => void;
  onCustomerClick: () => void;
}

export function SummaryPanel({ onCharge, onCustomerClick }: SummaryPanelProps) {
  const items = useCartStore((s) => s.items);
  const discount = useCartStore((s) => s.discount);
  const discountType = useCartStore((s) => s.discountType);
  const taxRate = useCartStore((s) => s.taxRate);
  const customerName = useCartStore((s) => s.customerName);
  const setDiscount = useCartStore((s) => s.setDiscount);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  const taxAmount = subtotal * taxRate;
  const discountAmount =
    discountType === "percentage" ? subtotal * (discount / 100) : discount;
  const total = subtotal + taxAmount - discountAmount;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div
      style={{
        padding: "16px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Customer */}
      <button
        onClick={onCustomerClick}
        aria-label="Seleccionar o cambiar cliente"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 10px",
          border: customerName ? "1px solid var(--color-info)" : "1px solid var(--border)",
          borderRadius: "6px",
          backgroundColor: customerName ? "var(--color-info-subtle)" : "transparent",
          color: customerName ? "var(--color-info)" : "var(--text-secondary)",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: customerName ? 500 : 400,
          width: "100%",
          textAlign: "left",
        }}
      >
        <PersonIcon width={14} height={14} />
        {customerName || "Seleccionar cliente"}
      </button>

      {/* Subtotal */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Text size="2" color="gray">
          Subtotal ({itemCount} items)
        </Text>
        <Text size="2">${subtotal.toLocaleString("es-AR")}</Text>
      </div>

      {/* Tax */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Text size="2" color="gray">
          IVA ({(taxRate * 100).toFixed(0)}%)
        </Text>
        <Text size="2">${taxAmount.toLocaleString("es-AR")}</Text>
      </div>

      {/* Discount */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Text size="2" color="gray" style={{ flex: 1 }}>
          Descuento
        </Text>
        <TextField.Root
          size="1"
          type="number"
          value={discount || ""}
          onChange={(e) => setDiscount(Number(e.target.value), discountType)}
          placeholder="0"
          style={{ width: "80px" }}
        />
        <Badge
          color={discountType === "percentage" ? "orange" : "blue"}
          variant="soft"
          size="1"
          style={{ cursor: "pointer" }}
          onClick={() =>
            setDiscount(
              discount,
              discountType === "percentage" ? "fixed" : "percentage"
            )
          }
        >
          {discountType === "percentage" ? "%" : "$"}
        </Badge>
      </div>

      {discountAmount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text size="2" style={{ color: "var(--color-danger)" }}>
            Descuento
          </Text>
          <Text size="2" style={{ color: "var(--color-danger)" }}>
            -${discountAmount.toLocaleString("es-AR")}
          </Text>
        </div>
      )}

      {/* Total */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 0",
          borderTop: "1px solid var(--border)",
        }}
      >
        <Text size="4" weight="bold">
          Total
        </Text>
        <Text size="4" weight="bold" color="orange">
          ${total.toLocaleString("es-AR")}
        </Text>
      </div>

      {/* Charge button */}
      <button
        onClick={onCharge}
        disabled={items.length === 0}
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor: items.length === 0 ? "var(--bg-surface)" : "var(--accent)",
          color: items.length === 0 ? "var(--text-secondary)" : "#fff",
          border: "none",
          borderRadius: "6px",
          fontSize: "15px",
          fontWeight: 600,
          cursor: items.length === 0 ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "background-color 150ms ease",
        }}
      >
        <BackpackIcon width={16} height={16} />
        Cobrar
      </button>
    </div>
  );
}
