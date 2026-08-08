import type { KeyboardEvent, MouseEvent } from "react";
import { PlusIcon } from "@radix-ui/react-icons";
import type { Product } from "@/lib/types";
import { getProductStock } from "@/lib/stock";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const totalStock = getProductStock(product);

  const variantCount = product.variants.length;
  const hasMultipleVariants = variantCount > 1;
  const isOutOfStock = totalStock === 0;

  const price = product.price;

  const colorLabels = product.variants
    .filter((v) => v.color)
    .map((v) => v.color!)
    .filter((c, i, arr) => arr.indexOf(c) === i)
    .slice(0, 3);

  const handleAdd = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  return (
    <div
      className="product-card"
      role="button"
      tabIndex={isOutOfStock ? -1 : 0}
      aria-disabled={isOutOfStock}
      aria-label={`Agregar ${product.name} al carrito`}
      onClick={() => {
        if (isOutOfStock) return;
        onAddToCart(product);
      }}
      onKeyDown={(e) => {
        if (isOutOfStock) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAddToCart(product);
        }
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "12px",
        cursor: isOutOfStock ? "not-allowed" : "pointer",
        textAlign: "left",
        gap: "6px",
        opacity: isOutOfStock ? 0.55 : 1,
        transition: "border-color 150ms ease",
      }}
    >
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: "100%",
            height: "64px",
            objectFit: "cover",
            borderRadius: "4px",
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}

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

      <span style={{ fontSize: "19px", fontWeight: 700, color: "var(--text-primary)" }}>
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
        {isOutOfStock ? "Agotado" : `Stock: ${totalStock}`}
      </span>

      <button
        onClick={handleAdd}
        disabled={isOutOfStock}
        aria-label={`Agregar ${product.name} al carrito`}
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          padding: "8px 0",
          border: "1px solid var(--accent)",
          borderRadius: "6px",
          backgroundColor: "var(--accent-subtle)",
          color: "var(--accent)",
          fontSize: "13px",
          fontWeight: 600,
          cursor: isOutOfStock ? "not-allowed" : "pointer",
          opacity: isOutOfStock ? 0.6 : 1,
          transition: "background-color 150ms ease",
        }}
      >
        <PlusIcon width={14} height={14} />
        {isOutOfStock ? "Agotado" : "Agregar"}
      </button>
    </div>
  );
}
