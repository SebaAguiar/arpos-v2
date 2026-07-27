import type { Product, ProductVariant } from "@/lib/types";

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
      tabIndex={-1}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "12px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: "420px",
          maxHeight: "80vh",
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
              Seleccionar Variante
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
              {product.name}
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Variants list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {product.variants.map((variant) => {
            const stock = getStock(variant);
            const price = variant.price ?? product.price;

            return (
              <button
                key={variant.id}
                onClick={() => onSelect(product, variant)}
                disabled={stock <= 0}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--bg-surface)",
                  cursor: stock > 0 ? "pointer" : "not-allowed",
                  opacity: stock > 0 ? 1 : 0.5,
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
                  {stock > 0 ? (
                    <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-success)" }}>
                      {stock} disponibles
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
      </div>
    </div>
  );
}
