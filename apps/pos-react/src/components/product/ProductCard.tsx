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
      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
        ${product.price.toLocaleString("es-AR")}
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
