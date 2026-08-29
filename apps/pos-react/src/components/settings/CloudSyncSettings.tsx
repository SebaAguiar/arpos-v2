import { useEffect, useState } from "react";
import { Text, Card, Button, Badge, TextField } from "@radix-ui/themes";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  UploadIcon,
  DownloadIcon,
  GearIcon,
  QuestionMarkCircledIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons";
import { useSyncStore } from "@/stores/sync.store";
import { useLicense } from "@/hooks/useLicense";

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

  const gate = useLicense();

  const [cloudUrl, setCloudUrl] = useState("");
  const [cloudJwt, setCloudJwt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <GearIcon width={16} height={16} />
        <Text size="3" weight="bold">Sync Cloud</Text>
      </div>

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
            <Badge color="green" variant="soft" size="2">
              <CheckCircledIcon width={14} height={14} />
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

          <Button
            size="1"
            variant="ghost"
            onClick={() => setShowSetup((v) => !v)}
            style={{ marginTop: "12px" }}
          >
            {showSetup ? "Ocultar configuración" : "Configuración avanzada"}
          </Button>

          {showSetup && (
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <TextField.Root
                  placeholder="URL del servidor cloud"
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                  size="1"
                  aria-label="URL del servidor cloud"
                />
                <TextField.Root
                  type="password"
                  placeholder="JWT token"
                  value={cloudJwt}
                  onChange={(e) => setCloudJwt(e.target.value)}
                  size="1"
                  aria-label="Token JWT"
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
          )}
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Badge color="orange" variant="soft" size="2">
              <CrossCircledIcon width={14} height={14} />
              &nbsp;No conectado
            </Badge>
            {pendingCount > 0 && (
              <Badge color="orange" variant="soft" size="1">
                {pendingCount} pendientes
              </Badge>
            )}
          </div>

          <Text size="2" color="gray" style={{ display: "block", marginBottom: "12px" }}>
            Sincronizá tus datos con la nube para acceder desde múltiples dispositivos.
          </Text>

          {!gate.enabled && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "10px 12px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "6px",
                marginBottom: "12px",
              }}
            >
              <Text size="2" color="amber" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <LockClosedIcon width={14} height={14} />
                Cloud sync es una función de pago.
              </Text>
              <Text size="2" color="gray">{gate.blockMessage}</Text>
            </div>
          )}

          <Button
            size="1"
            onClick={() => setShowSetup((v) => !v)}
            disabled={!gate.enabled}
            title={gate.enabled ? undefined : "Requiere licencia de pago para sincronizar en la nube"}
          >
            {showSetup ? "Ocultar configuración" : "Activar sincronización"}
          </Button>

          {showSetup && (
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <TextField.Root
                  placeholder="URL del servidor cloud"
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                  size="1"
                  aria-label="URL del servidor cloud"
                />
                <TextField.Root
                  type="password"
                  placeholder="JWT token"
                  value={cloudJwt}
                  onChange={(e) => setCloudJwt(e.target.value)}
                  size="1"
                  aria-label="Token JWT"
                />
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Button size="1" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Conectando..." : "Conectar"}
                  </Button>
                  <button
                    onClick={() => setShowHelp((v) => !v)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "none",
                      border: "none",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    <QuestionMarkCircledIcon width={14} height={14} />
                    ¿Cómo obtengo esto?
                  </button>
                </div>
                {showHelp && (
                  <Text size="1" color="gray" as="p" style={{ margin: 0 }}>
                    Creá una cuenta en tu proveedor de sincronización, generá un token JWT desde el
                    panel de administración y pegá la URL del servidor. El token se guarda solo en
                    este dispositivo.
                  </Text>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
