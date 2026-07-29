-- Add balance_cents to contacts
ALTER TABLE contacts ADD COLUMN balance_cents INTEGER NOT NULL DEFAULT 0;

-- Create wallet_transactions table
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "balance_before" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reference" TEXT,
    "reference_id" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "wallet_transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "wallet_transactions_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "wallet_transactions_companyId_contactId_idx" ON "wallet_transactions"("companyId", "contactId");
CREATE INDEX "wallet_transactions_created_at_idx" ON "wallet_transactions"("created_at");
