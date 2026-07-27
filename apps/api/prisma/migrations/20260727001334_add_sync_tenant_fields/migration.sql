/*
  Warnings:

  - Added the required column `companyId` to the `sync_queue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `sync_queue` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sync_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "synced_at" INTEGER,
    "created_at" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_sync_queue" ("action", "created_at", "entity", "entityId", "id", "payload", "status", "synced_at") SELECT "action", "created_at", "entity", "entityId", "id", "payload", "status", "synced_at" FROM "sync_queue";
DROP TABLE "sync_queue";
ALTER TABLE "new_sync_queue" RENAME TO "sync_queue";
CREATE INDEX "sync_queue_status_idx" ON "sync_queue"("status");
CREATE INDEX "sync_queue_companyId_storeId_status_idx" ON "sync_queue"("companyId", "storeId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
