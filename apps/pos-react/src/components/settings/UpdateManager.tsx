import { useEffect, useState } from "react";
import { Text, Card, Button, Badge, Progress, Flex } from "@radix-ui/themes";
import {
  ReloadIcon,
  DownloadIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ExternalLinkIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useUpdaterStore } from "@/stores/updater.store";
import { getAppVersion } from "@/lib/tauri";
import { formatLabel } from "@/repositories/updater.repository";
import type { UpdatePlatformInfo } from "@/lib/types";

async function downloadInstallerManually(platform: UpdatePlatformInfo): Promise<void> {
  await openUrl(platform.url);
}

export function UpdateManager() {
  const {
    updateInfo,
    checking,
    downloading,
    error,
    checkForUpdates,
    downloadAndInstall,
    clearError,
  } = useUpdaterStore();

  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    getAppVersion()
      .then(setCurrentVersion)
      .catch(() => setCurrentVersion(null));
  }, []);

  // The auto-installer can only match a target when the running bundle format
  // is published in the manifest. A manually extracted binary (e.g. an RPM
  // unpacked to ~/.local/bin) has no supported OTA path, so we surface the
  // available installers for the user to download instead.
  const autoInstallUnavailable =
    updateInfo?.available === true && !updateInfo.canAutoInstall;

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
            disabled={checking || downloading || !currentVersion}
            onClick={() => checkForUpdates()}
          >
            <ReloadIcon width={12} height={12} />
            {checking ? "Buscando..." : "Buscar actualizaciones"}
          </Button>
        </div>

        {updateInfo?.available && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
            <Badge color="green" variant="soft" size="1">
              <DownloadIcon width={12} height={12} />
              &nbsp;Nueva versión disponible: {updateInfo.version}
            </Badge>
            {updateInfo.format && (
              <Badge size="1" variant="soft" color="gray">
                Formato de instalación detectado: {formatLabel(updateInfo.format)}
              </Badge>
            )}
            {updateInfo.published_at && (
              <Text size="2" color="gray">
                Publicada el {new Date(updateInfo.published_at).toLocaleDateString("es-AR")}
              </Text>
            )}
            {updateInfo.notes && <Text size="2" color="gray">{updateInfo.notes}</Text>}

            {!autoInstallUnavailable && (downloading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Progress size="1" />
                <Text size="2" color="gray">
                  Descargando e instalando actualización... la aplicación se reiniciará.
                </Text>
              </div>
            ) : (
              <Button
                size="1"
                variant="soft"
                disabled={downloading}
                onClick={downloadAndInstall}
                style={{ alignSelf: "flex-start" }}
              >
                <DownloadIcon width={12} height={12} />
                Descargar e instalar
              </Button>
            ))}

            {autoInstallUnavailable && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  padding: "10px 12px",
                  backgroundColor: "var(--bg-surface-hover)",
                  borderRadius: "6px",
                }}
              >
                <Flex align="center" gap="6px">
                  <InfoCircledIcon width={14} height={14} color="var(--amber-9)" />
                  <Text size="2" weight="medium">
                    Actualización automática no disponible
                  </Text>
                </Flex>
                <Text size="2" color="gray">
                  Tu instalación ({formatLabel(updateInfo.format ?? "unknown")}) no coincide
                  con los formatos publicados. Descargá el instalador y aplicá la
                  actualización manualmente:
                </Text>
                <Flex wrap="wrap" gap="6px" mt="2">
                  {updateInfo.installerOptions.map((platform) => (
                    <Button
                      key={platform.key}
                      size="1"
                      variant="soft"
                      onClick={() => downloadInstallerManually(platform)}
                      style={{ alignSelf: "flex-start" }}
                    >
                      <ExternalLinkIcon width={12} height={12} />
                      {platform.label}
                    </Button>
                  ))}
                </Flex>
              </div>
            )}
          </div>
        )}

        {updateInfo && !updateInfo.available && !checking && (
          <Text size="2" color="gray" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircledIcon width={12} height={12} />
            Estás usando la versión más reciente
          </Text>
        )}
      </div>
    </Card>
  );
}