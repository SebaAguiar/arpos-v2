import { DatabaseService } from "@/services/database.service";
import { SystemService } from "@/services/system.service";
import { ExportService } from "@/services/export.service";
import type { DatabaseInfo, ExportResult, SystemInfo } from "@/lib/types";

export const SystemRepository = {
  async getInfo(): Promise<SystemInfo> {
    return SystemService.info();
  },

  async getDatabaseInfo(): Promise<DatabaseInfo> {
    return DatabaseService.info();
  },

  async checkIntegrity(): Promise<boolean> {
    return DatabaseService.checkIntegrity();
  },

  async runMigrations(): Promise<string> {
    return DatabaseService.runMigrations();
  },

  async exportToSql(): Promise<ExportResult> {
    return ExportService.toSql();
  },

  async exportToJson(): Promise<ExportResult> {
    return ExportService.toJson();
  },
};
