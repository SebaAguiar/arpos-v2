-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "barcode" TEXT,
    "sku" TEXT,
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "cost_cents" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" INTEGER NOT NULL DEFAULT 0,
    "updated_at" INTEGER NOT NULL,
    CONSTRAINT "product_variants_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "max_stock" INTEGER,
    "created_at" INTEGER NOT NULL DEFAULT 0,
    "updated_at" INTEGER NOT NULL,
    CONSTRAINT "inventory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_inventory" ("companyId", "created_at", "id", "max_stock", "min_stock", "productId", "quantity", "storeId", "updated_at") SELECT "companyId", "created_at", "id", "max_stock", "min_stock", "productId", "quantity", "storeId", "updated_at" FROM "inventory";
DROP TABLE "inventory";
ALTER TABLE "new_inventory" RENAME TO "inventory";
CREATE UNIQUE INDEX "inventory_storeId_productId_key" ON "inventory"("storeId", "productId");
CREATE TABLE "new_inventory_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "created_at" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "inventory_movements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_movements_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_movements_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "inventory_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_inventory_movements" ("companyId", "created_at", "id", "productId", "quantity", "reason", "reference_id", "reference_type", "storeId", "type", "userId") SELECT "companyId", "created_at", "id", "productId", "quantity", "reason", "reference_id", "reference_type", "storeId", "type", "userId" FROM "inventory_movements";
DROP TABLE "inventory_movements";
ALTER TABLE "new_inventory_movements" RENAME TO "inventory_movements";
CREATE INDEX "inventory_movements_companyId_storeId_idx" ON "inventory_movements"("companyId", "storeId");
CREATE INDEX "inventory_movements_productId_idx" ON "inventory_movements"("productId");
CREATE INDEX "inventory_movements_created_at_idx" ON "inventory_movements"("created_at");
CREATE TABLE "new_sale_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "discount_cents" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sale_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sale_items" ("discount_cents", "id", "productId", "quantity", "saleId", "total_cents", "unit_price_cents") SELECT "discount_cents", "id", "productId", "quantity", "saleId", "total_cents", "unit_price_cents" FROM "sale_items";
DROP TABLE "sale_items";
ALTER TABLE "new_sale_items" RENAME TO "sale_items";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_companyId_barcode_key" ON "product_variants"("companyId", "barcode");
