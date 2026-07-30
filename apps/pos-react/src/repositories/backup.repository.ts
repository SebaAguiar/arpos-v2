import { BackupService } from "@/services/backup.service";
import type { BackupInfo } from "@/lib/types";

export const BackupRepository = {
  async createBackup(): Promise<BackupInfo> {
    return BackupService.create();
  },

  async listBackups(): Promise<BackupInfo[]> {
    return BackupService.list();
  },

  async restoreBackup(backupPath: string): Promise<string> {
    return BackupService.restore(backupPath);
  },

  async deleteBackup(backupPath: string): Promise<string> {
    return BackupService.delete(backupPath);
  },
};
