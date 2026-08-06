import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Text, TextField } from "@radix-ui/themes";
import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import type { StockItemData } from "@/repositories/inventory.repository";

interface StockInlineEditorProps {
  item: StockItemData;
  onSave: (productId: string, type: "entry" | "exit", quantity: number) => void;
}

export function StockInlineEditor({ item, onSave }: StockInlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(item.stockQuantity));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commit = () => {
    const newValue = parseInt(inputValue, 10);
    const current = item.stockQuantity;
    const delta = newValue - current;

    if (isNaN(newValue) || newValue < 0 || delta === 0) {
      setInputValue(String(item.stockQuantity));
      setIsEditing(false);
      return;
    }

    if (delta > 0) {
      onSave(item.productId, "entry", delta);
    } else {
      onSave(item.productId, "exit", Math.abs(delta));
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setInputValue(String(item.stockQuantity));
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <TextField.Root
          ref={inputRef as unknown as React.Ref<HTMLInputElement>}
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ width: "70px" }}
        />
        <button
          type="button"
          onClick={commit}
          style={{
            border: "none",
            background: "transparent",
            color: "var(--color-success)",
            cursor: "pointer",
            padding: "2px",
            display: "inline-flex",
            alignItems: "center",
          }}
          aria-label="Confirmar cambio de stock"
        >
          <CheckIcon width={14} height={14} />
        </button>
        <button
          type="button"
          onClick={() => {
            setInputValue(String(item.stockQuantity));
            setIsEditing(false);
          }}
          style={{
            border: "none",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: "2px",
            display: "inline-flex",
            alignItems: "center",
          }}
          aria-label="Cancelar cambio de stock"
        >
          <Cross2Icon width={14} height={14} />
        </button>
      </div>
    );
  }

  const minStock = item.minStock ?? 5;
  const isOutOfStock = item.stockQuantity <= 0;
  const isLowStock = item.stockQuantity > 0 && item.stockQuantity <= minStock;

  return (
    <Text
      size="3"
      weight="bold"
      color={isOutOfStock ? "red" : isLowStock ? "orange" : undefined}
      style={{
        cursor: "pointer",
        padding: "2px 6px",
        borderRadius: "4px",
        transition: "background-color 0.15s",
      }}
      onDoubleClick={() => {
        setInputValue(String(item.stockQuantity));
        setIsEditing(true);
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      title="Doble click para editar stock"
    >
      {item.stockQuantity}
    </Text>
  );
}
