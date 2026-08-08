import { useState } from "react";
import { Text, TextField, Button, Badge, Dialog } from "@radix-ui/themes";
import {
  CubeIcon,
  ReloadIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@radix-ui/react-icons";
import { MigrationRepository } from "@/repositories/migration.repository";
import type { MigrationProgressEvent, MigrationSummary } from "@/services/migration.service";

type WizardStep = "select" | "credentials" | "progress" | "complete";

interface MigrationWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const MIGRATION_LABELS: Record<string, string> = {
  companies: "Empresas",
  stores: "Sucursales",
  users: "Usuarios",
  contacts: "Contactos",
  products: "Productos",
  variants: "Variantes",
  inventory: "Inventario",
  inventoryMovements: "Movimientos de inventario",
  cashRegisters: "Cajas",
  cashMovements: "Movimientos de caja",
  storeConfigs: "Configuraciones",
  sales: "Ventas",
  saleItems: "Ítems de venta",
  tasks: "Tareas",
};

export function MigrationWizard({ open, onClose, onComplete }: MigrationWizardProps) {
  const [step, setStep] = useState<WizardStep>("select");
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [primaryStoreId, setPrimaryStoreId] = useState("");
  const [progress, setProgress] = useState<MigrationProgressEvent | null>(null);
  const [summary, setSummary] = useState<MigrationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMigrate = async () => {
    if (!databaseUrl.trim()) return;
    setLoading(true);
    setError(null);
    setStep("progress");
    setProgress({ step: 1, total: 9, label: "Conectando a la base de datos v1" });

    try {
      const result = await MigrationRepository.importV1(
        { databaseUrl: databaseUrl.trim(), primaryStoreId: primaryStoreId.trim() || undefined },
        setProgress,
      );
      setSummary(result);
      setStep("complete");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error durante la migración";
      setError(message);
      setStep("credentials");
    } finally {
      setLoading(false);
    }
  };

  const pct = progress ? Math.round((progress.step / progress.total) * 100) : 0;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o && !loading) { onClose(); setStep("select"); setSummary(null); setError(null); } }}>
      <Dialog.Content style={{ maxWidth: "520px" }}>
        <Dialog.Title>Migrar datos de Arcon v1</Dialog.Title>
        <Dialog.Description size="2" color="gray">
          Importá tus datos existentes desde la nube a esta instalación local.
        </Dialog.Description>

        <div style={{ marginTop: "20px" }}>
          {step === "select" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={() => setStep("credentials")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  backgroundColor: "var(--bg-surface-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  textAlign: "left",
                }}
              >
                <CubeIcon width={18} height={18} color="var(--accent)" />
                <div>
                  <Text size="2" weight="bold" style={{ display: "block" }}>
                    Migrar mis datos a local
                  </Text>
                  <Text size="1" color="gray">
                    Trae tus productos, ventas, clientes y caja desde la nube.
                  </Text>
                </div>
              </button>
              <button
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  textAlign: "left",
                }}
              >
                <CrossCircledIcon width={18} height={18} />
                <div>
                  <Text size="2" weight="bold" style={{ display: "block" }}>
                    Empezar de cero
                  </Text>
                  <Text size="1" color="gray">
                    Configurar un negocio nuevo sin importar datos.
                  </Text>
                </div>
              </button>
            </div>
          )}

          {step === "credentials" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Text size="2" color="gray">
                Ingresá la connection string de tu base de datos v1 (lectura).
              </Text>
              <div>
                <Text size="2" weight="bold" style={{ display: "block", marginBottom: "6px" }}>
                  Connection string
                </Text>
                <TextField.Root
                  type="password"
                  placeholder="postgresql://usuario:clave@host:5432/basededatos"
                  value={databaseUrl}
                  onChange={(e) => setDatabaseUrl(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <Text size="2" weight="bold" style={{ display: "block", marginBottom: "6px" }}>
                  Sucursal principal (opcional)
                </Text>
                <TextField.Root
                  placeholder="ID de la sucursal a usar como local"
                  value={primaryStoreId}
                  onChange={(e) => setPrimaryStoreId(e.target.value)}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "#e5484d15",
                    border: "1px solid #e5484d50",
                    borderRadius: "6px",
                  }}
                >
                  <Text size="2" color="red">{error}</Text>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => setStep("select")}
                  style={{ flex: 1 }}
                >
                  <ArrowLeftIcon width={14} height={14} />
                  Atrás
                </Button>
                <Button onClick={handleMigrate} disabled={!databaseUrl.trim() || loading} style={{ flex: 2 }}>
                  <ReloadIcon width={14} height={14} />
                  Iniciar migración
                </Button>
              </div>
            </div>
          )}

          {step === "progress" && progress && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "var(--accent-subtle)",
                    marginBottom: "12px",
                  }}
                >
                  <ReloadIcon width={24} height={24} className="spin" style={{ color: "var(--accent)" }} />
                </div>
                <Text size="4" weight="bold" style={{ display: "block" }}>
                  {progress.label}...
                </Text>
                <Text size="2" color="gray" style={{ display: "block", marginTop: "4px" }}>
                  Paso {progress.step} de {progress.total}
                </Text>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <Text size="1" color="gray">Progreso</Text>
                  <Text size="1" weight="bold">{pct}%</Text>
                </div>
                <div
                  style={{
                    height: "10px",
                    backgroundColor: "var(--bg-surface-hover)",
                    borderRadius: "5px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      backgroundColor: "var(--accent)",
                      borderRadius: "5px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {Array.from({ length: progress.total }, (_, i) => i + 1).map((n) => {
                  const done = n < progress.step;
                  const active = n === progress.step;
                  return (
                    <div
                      key={n}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        backgroundColor: active ? "var(--accent-subtle)" : "var(--bg-surface-hover)",
                      }}
                    >
                      {done ? (
                        <CheckCircledIcon width={14} height={14} color="#30a46c" />
                      ) : active ? (
                        <ReloadIcon width={14} height={14} className="spin" color="var(--accent)" />
                      ) : (
                        <Badge size="1" variant="soft" color="gray">{n}</Badge>
                      )}
                      <Text size="2" color={done ? "green" : active ? undefined : "gray"}>
                        Paso {n}
                      </Text>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === "complete" && summary && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    backgroundColor: "#30a46c15",
                    marginBottom: "12px",
                  }}
                >
                  <CheckCircledIcon width={28} height={28} color="#30a46c" />
                </div>
                <Text size="4" weight="bold" style={{ display: "block" }}>
                  Migración completada
                </Text>
              </div>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "var(--bg-surface-hover)",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {Object.entries(summary.rowsMigrated)
                  .filter(([, count]) => count > 0)
                  .map(([table, count]) => (
                    <div key={table} style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text size="2">{MIGRATION_LABELS[table] ?? table}</Text>
                      <Text size="2" weight="bold">{count.toLocaleString("es-AR")}</Text>
                    </div>
                  ))}
              </div>
              <Button
                onClick={() => {
                  onClose();
                  onComplete?.();
                }}
              >
                <ArrowRightIcon width={14} height={14} />
                Ir al POS
              </Button>
            </div>
          )}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
