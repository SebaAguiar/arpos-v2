import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import type { UpdateInfo } from "@/lib/types";

export const UpdaterRepository = {
  async checkForUpdates(): Promise<UpdateInfo> {
    const update = await check();
    if (!update) {
      return { available: false, version: "", notes: null, published_at: null };
    }
    return {
      available: true,
      version: update.version,
      notes: update.body ?? null,
      published_at: update.date ?? null,
    };
  },

  async downloadAndInstall(): Promise<void> {
    const update = await check();
    if (!update) return;
    // Windows: downloadAndInstall exits the app and launches the installer.
    // macOS/Linux: must relaunch explicitly to run the new version.
    await update.downloadAndInstall();
    await relaunch();
  },
};