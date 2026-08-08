import { Text } from "@radix-ui/themes";
import type { ApiTopProduct } from "@/services/sales.service";

export interface TopProductsListProps {
  products: ApiTopProduct[];
  limit?: number;
  title?: string;
}

export function TopProductsList({
  products,
  limit = 10,
  title = "Top productos más vendidos",
}: TopProductsListProps) {
  const list = products.slice(0, limit);
  const maxProductRevenue = Math.max(
    ...list.map((p) => p.total_cents / 100),
    1,
  );

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "var(--bg-surface-hover)",
        borderRadius: "8px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
        {title}
      </Text>
      {list.length === 0 ? (
        <Text size="2" color="gray" style={{ marginTop: "8px" }}>
          No hay datos de productos
        </Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          {list.map((product, i) => (
            <div
              key={product.productId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 12px",
                backgroundColor: "var(--bg-surface)",
                borderRadius: "6px",
              }}
            >
              <Text
                size="1"
                color="gray"
                style={{ width: "20px", textAlign: "right", flexShrink: 0 }}
              >
                {i + 1}
              </Text>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  size="2"
                  weight="bold"
                  style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {product.productName}
                </Text>
                <Text size="1" color="gray">
                  {product.productCode}
                </Text>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <Text size="1" color="gray">Unidades</Text>
                  <Text size="2" weight="bold" style={{ display: "block" }}>
                    {product.quantity}
                  </Text>
                </div>
                <div style={{ textAlign: "right", minWidth: "80px" }}>
                  <Text size="1" color="gray">Total</Text>
                  <Text size="2" weight="bold" color="green" style={{ display: "block" }}>
                    ${(product.total_cents / 100).toLocaleString("es-AR")}
                  </Text>
                </div>
                <div style={{ width: "100px" }}>
                  <div
                    style={{
                      height: "6px",
                      backgroundColor: "var(--bg-surface-hover)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(product.total_cents / 100 / maxProductRevenue) * 100}%`,
                        backgroundColor: "var(--accent)",
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
