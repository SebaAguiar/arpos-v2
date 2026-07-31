import { invoke } from "@tauri-apps/api/core";
import type { DatabaseInfo } from "@/lib/types";

export const DatabaseService = {
  async init(): Promise<string> {
    return invoke<string>("init_database");
  },

  async runMigrations(): Promise<string> {
    return invoke<string>("run_migrations");
  },

  async pushSchema(): Promise<string> {
    return invoke<string>("push_schema");
  },

  async checkIntegrity(): Promise<boolean> {
    return invoke<boolean>("check_db_integrity");
  },

  async info(): Promise<DatabaseInfo> {
    return invoke<DatabaseInfo>("get_database_info");
  },

  async ensure(): Promise<string> {
    return invoke<string>("ensure_database");
  },
};
