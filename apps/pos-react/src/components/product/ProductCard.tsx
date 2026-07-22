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
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: "8px",
        padding: "12px",
        cursor: "pointer",
        textAlign: "left",
        gap: "6px",
        transition: "border-color 150ms ease",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "#e54d2e")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "#2a2a2a")
      }
    >
      <span style={{ fontSize: "14px", fontWeight: 600, color: "#ededed" }}>
        {product.name}
      </span>
      <span style={{ fontSize: "13px", color: "#888" }}>
        ${product.price.toLocaleString("es-AR")}
      </span>
      <span
        style={{
          fontSize: "11px",
          color: totalStock > 5 ? "#30a46c" : totalStock > 0 ? "#f5a623" : "#e54d2e",
        }}
      >
        Stock: {totalStock}
      </span>
    </button>
  );
}
