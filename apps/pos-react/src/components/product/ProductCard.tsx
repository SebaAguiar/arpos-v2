import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const totalStock = product.variants.reduce(
    (sum, v) => sum + v.stockItems.reduce((s, si) => s + si.quantity, 0),
    0
  );

  const variantCount = product.variants.length;
  const hasMultipleVariants = variantCount > 1;

  const price = product.price;

  const colorLabels = product.variants
    .filter((v) => v.color)
    .map((v) => v.color!)
    .filter((c, i, arr) => arr.indexOf(c) === i)
    .slice(0, 3);

  return (
    <button
      onClick={() => onAddToCart(product)}
      className="product-card"
      aria-label={`Agregar ${product.name} al carrito`}
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "12px",
        cursor: "pointer",
        textAlign: "left",
        gap: "6px",
        transition: "border-color 150ms ease",
      }}
    >
      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
        {product.name}
      </span>

      {hasMultipleVariants && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 500,
            padding: "2px 6px",
            borderRadius: "4px",
            width: "fit-content",
            color: "var(--accent)",
            backgroundColor: "var(--accent-subtle)",
          }}
        >
          {variantCount} variantes
        </span>
      )}

      {colorLabels.length > 0 && (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {colorLabels.map((color) => (
            <span
              key={color}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                border: "1px solid var(--border)",
                backgroundColor: color,
                display: "inline-block",
              }}
              title={color}
            />
          ))}
        </div>
      )}

      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
        ${price.toLocaleString("es-AR")}
      </span>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 500,
          padding: "2px 6px",
          borderRadius: "4px",
          width: "fit-content",
          color: totalStock > 5 ? "var(--color-success)" : totalStock > 0 ? "var(--color-warning)" : "var(--color-danger)",
          backgroundColor: totalStock > 5 ? "var(--color-success-subtle)" : totalStock > 0 ? "var(--color-warning-subtle)" : "var(--color-danger-subtle)",
        }}
      >
        Stock: {totalStock}
      </span>
    </button>
  );
}
