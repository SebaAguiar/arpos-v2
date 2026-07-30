import { invoke } from "@tauri-apps/api/core";
import type { BackupInfo } from "@/lib/types";

export const BackupService = {
  async create(): Promise<BackupInfo> {
    return invoke<BackupInfo>("create_backup");
  },

  async list(): Promise<BackupInfo[]> {
    return invoke<BackupInfo[]>("list_backups");
  },

  async restore(backupPath: string): Promise<string> {
    return invoke<string>("restore_backup", { backupPath });
  },

  async delete(backupPath: string): Promise<string> {
    return invoke<string>("delete_backup", { backupPath });
  },

  async auto(): Promise<BackupInfo | null> {
    return invoke<BackupInfo | null>("auto_backup");
  },
};
