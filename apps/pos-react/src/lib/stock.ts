import type { Product, ProductVariant } from "./types";

export function getProductStock(product: Product): number {
  if (product.stockQuantity !== undefined) {
    return Math.max(0, product.stockQuantity);
  }
  return product.variants.reduce(
    (sum, v) => sum + v.stockItems.reduce((s, si) => s + si.quantity, 0),
    0,
  );
}

export function getVariantStock(variant: ProductVariant): number {
  if (variant.stockQuantity !== undefined) {
    return Math.max(0, variant.stockQuantity);
  }
  return variant.stockItems.reduce((sum, si) => sum + si.quantity, 0);
}