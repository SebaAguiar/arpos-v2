import { safeInvoke } from "@/lib/tauri";
import type { BackupInfo } from "@/lib/types";

export const BackupService = {
  async create(): Promise<BackupInfo> {
    return safeInvoke<BackupInfo>("create_backup");
  },

  async list(): Promise<BackupInfo[]> {
    return safeInvoke<BackupInfo[]>("list_backups");
  },

  async restore(backupPath: string): Promise<string> {
    return safeInvoke<string>("restore_backup", { backupPath });
  },

  async delete(backupPath: string): Promise<string> {
    return safeInvoke<string>("delete_backup", { backupPath });
  },

  async auto(): Promise<BackupInfo | null> {
    return safeInvoke<BackupInfo | null>("auto_backup");
  },
};
