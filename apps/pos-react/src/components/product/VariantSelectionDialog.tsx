import { Dialog, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import type { Product, ProductVariant } from "@/lib/types";
import { getProductStock } from "@/lib/stock";

interface VariantSelectionDialogProps {
  product: Product;
  onSelect: (product: Product, variant: ProductVariant) => void;
  onClose: () => void;
}

function getStock(variant: ProductVariant): number {
  return variant.stockItems.reduce((sum, si) => sum + si.quantity, 0);
}

export function VariantSelectionDialog({
  product,
  onSelect,
  onClose,
}: VariantSelectionDialogProps) {
  const totalStock = getProductStock(product);
  const hasStock = totalStock > 0;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Content style={{ maxWidth: 420, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
            <Dialog.Title style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
              Seleccionar Variante
            </Dialog.Title>
            <Text size="2" color="gray" style={{ marginTop: "2px" }}>
              {product.name}
            </Text>
          </div>
          <Dialog.Close>
            <button
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
              <Cross2Icon width={18} height={18} />
            </button>
          </Dialog.Close>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {product.variants.map((variant) => {
            const stock = getStock(variant);
            const available = stock > 0 ? stock : totalStock;
            const price = variant.price ?? product.price;

            return (
              <button
                key={variant.id}
                onClick={() => onSelect(product, variant)}
                disabled={!hasStock}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--bg-surface)",
                  cursor: hasStock ? "pointer" : "not-allowed",
                  opacity: hasStock ? 1 : 0.5,
                  transition: "border-color 150ms ease",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                    {variant.size && (
                      <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", backgroundColor: "var(--bg-page)", color: "var(--text-secondary)" }}>
                        {variant.size}
                      </span>
                    )}
                    {variant.color && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                        <span
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            border: "1px solid var(--border)",
                            backgroundColor: variant.color,
                          }}
                        />
                        {variant.color}
                      </span>
                    )}
                    {!variant.size && !variant.color && <span>Estándar</span>}
                  </div>
                  {variant.sku && (
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                      SKU: {variant.sku}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--accent)" }}>
                    ${price.toLocaleString("es-AR")}
                  </div>
                  {available > 0 ? (
                    <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-success)" }}>
                      {available} disponibles
                    </div>
                  ) : (
                    <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-danger)" }}>
                      Sin stock
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}