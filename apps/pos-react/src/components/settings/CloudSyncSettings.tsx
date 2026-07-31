import { useEffect, useState } from "react";
import { Text, Card, Button, Badge, TextField } from "@radix-ui/themes";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  UploadIcon,
  DownloadIcon,
} from "@radix-ui/react-icons";
import { useSyncStore } from "@/stores/sync.store";

export function CloudSyncSettings() {
  const {
    subscription,
    cloudConfig,
    pendingCount,
    lastSyncAt,
    isPulling,
    isProcessing,
    fetchConfig,
    saveConfig,
    disconnect,
    processPending,
    pullFromCloud,
  } = useSyncStore();

  const [cloudUrl, setCloudUrl] = useState("");
  const [cloudJwt, setCloudJwt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const connected = cloudConfig?.cloud_configured ?? subscription?.status === "active";

  const handleSave = async () => {
    if (!cloudUrl.trim() || !cloudJwt.trim()) {
      setError("Completá la URL del servidor y el token JWT.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await saveConfig({
        cloud_url: cloudUrl.trim(),
        cloud_jwt: cloudJwt.trim(),
      });
      setCloudUrl("");
      setCloudJwt("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la configuración.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    try {
      await disconnect();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo desconectar.");
    }
  };

  return (
    <Card>
      <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
        Sync Cloud
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
        </div>
      )}

      {connected ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Badge color="green" variant="soft" size="1">
              <CheckCircledIcon width={12} height={12} />
              &nbsp;Conectado
            </Badge>
            {pendingCount > 0 && (
              <Badge color="orange" variant="soft" size="1">
                {pendingCount} pendientes
              </Badge>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <Button
              size="1"
              variant="soft"
              disabled={isProcessing}
              onClick={processPending}
            >
              <UploadIcon width={12} height={12} />
              {isProcessing ? "Subiendo..." : "Subir cambios"}
            </Button>
            <Button
              size="1"
              variant="soft"
              disabled={isPulling}
              onClick={async () => {
                try {
                  await pullFromCloud();
                } catch {
                  // error handled in store
                }
              }}
            >
              <DownloadIcon width={12} height={12} />
              {isPulling ? "Descargando..." : "Descargar cambios"}
            </Button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text size="2" color="gray">Última sincronización</Text>
            <Text size="2" color="gray">
              {lastSyncAt
                ? new Date(lastSyncAt).toLocaleString("es-AR")
                : "Nunca"}
            </Text>
          </div>

          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <TextField.Root
                placeholder="URL del servidor cloud"
                value={cloudUrl}
                onChange={(e) => setCloudUrl(e.target.value)}
                size="1"
              />
              <TextField.Root
                type="password"
                placeholder="JWT token"
                value={cloudJwt}
                onChange={(e) => setCloudJwt(e.target.value)}
                size="1"
              />
              <div style={{ display: "flex", gap: "6px" }}>
                <Button size="1" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar configuración"}
                </Button>
                <Button size="1" variant="soft" color="red" onClick={handleDisconnect}>
                  Desconectar
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <Text size="2" color="gray" style={{ display: "block", marginBottom: "12px" }}>
            Sincronizá tus datos con la nube para acceder desde múltiples dispositivos.
          </Text>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <TextField.Root
              placeholder="URL del servidor cloud"
              value={cloudUrl}
              onChange={(e) => setCloudUrl(e.target.value)}
              size="1"
            />
            <TextField.Root
              type="password"
              placeholder="JWT token"
              value={cloudJwt}
              onChange={(e) => setCloudJwt(e.target.value)}
              size="1"
            />
            <Button size="1" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Conectando..." : "Conectar"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
