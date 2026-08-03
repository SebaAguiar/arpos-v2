import { useState } from "react";
import { TextField, Text } from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";

interface CustomItemDialogProps {
  onAdd: (name: string, price: number, quantity: number) => void;
  onClose: () => void;
}

export function CustomItemDialog({ onAdd, onClose }: CustomItemDialogProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const parsedPrice = Number(price);
  const parsedQuantity = Number(quantity);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("El precio debe ser mayor a 0");
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      setError("La cantidad debe ser un número entero mayor a 0");
      return;
    }
    onAdd(trimmedName, parsedPrice, parsedQuantity);
  };

  return (
    <div
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Agregar ítem custom"
      tabIndex={-1}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "12px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: "360px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>
              Ítem Custom
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Producto sin ficha en el catálogo
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              color: "var(--text-secondary)",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Text size="2" color="gray">
                Nombre
              </Text>
              <TextField.Root
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Pack promocional"
                autoFocus
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Text size="2" color="gray">
                Precio
              </Text>
              <TextField.Root
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Text size="2" color="gray">
                Cantidad
              </Text>
              <TextField.Root
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
              />
            </label>

            {error && (
              <Text size="2" style={{ color: "var(--color-danger)" }}>
                {error}
              </Text>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <PlusIcon width={14} height={14} />
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
