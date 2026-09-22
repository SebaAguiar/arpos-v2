-- Add stock_quantity to product_variants (replaces product-level stock)
-- The variant is now the unit of sale and owns price/stock; the product
-- becomes a generic container with a default of 0.

ALTER TABLE "product_variants" ADD COLUMN "stock_quantity" INTEGER NOT NULL DEFAULT 0;

-- Backfill: seed the first (earliest) variant of each product with the
-- product's current stock so existing products without explicit variants
-- keep their totals. Later variants default to 0.
UPDATE "product_variants"
SET "stock_quantity" = COALESCE(
  (
    SELECT p."stock_quantity"
    FROM "products" p
    WHERE p."id" = "product_variants"."productId"
  ),
  0
)
WHERE "product_variants"."id" IN (
  SELECT "id" FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "productId"
        ORDER BY "created_at" ASC, "id" ASC
      ) AS "rn"
    FROM "product_variants"
  ) ranked
  WHERE "rn" = 1
);