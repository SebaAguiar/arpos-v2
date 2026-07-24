import { MinusIcon, PlusIcon, Cross1Icon } from "@radix-ui/react-icons";
import type { CartItem as CartItemType } from "@/lib/types";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
          {item.variantLabel && (
            <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
              {" "}
              ({item.variantLabel})
            </span>
          )}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          ${item.price.toLocaleString("es-AR")} x {item.quantity}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          aria-label={`Disminuir cantidad de ${item.name}`}
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            backgroundColor: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <MinusIcon width={14} height={14} />
        </button>
        <span style={{ fontSize: "13px", color: "var(--text-primary)", minWidth: "24px", textAlign: "center", fontWeight: 500 }}>
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          aria-label={`Aumentar cantidad de ${item.name}`}
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            backgroundColor: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <PlusIcon width={14} height={14} />
        </button>
      </div>

      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", minWidth: "80px", textAlign: "right" }}>
        ${(item.price * item.quantity).toLocaleString("es-AR")}
      </span>

      <button
        onClick={() => onRemove(item.id)}
        aria-label={`Eliminar ${item.name} del carrito`}
        style={{
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          backgroundColor: "transparent",
          color: "var(--accent)",
          cursor: "pointer",
          borderRadius: "6px",
        }}
      >
        <Cross1Icon width={14} height={14} />
      </button>
    </div>
  );
}
