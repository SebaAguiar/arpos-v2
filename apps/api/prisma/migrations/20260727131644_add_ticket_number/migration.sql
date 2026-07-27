-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "cash_register_id" TEXT,
    "user_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "ticket_number" INTEGER NOT NULL DEFAULT 0,
    "total_cents" INTEGER NOT NULL,
    "discount_cents" INTEGER NOT NULL DEFAULT 0,
    "tax_cents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "payment_method" TEXT NOT NULL,
    "payment_details" TEXT,
    "notes" TEXT,
    "synced_at" INTEGER,
    "created_at" INTEGER NOT NULL DEFAULT 0,
    "updated_at" INTEGER NOT NULL,
    CONSTRAINT "sales_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sales_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sales" ("cash_register_id", "companyId", "contact_id", "created_at", "discount_cents", "id", "notes", "payment_details", "payment_method", "status", "storeId", "synced_at", "tax_cents", "total_cents", "updated_at", "user_id") SELECT "cash_register_id", "companyId", "contact_id", "created_at", "discount_cents", "id", "notes", "payment_details", "payment_method", "status", "storeId", "synced_at", "tax_cents", "total_cents", "updated_at", "user_id" FROM "sales";
DROP TABLE "sales";
ALTER TABLE "new_sales" RENAME TO "sales";
CREATE INDEX "sales_companyId_storeId_idx" ON "sales"("companyId", "storeId");
CREATE INDEX "sales_companyId_storeId_ticket_number_idx" ON "sales"("companyId", "storeId", "ticket_number");
CREATE INDEX "sales_created_at_idx" ON "sales"("created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
