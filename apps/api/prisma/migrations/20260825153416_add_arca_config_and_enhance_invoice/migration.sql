-- CreateTable
CREATE TABLE "arca_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT,
    "cuit" INTEGER NOT NULL,
    "certificate" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "point_of_sale" INTEGER NOT NULL DEFAULT 1,
    "environment" TEXT NOT NULL DEFAULT 'homologacion',
    "responsabilidad_iva" TEXT NOT NULL DEFAULT 'RI',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" INTEGER NOT NULL DEFAULT 0,
    "updated_at" INTEGER NOT NULL,
    CONSTRAINT "arca_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "arca_configs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "arcaConfigId" TEXT,
    "type" TEXT NOT NULL,
    "document_type" TEXT NOT NULL DEFAULT 'B',
    "number" TEXT,
    "point_of_sale" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "customer_name" TEXT NOT NULL,
    "customer_tax_id" TEXT NOT NULL,
    "customer_address" TEXT,
    "customer_email" TEXT,
    "total_cents" INTEGER NOT NULL,
    "net_amount_cents" INTEGER NOT NULL,
    "tax_amount_cents" INTEGER NOT NULL,
    "cae" TEXT,
    "cae_expiration" TEXT,
    "qr_data" TEXT,
    "arca_response" TEXT,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "issued_at" INTEGER,
    "created_at" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoices_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoices_arcaConfigId_fkey" FOREIGN KEY ("arcaConfigId") REFERENCES "arca_configs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_invoices" ("cae", "cae_expiration", "companyId", "created_at", "customer_address", "customer_email", "customer_name", "customer_tax_id", "id", "net_amount_cents", "number", "saleId", "tax_amount_cents", "total_cents", "type") SELECT "cae", "cae_expiration", "companyId", "created_at", "customer_address", "customer_email", "customer_name", "customer_tax_id", "id", "net_amount_cents", "number", "saleId", "tax_amount_cents", "total_cents", "type" FROM "invoices";
DROP TABLE "invoices";
ALTER TABLE "new_invoices" RENAME TO "invoices";
CREATE UNIQUE INDEX "invoices_saleId_key" ON "invoices"("saleId");
CREATE INDEX "invoices_companyId_created_at_idx" ON "invoices"("companyId", "created_at");
CREATE INDEX "invoices_companyId_number_idx" ON "invoices"("companyId", "number");
CREATE INDEX "invoices_companyId_status_idx" ON "invoices"("companyId", "status");
CREATE UNIQUE INDEX "invoices_companyId_document_type_point_of_sale_number_key" ON "invoices"("companyId", "document_type", "point_of_sale", "number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "arca_configs_storeId_key" ON "arca_configs"("storeId");

-- CreateIndex
CREATE INDEX "arca_configs_companyId_idx" ON "arca_configs"("companyId");
