import { UpdaterService } from "@/services/updater.service";
import type { UpdateInfo } from "@/lib/types";

export const UpdaterRepository = {
  async checkForUpdates(currentVersion: string): Promise<UpdateInfo> {
    return UpdaterService.checkForUpdates(currentVersion);
  },

  async download(url: string, destPath: string): Promise<string> {
    return UpdaterService.download(url, destPath);
  },
};
