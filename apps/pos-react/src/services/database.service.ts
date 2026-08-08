import { safeInvoke } from "@/lib/tauri";
import type { DatabaseInfo } from "@/lib/types";

export const DatabaseService = {
  async init(): Promise<string> {
    return safeInvoke<string>("init_database");
  },

  async runMigrations(): Promise<string> {
    return safeInvoke<string>("run_migrations");
  },

  async pushSchema(): Promise<string> {
    return safeInvoke<string>("push_schema");
  },

  async checkIntegrity(): Promise<boolean> {
    return safeInvoke<boolean>("check_db_integrity");
  },

  async info(): Promise<DatabaseInfo> {
    return safeInvoke<DatabaseInfo>("get_database_info");
  },

  async ensure(): Promise<string> {
    return safeInvoke<string>("ensure_database");
  },
};
