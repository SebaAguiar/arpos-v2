import type { Product } from "./types";

export function getProductStock(product: Product): number {
  if (product.stockQuantity !== undefined) {
    return Math.max(0, product.stockQuantity);
  }
  return product.variants.reduce(
    (sum, v) => sum + v.stockItems.reduce((s, si) => s + si.quantity, 0),
    0,
  );
}
