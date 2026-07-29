import { useState, useCallback } from "react";
import { Text, TextField, Switch, Card, Select, Button, Badge } from "@radix-ui/themes";
import {
  GearIcon,
  PersonIcon,
  CameraIcon,
  IdCardIcon,
  LaptopIcon,
  FileTextIcon,
  ReaderIcon,
  TokensIcon,
  HomeIcon,
  GlobeIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ReloadIcon,
  UploadIcon,
  DownloadIcon,
} from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useSyncStore } from "@/stores/sync.store";
import { UsersManager } from "@/components/settings/UsersManager";
import { StoreManager } from "@/components/settings/StoreManager";
import type { PaymentMethod, CloudConfig } from "@/lib/types";

const METHOD_ICONS: Record<PaymentMethod, typeof GearIcon> = {
  CASH: PersonIcon,
  DEBIT: IdCardIcon,
  CREDIT: LaptopIcon,
  QR: CameraIcon,
  WALLET: FileTextIcon,
  TRANSFER: ReaderIcon,
  POINTS: TokensIcon,
};

const METHOD_COLORS: Record<PaymentMethod, string> = {
  CASH: "#30a46c",
  DEBIT: "#3b82f6",
  CREDIT: "#8b5cf6",
  QR: "#f59e0b",
  WALLET: "#ec4899",
  TRANSFER: "#06b6d4",
  POINTS: "#84cc16",
};

