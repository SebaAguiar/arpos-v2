-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_arca_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT,
    "cuit" BIGINT NOT NULL,
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
INSERT INTO "new_arca_configs" ("active", "certificate", "companyId", "created_at", "cuit", "environment", "id", "point_of_sale", "privateKey", "responsabilidad_iva", "storeId", "updated_at") SELECT "active", "certificate", "companyId", "created_at", "cuit", "environment", "id", "point_of_sale", "privateKey", "responsabilidad_iva", "storeId", "updated_at" FROM "arca_configs";
DROP TABLE "arca_configs";
ALTER TABLE "new_arca_configs" RENAME TO "arca_configs";
CREATE UNIQUE INDEX "arca_configs_storeId_key" ON "arca_configs"("storeId");
CREATE INDEX "arca_configs_companyId_idx" ON "arca_configs"("companyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;