import { create } from "zustand";
import { BackupRepository } from "@/repositories/backup.repository";
import type { BackupInfo } from "@/lib/types";

interface BackupState {
  backups: BackupInfo[];
  loading: boolean;
  creating: boolean;
  restoring: boolean;
  error: string | null;

  fetchBackups: () => Promise<void>;
  createBackup: () => Promise<void>;
  restoreBackup: (path: string) => Promise<void>;
  deleteBackup: (path: string) => Promise<void>;
  clearError: () => void;
}

export const useBackupStore = create<BackupState>()((set, get) => ({
  backups: [],
  loading: false,
  creating: false,
  restoring: false,
  error: null,

  fetchBackups: async () => {
    set({ loading: true, error: null });
    try {
      const backups = await BackupRepository.listBackups();
      set({ backups, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  createBackup: async () => {
    set({ creating: true, error: null });
    try {
      await BackupRepository.createBackup();
      const backups = await BackupRepository.listBackups();
      set({ backups, creating: false });
    } catch (e) {
      set({ error: String(e), creating: false });
    }
  },

  restoreBackup: async (path: string) => {
    set({ restoring: true, error: null });
    try {
      await BackupRepository.restoreBackup(path);
      set({ restoring: false });
    } catch (e) {
      set({ error: String(e), restoring: false });
    }
  },

  deleteBackup: async (path: string) => {
    set({ error: null });
    try {
      await BackupRepository.deleteBackup(path);
      const backups = get().backups.filter((b) => b.path !== path);
      set({ backups });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  clearError: () => set({ error: null }),
}));
