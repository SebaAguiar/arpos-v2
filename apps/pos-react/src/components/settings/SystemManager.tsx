import { useEffect } from "react";
import { Text, Card, Button, Badge } from "@radix-ui/themes";
import {
  LaptopIcon,
  ArchiveIcon,
  FileTextIcon,
  ReloadIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { useSystemStore } from "@/stores/system.store";
import { isTauri } from "@/lib/tauri";
import { openUrl } from "@tauri-apps/plugin-opener";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
      <Text size="2" color="gray">{label}</Text>
      <Text size="2" weight="bold" style={{ textAlign: "right" }}>{value}</Text>
    </div>
  );
}

export function SystemManager() {
  const {
    systemInfo,
    dbInfo,
    integrity,
    loading,
    integrityChecking,
    migrating,
    exporting,
    lastExport,
    error,
    fetchInfo,
    runIntegrityCheck,
    runMigrations,
    exportSql,
    exportJson,
    clearError,
  } = useSystemStore();

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <LaptopIcon width={16} height={16} />
        <Text size="3" weight="bold">Sistema</Text>
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
          <Button size="1" variant="ghost" onClick={clearError}>
            <CrossCircledIcon width={12} height={12} />
          </Button>
        </div>
      )}

      {loading ? (
        <Text size="2" color="gray">Cargando...</Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {dbInfo && (
            <div>
              <Text size="2" weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                Base de datos
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Row label="Ubicación" value={dbInfo.path} />
                <Row label="Tamaño" value={formatSize(dbInfo.size_bytes)} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text size="2" color="gray">Migraciones</Text>
                  <Badge size="1" color={dbInfo.migrations_applied ? "green" : "orange"} variant="soft">
                    {dbInfo.migrations_applied ? "Aplicadas" : "Pendientes"}
                  </Badge>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <Button
                  size="1"
                  variant="soft"
                  disabled={integrityChecking}
                  onClick={runIntegrityCheck}
                >
                  <ReloadIcon width={12} height={12} />
                  {integrityChecking ? "Verificando..." : "Verificar integridad"}
                </Button>
                {dbInfo.migrations_applied === false && (
                  <Button size="1" variant="soft" disabled={migrating} onClick={runMigrations}>
                    <ReloadIcon width={12} height={12} />
                    {migrating ? "Migrando..." : "Aplicar migraciones"}
                  </Button>
                )}
              </div>
              {integrity !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                  {integrity ? (
                    <CheckCircledIcon width={14} height={14} color="var(--green-9)" />
                  ) : (
                    <CrossCircledIcon width={14} height={14} color="var(--red-9)" />
                  )}
                  <Text size="2" color={integrity ? "green" : "red"}>
                    {integrity ? "Integridad OK" : "Integridad comprometida"}
                  </Text>
                </div>
              )}
            </div>
          )}

          {systemInfo && (
            <div>
              <Text size="2" weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                Equipo
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Row
                  label="Sistema operativo"
                  value={`${systemInfo.os_name} ${systemInfo.os_version}`}
                />
                <Row label="Host" value={systemInfo.host_name} />
                <Row label="CPU" value={`${systemInfo.cpu_count} núcleos (${systemInfo.cpu_usage.toFixed(0)}%)`} />
                <Row
                  label="Memoria"
                  value={`${systemInfo.used_memory_mb.toFixed(0)} / ${systemInfo.total_memory_mb.toFixed(0)} MB`}
                />
                <Row
                  label="Disco"
                  value={`${systemInfo.disk_used_gb.toFixed(1)} / ${systemInfo.disk_total_gb.toFixed(1)} GB`}
                />
              </div>
            </div>
          )}

          <div>
            <Text size="2" weight="bold" style={{ display: "block", marginBottom: "8px" }}>
              Exportar datos
            </Text>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                size="1"
                variant="soft"
                disabled={exporting !== null}
                onClick={exportSql}
              >
                <FileTextIcon width={12} height={12} />
                {exporting === "sql" ? "Exportando..." : "Exportar SQL"}
              </Button>
              <Button
                size="1"
                variant="soft"
                disabled={exporting !== null}
                onClick={exportJson}
              >
                <ArchiveIcon width={12} height={12} />
                {exporting === "json" ? "Exportando..." : "Exportar JSON"}
              </Button>
            </div>
            {lastExport && (
              <Text size="2" color="gray" style={{ display: "block", marginTop: "8px" }}>
                Guardado en: {lastExport.path}
              </Text>
            )}
          </div>

          <div>
            <Text size="2" weight="bold" style={{ display: "block", marginBottom: "8px" }}>
              Soporte
            </Text>
            <Button
              size="1"
              variant="soft"
              onClick={async () => {
                const url = "https://arcom.arsian.dev/soporte";
                if (isTauri()) {
                  try {
                    await openUrl(url);
                  } catch {
                    window.open(url, "_blank");
                  }
                } else {
                  window.open(url, "_blank");
                }
              }}
            >
              <InfoCircledIcon width={12} height={12} />
              Reportar un problema
            </Button>
            <Text size="2" color="gray" style={{ display: "block", marginTop: "8px" }}>
              Abre el formulario de soporte en arcom.arsian.dev.
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
}
