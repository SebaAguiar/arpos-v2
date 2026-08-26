-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "reason" TEXT;
ALTER TABLE "invoices" ADD COLUMN "reference_invoice_id" TEXT;
ALTER TABLE "invoices" ADD COLUMN "reference_type" TEXT;

-- CreateIndex
CREATE INDEX "invoices_companyId_reference_invoice_id_idx" ON "invoices"("companyId", "reference_invoice_id");
