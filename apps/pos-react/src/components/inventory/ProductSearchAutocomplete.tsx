import { useState, useMemo } from "react";
import { TextField, Text } from "@radix-ui/themes";
import { MagnifyingGlassIcon, Cross2Icon } from "@radix-ui/react-icons";
import type { StockItemData } from "@/repositories/inventory.repository";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface ProductSearchAutocompleteProps {
  items: StockItemData[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: StockItemData) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function ProductSearchAutocomplete({
  items,
  value,
  onChange,
  onSelect,
  inputRef,
}: ProductSearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const debouncedValue = useDebouncedValue(value, 200);

  const suggestions = useMemo(() => {
    if (!debouncedValue.trim()) return [];
    const q = debouncedValue.toLowerCase().trim();
    return items
      .filter(
        (item) =>
          item.productName.toLowerCase().includes(q) ||
          item.productCode.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [debouncedValue, items]);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
      <TextField.Root
        ref={inputRef as unknown as React.Ref<HTMLInputElement>}
        placeholder="Buscar por nombre o código..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        aria-label="Buscar producto por nombre o código"
        autoComplete="off"
      >
        <TextField.Slot>
          <MagnifyingGlassIcon width={16} height={16} />
        </TextField.Slot>
        {value && (
          <TextField.Slot>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Cross2Icon width={14} height={14} />
            </button>
          </TextField.Slot>
        )}
      </TextField.Root>

      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: "240px",
            overflowY: "auto",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            zIndex: 100,
            marginTop: "4px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          {suggestions.map((item) => (
            <div
              key={item.productId}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderBottom: "1px solid var(--border)",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
                setIsOpen(false);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Text size="2" weight="medium" style={{ display: "block" }}>
                {item.productName}
              </Text>
              <Text size="1" color="gray" style={{ fontFamily: "monospace" }}>
                {item.productCode} — Stock: {item.stockQuantity}
              </Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
