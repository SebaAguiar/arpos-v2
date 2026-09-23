import { useEffect, useState } from "react";
import { Button, IconButton, Tooltip } from "@radix-ui/themes";
import { DownloadIcon, ReloadIcon } from "@radix-ui/react-icons";
import { useUpdaterStore } from "@/stores/updater.store";
import { isTauri, getAppVersion } from "@/lib/tauri";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function UpdateButton() {
  const {
    updateInfo,
    checking,
    downloading,
    error,
    checkForUpdates,
    downloadAndInstall,
  } = useUpdaterStore();
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!isTauri()) return;

    getAppVersion()
      .then(setCurrentVersion)
      .catch(() => setCurrentVersion(null));

    void checkForUpdates();

    const interval = setInterval(() => {
      void checkForUpdates();
    }, UPDATE_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  if (!isTauri()) return null;

  if (updateInfo?.available) {
    return (
      <Tooltip content={currentVersion ? `Versión actual: ${currentVersion}` : "Actualización disponible"}>
        <Button
          size="1"
          variant="soft"
          color="green"
          disabled={checking || downloading}
          onClick={() => void downloadAndInstall()}
          style={{ cursor: "pointer" }}
        >
          {downloading ? (
            <ReloadIcon width={12} height={12} />
          ) : (
            <DownloadIcon width={12} height={12} />
          )}
          {downloading ? "Actualizando..." : `Actualizar (${updateInfo.version})`}
        </Button>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={error ?? (checking ? "Buscando actualizaciones..." : "Buscar actualizaciones")}>
      <IconButton
        variant="ghost"
        size="1"
        onClick={() => void checkForUpdates()}
        style={{ cursor: "pointer", color: error ? "var(--red-9)" : "var(--text-secondary)" }}
      >
        {checking ? <ReloadIcon width={16} height={16} /> : <DownloadIcon width={16} height={16} />}
      </IconButton>
    </Tooltip>
  );
}