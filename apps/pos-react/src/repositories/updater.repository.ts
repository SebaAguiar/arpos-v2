import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { safeInvoke } from "@/lib/tauri";
import type { UpdateInfo, UpdatePlatformInfo } from "@/lib/types";

interface UpdaterEnvironment {
  format: string;
  os: string;
  arch: string;
}

interface ManifestPlatform {
  url: string;
  signature: string;
}

const FORMAT_LABELS: Record<string, string> = {
  deb: "DEB (.deb)",
  rpm: "RPM (.rpm)",
  appimage: "AppImage",
  msi: "MSI (.msi)",
  nsis: "EXE (.exe)",
  app: "macOS (.app)",
  dmg: "DMG (.dmg)",
};

function formatLabel(format: string): string {
  return FORMAT_LABELS[format] ?? format;
}

function parsePlatformTargets(rawJson: Record<string, unknown>): UpdatePlatformInfo[] {
  const rawPlatforms = (rawJson.platforms ?? {}) as Record<string, ManifestPlatform>;
  return Object.entries(rawPlatforms).map(([key, entry]) => {
    const [os, arch, ...rest] = key.split("-");
    const format = rest.length > 0 ? rest.join("-") : "appimage";
    return {
      key,
      os,
      arch,
      format,
      isFallback: rest.length === 0,
      label: formatLabel(format),
      url: entry.url,
    };
  });
}

function mostSpecificTarget(
  platforms: UpdatePlatformInfo[],
  env: UpdaterEnvironment,
): UpdatePlatformInfo | null {
  const withFormat = platforms.find(
    (p) => p.key === `${env.os}-${env.arch}-${env.format}`,
  );
  if (withFormat) return withFormat;
  const fallback = platforms.find((p) => p.key === `${env.os}-${env.arch}`);
  return fallback ?? null;
}

export const UpdaterRepository = {
  async checkForUpdates(): Promise<UpdateInfo> {
    const [update, env] = await Promise.all([
      check(),
      safeInvoke<UpdaterEnvironment>("get_updater_environment").catch(() => ({
        format: "unknown",
        os: "",
        arch: "",
      })),
    ]);
    if (!update) {
      return {
        available: false,
        version: "",
        notes: null,
        published_at: null,
        format: env.format,
        platforms: [],
        installerOptions: [],
        targetPlatform: null,
        canAutoInstall: true,
      };
    }

    const platforms = parsePlatformTargets(update.rawJson);
    const targetPlatform = mostSpecificTarget(platforms, env);
    const installerOptions = platforms.filter(
      (p) => !p.isFallback && p.os === env.os && p.arch === env.arch,
    );
    const canAutoInstall =
      targetPlatform !== null &&
      env.format !== "unknown" &&
      targetPlatform.format === env.format;

    return {
      available: true,
      version: update.version,
      notes: update.body ?? null,
      published_at: update.date ?? null,
      format: env.format,
      platforms,
      installerOptions,
      targetPlatform,
      canAutoInstall,
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

export { mostSpecificTarget, formatLabel };