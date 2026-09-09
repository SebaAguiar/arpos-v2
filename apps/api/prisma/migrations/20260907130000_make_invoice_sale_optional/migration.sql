-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "saleId" TEXT,
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
    "reference_invoice_id" TEXT,
    "reference_type" TEXT,
    "reason" TEXT,
    CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoices_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "invoices_arcaConfigId_fkey" FOREIGN KEY ("arcaConfigId") REFERENCES "arca_configs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_invoices" ("arcaConfigId", "arca_response", "cae", "cae_expiration", "companyId", "created_at", "customer_address", "customer_email", "customer_name", "customer_tax_id", "document_type", "error_message", "id", "issued_at", "net_amount_cents", "number", "point_of_sale", "qr_data", "reason", "reference_invoice_id", "reference_type", "retry_count", "saleId", "status", "tax_amount_cents", "total_cents", "type") SELECT "arcaConfigId", "arca_response", "cae", "cae_expiration", "companyId", "created_at", "customer_address", "customer_email", "customer_name", "customer_tax_id", "document_type", "error_message", "id", "issued_at", "net_amount_cents", "number", "point_of_sale", "qr_data", "reason", "reference_invoice_id", "reference_type", "retry_count", "saleId", "status", "tax_amount_cents", "total_cents", "type" FROM "invoices";
DROP TABLE "invoices";
ALTER TABLE "new_invoices" RENAME TO "invoices";
CREATE UNIQUE INDEX "invoices_saleId_key" ON "invoices"("saleId");
CREATE INDEX "invoices_companyId_created_at_idx" ON "invoices"("companyId", "created_at");
CREATE INDEX "invoices_companyId_number_idx" ON "invoices"("companyId", "number");
CREATE INDEX "invoices_companyId_status_idx" ON "invoices"("companyId", "status");
CREATE INDEX "invoices_companyId_reference_invoice_id_idx" ON "invoices"("companyId", "reference_invoice_id");
CREATE UNIQUE INDEX "invoices_companyId_document_type_point_of_sale_number_key" ON "invoices"("companyId", "document_type", "point_of_sale", "number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;