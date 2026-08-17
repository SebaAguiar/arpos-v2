import { create } from "zustand";
import { UpdaterRepository } from "@/repositories/updater.repository";
import type { UpdateInfo } from "@/lib/types";

interface UpdaterState {
  updateInfo: UpdateInfo | null;
  checking: boolean;
  downloading: boolean;
  downloadedTo: string | null;
  error: string | null;

  checkForUpdates: (currentVersion: string) => Promise<void>;
  downloadUpdate: () => Promise<void>;
  clearError: () => void;
}

export const useUpdaterStore = create<UpdaterState>()((set, get) => ({
  updateInfo: null,
  checking: false,
  downloading: false,
  downloadedTo: null,
  error: null,

  checkForUpdates: async (currentVersion: string) => {
    set({ checking: true, error: null, downloadedTo: null });
    try {
      const updateInfo = await UpdaterRepository.checkForUpdates(currentVersion);
      set({ updateInfo, checking: false });
    } catch (e) {
      set({ error: String(e), checking: false });
    }
  },

  downloadUpdate: async () => {
    const { updateInfo } = get();
    if (!updateInfo?.available || !updateInfo.download_url) return;

    set({ downloading: true, error: null });
    try {
      const { appDataDir, join } = await import("@tauri-apps/api/path");
      const dir = await appDataDir();
      const filename = updateInfo.download_url.split("/").pop() ?? "Arcom-update.zip";
      const destPath = await join(dir, filename);
      const downloadedTo = await UpdaterRepository.download(updateInfo.download_url, destPath);
      set({ downloadedTo, downloading: false });
    } catch (e) {
      set({ error: String(e), downloading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
