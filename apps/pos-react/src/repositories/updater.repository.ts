import { UpdaterService } from "@/services/updater.service";
import type { UpdateInfo } from "@/lib/types";

export const UpdaterRepository = {
  async checkForUpdates(currentVersion: string, planSlug?: string | null): Promise<UpdateInfo> {
    return UpdaterService.checkForUpdates(currentVersion, planSlug);
  },

  async download(url: string, destPath: string): Promise<string> {
    return UpdaterService.download(url, destPath);
  },
};
