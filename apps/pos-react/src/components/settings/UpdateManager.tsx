import { useEffect, useState } from "react";
import { Text, Card, Button, Badge } from "@radix-ui/themes";
import {
  ReloadIcon,
  DownloadIcon,
  CheckCircledIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
import { useUpdaterStore } from "@/stores/updater.store";
import { getAppVersion } from "@/lib/tauri";

export function UpdateManager() {
  const {
    updateInfo,
    checking,
    downloading,
    downloadedTo,
    error,
    checkForUpdates,
    downloadUpdate,
    clearError,
  } = useUpdaterStore();

  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    getAppVersion()
      .then(setCurrentVersion)
      .catch(() => setCurrentVersion(null));
  }, []);

  return (
    <Card>
      <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
        Actualizaciones
      </Text>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 12px",
            backgroundColor: "var(--bg-surface-hover)",
            borderRadius: "6px",
            marginBottom: "12px",
          }}
        >
          <CrossCircledIcon width={14} height={14} color="var(--red-9)" />
          <Text size="2" color="red" style={{ flex: 1 }}>{error}</Text>
          <Button size="1" variant="ghost" onClick={clearError}>
            <CrossCircledIcon width={12} height={12} />
          </Button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {currentVersion && <Badge size="1" variant="soft">Versión actual: {currentVersion}</Badge>}

        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          <Button
            size="1"
            variant="soft"
            disabled={checking || !currentVersion}
            onClick={() => checkForUpdates(currentVersion ?? "")}
          >
            <ReloadIcon width={12} height={12} />
            {checking ? "Buscando..." : "Buscar actualizaciones"}
          </Button>
        </div>

        {updateInfo && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
            {updateInfo.available ? (
              <>
                <Badge color="green" variant="soft" size="1">
                  <DownloadIcon width={12} height={12} />
                  &nbsp;Nueva versión disponible: {updateInfo.version}
                </Badge>
                {updateInfo.published_at && (
                  <Text size="2" color="gray">
                    Publicada el {new Date(updateInfo.published_at).toLocaleDateString("es-AR")}
                  </Text>
                )}
                {updateInfo.notes && (
                  <Text size="2" color="gray">{updateInfo.notes}</Text>
                )}
                {updateInfo.download_url && (
                  <Button
                    size="1"
                    variant="soft"
                    disabled={downloading}
                    onClick={downloadUpdate}
                    style={{ alignSelf: "flex-start" }}
                  >
                    <DownloadIcon width={12} height={12} />
                    {downloading ? "Descargando..." : "Descargar actualización"}
                  </Button>
                )}
                {downloadedTo && (
                  <Text size="2" color="green" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircledIcon width={12} height={12} />
                    Descargada en: {downloadedTo}
                  </Text>
                )}
              </>
            ) : (
              <Text size="2" color="gray" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircledIcon width={12} height={12} />
                Estás usando la versión más reciente
              </Text>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
