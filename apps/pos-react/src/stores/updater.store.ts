import { create } from "zustand";
import { UpdaterRepository } from "@/repositories/updater.repository";
import type { UpdateInfo } from "@/lib/types";

interface UpdaterState {
  updateInfo: UpdateInfo | null;
  checking: boolean;
  downloading: boolean;
  error: string | null;

  checkForUpdates: () => Promise<void>;
  downloadAndInstall: () => Promise<void>;
  clearError: () => void;
}

export const useUpdaterStore = create<UpdaterState>()((set, get) => ({
  updateInfo: null,
  checking: false,
  downloading: false,
  error: null,

  checkForUpdates: async () => {
    set({ checking: true, error: null, updateInfo: null });
    try {
      const updateInfo = await UpdaterRepository.checkForUpdates();
      set({ updateInfo, checking: false });
    } catch (e) {
      set({ error: String(e), checking: false });
    }
  },

  downloadAndInstall: async () => {
    const { updateInfo } = get();
    if (!updateInfo?.available) return;

    set({ downloading: true, error: null });
    try {
      await UpdaterRepository.downloadAndInstall();
      // Windows exits the process during install; macOS/Linux relaunch here.
      // If we reach this line without relaunching, stop the spinner.
      set({ downloading: false });
    } catch (e) {
      set({ downloading: false, error: String(e) });
    }
  },

  clearError: () => set({ error: null }),
}));