export function SettingsPage() {
  const usersOpen = useDialogStore((s) => s.users);
  const openUsers = useDialogStore((s) => s.openUsers);
  const storesOpen = useDialogStore((s) => s.stores);
  const openStores = useDialogStore((s) => s.openStores);
  const paymentMethods = useSettingsStore((s) => s.paymentMethods);
  const togglePaymentMethod = useSettingsStore((s) => s.togglePaymentMethod);
  const updatePaymentMethodLabel = useSettingsStore((s) => s.updatePaymentMethodLabel);
  const creditSurcharge = useSettingsStore((s) => s.creditSurcharge);
  const setCreditSurcharge = useSettingsStore((s) => s.setCreditSurcharge);
  const taxRate = useSettingsStore((s) => s.taxRate);
  const setTaxRate = useSettingsStore((s) => s.setTaxRate);

  const subscription = useSyncStore((s) => s.subscription);
  const setSubscription = useSyncStore((s) => s.setSubscription);
  const clearSubscription = useSyncStore((s) => s.clearSubscription);
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt);
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const isPulling = useSyncStore((s) => s.isPulling);
  const isProcessing = useSyncStore((s) => s.isProcessing);
  const processPending = useSyncStore((s) => s.processPending);
  const pullFromCloud = useSyncStore((s) => s.pullFromCloud);

  const [editingLabel, setEditingLabel] = useState<PaymentMethod | null>(null);
  const [cloudUrl, setCloudUrl] = useState(subscription?.cloudUrl ?? "");
  const [cloudJwt, setCloudJwt] = useState(subscription?.cloudJwt ?? "");

  const handleSaveCloudConfig = useCallback(() => {
    if (!cloudUrl.trim() || !cloudJwt.trim()) return;
    setSubscription({
      status: "active",
      cloudUrl: cloudUrl.trim(),
      cloudJwt: cloudJwt.trim(),
    });
  }, [cloudUrl, cloudJwt, setSubscription]);

  const handleDisconnectCloud = useCallback(() => {
    setCloudUrl("");
    setCloudJwt("");
    clearSubscription();
  }, [clearSubscription]);

  return (
    <div className="page" style={{ maxWidth: "700px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        <GearIcon width={20} height={20} />
        <Text size="5" weight="bold">Configuración</Text>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
        {/* Payment Methods */}
        <Card>
          <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
            Métodos de pago
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {paymentMethods.map((config) => {
              const Icon = METHOD_ICONS[config.id];
              const color = METHOD_COLORS[config.id];
              return (
                <div
                  key={config.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    backgroundColor: "var(--bg-surface-hover)",
                    borderRadius: "6px",
                    opacity: config.enabled ? 1 : 0.6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        backgroundColor: `${color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon width={14} height={14} color={color} />
                    </div>
                    {editingLabel === config.id ? (
                      <TextField.Root
                        autoFocus
                        defaultValue={config.label}
                        onBlur={(e) => {
                          updatePaymentMethodLabel(config.id, e.target.value || config.label);
                          setEditingLabel(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (e.target as HTMLInputElement).blur();
                          }
                          if (e.key === "Escape") {
                            setEditingLabel(null);
                          }
                        }}
                        style={{ width: "140px" }}
                      />
                    ) : (
                      <Text
                        size="2"
                        style={{ cursor: "pointer", minWidth: "100px" }}
                        onClick={() => setEditingLabel(config.id)}
                      >
                        {config.label}
                      </Text>
                    )}
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={() => togglePaymentMethod(config.id)}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        {/* General Settings */}
        <Card>
          <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
            Configuración general
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "6px",
              }}
            >
              <Text size="2">IVA (%)</Text>
              <TextField.Root
                type="number"
                value={taxRate * 100}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100 || 0)}
                style={{ width: "80px" }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "6px",
              }}
            >
              <Text size="2">Recargo crédito (%)</Text>
              <TextField.Root
                type="number"
                value={creditSurcharge}
                onChange={(e) => setCreditSurcharge(parseFloat(e.target.value) || 0)}
                style={{ width: "80px" }}
              />
            </div>
          </div>
        </Card>

        {/* Management */}
        <Card>
          <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
            Gestión
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={openStores}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "var(--bg-surface-hover)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                color: "var(--text-primary)",
                textAlign: "left",
              }}
            >
              <HomeIcon width={16} height={16} color="var(--text-secondary)" />
              <Text size="2">Sucursales</Text>
            </button>
            <button
              onClick={openUsers}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 12px",
                backgroundColor: "var(--bg-surface-hover)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                color: "var(--text-primary)",
                textAlign: "left",
              }}
            >
              <PersonIcon width={16} height={16} color="var(--text-secondary)" />
              <Text size="2">Usuarios</Text>
            </button>
          </div>
        </Card>

        {/* Printing */}
        <Card>
          <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
            Impresión
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text size="2">Auto-imprimir tickets</Text>
              <Switch defaultChecked />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text size="2">Puerto impresora</Text>
              <Select.Root defaultValue="usb">
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="usb">USB</Select.Item>
                  <Select.Item value="serial">Serial</Select.Item>
                  <Select.Item value="network">Red</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
          </div>
        </Card>

        {/* Cloud Sync */}
        <Card>
          <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
            Sync Cloud
          </Text>

          {subscription?.status === "active" ? (
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
                    <Button size="1" onClick={handleSaveCloudConfig}>
                      Guardar configuración
                    </Button>
                    <Button size="1" variant="soft" color="red" onClick={handleDisconnectCloud}>
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
                <Button size="1" onClick={handleSaveCloudConfig}>
                  Conectar
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* License */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <GlobeIcon width={16} height={16} />
            <Text size="3" weight="bold">Cloud Sync — Suscripción</Text>
          </div>
          <div style={{ display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text size="2">Estado</Text>
              {subscription?.status === "active" ? (
                <Badge color="green" variant="soft" size="1">
                  <CheckCircledIcon width={12} height={12} />
                  &nbsp;Activo
                </Badge>
              ) : (
                <Badge color="gray" variant="soft" size="1">
                  <CrossCircledIcon width={12} height={12} />
                  &nbsp;Inactivo
                </Badge>
              )}
            </div>
            {subscription?.tier && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text size="2">Plan</Text>
                <Text size="2" weight="bold">{subscription.tier}</Text>
              </div>
            )}
            {subscription?.expiresAt && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text size="2">Vence</Text>
                <Text size="2" color="gray">
                  {new Date(subscription.expiresAt * 1000).toLocaleDateString("es-AR")}
                </Text>
              </div>
            )}
          </div>
        </Card>
      </div>

      {usersOpen && <UsersManager />}
      {storesOpen && <StoreManager />}
    </div>
  );
}
