import { invoke } from "@tauri-apps/api/core";
import type { UpdateInfo } from "@/lib/types";

export const UpdaterService = {
  async checkForUpdates(currentVersion: string): Promise<UpdateInfo> {
    return invoke<UpdateInfo>("check_for_updates", { currentVersion });
  },

  async download(url: string, destPath: string): Promise<string> {
    return invoke<string>("download_update", { url, destPath });
  },
};
