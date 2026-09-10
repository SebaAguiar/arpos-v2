import { useEffect, useState } from "react";
import { Text, Card, Button, Badge, AlertDialog, Flex } from "@radix-ui/themes";
import {
  ArchiveIcon,
  ReloadIcon,
  TrashIcon,
  DownloadIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  CubeIcon,
} from "@radix-ui/react-icons";
import { useBackupStore } from "@/stores/backup.store";
import { MigrationWizard } from "@/components/auth/MigrationWizard";
import { isTauri } from "@/lib/tauri";
import { ListEmptyState } from "@/components/ui/ListEmptyState";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr.replace(" ", "T"));
    return d.toLocaleString("es-AR");
  } catch {
    return dateStr;
  }
}

export function BackupPage() {
  const backups = useBackupStore((s) => s.backups);
  const loading = useBackupStore((s) => s.loading);
  const creating = useBackupStore((s) => s.creating);
  const restoring = useBackupStore((s) => s.restoring);
  const error = useBackupStore((s) => s.error);
  const fetchBackups = useBackupStore((s) => s.fetchBackups);
  const createBackup = useBackupStore((s) => s.createBackup);
  const restoreBackup = useBackupStore((s) => s.restoreBackup);
  const deleteBackup = useBackupStore((s) => s.deleteBackup);
  const clearError = useBackupStore((s) => s.clearError);

  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [migrationOpen, setMigrationOpen] = useState(false);

  const tauri = isTauri();

  useEffect(() => {
    if (!tauri) return;
    fetchBackups();
  }, [tauri, fetchBackups]);

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setSuccess(null);
    await restoreBackup(restoreTarget);
    setRestoreTarget(null);
    setSuccess("Base de datos restaurada correctamente. Se recomienda reiniciar la aplicación.");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteBackup(deleteTarget);
    setDeleteTarget(null);
  };

  return (
    <div className="page" style={{ maxWidth: "700px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        <ArchiveIcon width={20} height={20} />
        <Text size="5" weight="bold">Copia de seguridad</Text>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Migrate from v1 */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <Text size="3" weight="bold" style={{ display: "block", marginBottom: "4px" }}>
                Migrar desde Arcom v1
              </Text>
              <Text size="2" color="gray">
                Importá tus datos existentes desde la nube a esta instalación
              </Text>
            </div>
            <Button onClick={() => setMigrationOpen(true)} size="2" variant="soft">
              <CubeIcon width={14} height={14} />
              Migrar datos
            </Button>
          </div>
        </Card>

        {/* Create backup */}
        {tauri && (
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Text size="3" weight="bold" style={{ display: "block", marginBottom: "4px" }}>
                  Crear copia de seguridad
                </Text>
                <Text size="2" color="gray">
                  Genera un respaldo completo de la base de datos actual
                </Text>
              </div>
              <Button
                onClick={createBackup}
                disabled={creating}
                size="2"
              >
                {creating ? (
                  <>
                    <ReloadIcon className="spin" width={14} height={14} />
                    Creando...
                  </>
                ) : (
                  <>
                    <DownloadIcon width={14} height={14} />
                    Crear backup
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {!tauri && (
          <Card>
            <Flex align="center" gap="2">
              <ArchiveIcon width={16} height={16} color="var(--text-secondary)" />
              <Text size="2" color="gray">
                La gestión de copias de seguridad está disponible solo en la aplicación de escritorio.
              </Text>
            </Flex>
          </Card>
        )}

        {/* Success */}
        {success && (
          <Card>
            <Flex align="center" gap="2">
              <CheckCircledIcon width={16} height={16} color="var(--accent)" />
              <Text size="2">{success}</Text>
              <Button
                size="1"
                variant="ghost"
                ml="auto"
                onClick={() => setSuccess(null)}
              >
                <CrossCircledIcon width={12} height={12} />
              </Button>
            </Flex>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card>
            <Flex align="center" gap="2">
              <CrossCircledIcon width={16} height={16} color="var(--red-9)" />
              <Text size="2" color="red">{error}</Text>
              <Button
                size="1"
                variant="ghost"
                ml="auto"
                onClick={clearError}
              >
                <CrossCircledIcon width={12} height={12} />
              </Button>
            </Flex>
          </Card>
        )}

        {/* Backup list */}
        {tauri && (
          <Card>
            <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
              Backups disponibles
            </Text>

            {loading ? (
              <Text size="2" color="gray">Cargando...</Text>
            ) : backups.length === 0 ? (
              <ListEmptyState message="No hay copias de seguridad todavía" icon={ArchiveIcon} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {backups.map((backup) => (
                  <div
                    key={backup.path}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      backgroundColor: "var(--bg-surface-hover)",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Text size="2" style={{ display: "block", fontWeight: 500 }}>
                        {backup.filename}
                      </Text>
                      <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                        <Badge size="1" variant="soft">
                          {formatSize(backup.size_bytes)}
                        </Badge>
                        <Badge size="1" variant="soft" color="gray">
                          {formatDate(backup.created_at)}
                        </Badge>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <Button
                        size="1"
                        variant="soft"
                        color="green"
                        disabled={restoring}
                        onClick={() => setRestoreTarget(backup.path)}
                      >
                        <ReloadIcon width={12} height={12} />
                        Restaurar
                      </Button>
                      <Button
                        size="1"
                        variant="soft"
                        color="red"
                        onClick={() => setDeleteTarget(backup.path)}
                      >
                        <TrashIcon width={12} height={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Restore confirmation */}
      <AlertDialog.Root
        open={restoreTarget !== null}
        onOpenChange={(open) => { if (!open) setRestoreTarget(null); }}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Restaurar backup</AlertDialog.Title>
          <AlertDialog.Description>
            ¿Estás seguro? Se reemplazará la base de datos actual por el backup seleccionado.
            Esta acción no se puede deshacer.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">Cancelar</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action onClick={handleRestore}>
              <Button variant="solid" color="red" disabled={restoring}>
                {restoring ? "Restaurando..." : "Restaurar"}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* Delete confirmation */}
      <AlertDialog.Root
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Eliminar backup</AlertDialog.Title>
          <AlertDialog.Description>
            ¿Estás seguro de eliminar esta copia de seguridad? Esta acción no se puede deshacer.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">Cancelar</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action onClick={handleDelete}>
              <Button variant="solid" color="red">Eliminar</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      <MigrationWizard open={migrationOpen} onClose={() => setMigrationOpen(false)} />
    </div>
  );
}
