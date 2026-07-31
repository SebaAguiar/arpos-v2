import { useState } from "react";
import { Text, TextField, Switch, Card, Select, Badge } from "@radix-ui/themes";
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
} from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useSyncStore } from "@/stores/sync.store";
import { useTauri } from "@/hooks/useTauri";
import { UsersManager } from "@/components/settings/UsersManager";
import { StoreManager } from "@/components/settings/StoreManager";
import { CompanyForm } from "@/components/settings/CompanyForm";
import { SystemManager } from "@/components/settings/SystemManager";
import { UpdateManager } from "@/components/settings/UpdateManager";
import { CloudSyncSettings } from "@/components/settings/CloudSyncSettings";
import type { PaymentMethod } from "@/lib/types";

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
  const autoPrint = useSettingsStore((s) => s.autoPrint);
  const setAutoPrint = useSettingsStore((s) => s.setAutoPrint);
  const paperSize = useSettingsStore((s) => s.paperSize);
  const setPaperSize = useSettingsStore((s) => s.setPaperSize);
  const receiptHeader = useSettingsStore((s) => s.receiptHeader);
  const setReceiptHeader = useSettingsStore((s) => s.setReceiptHeader);
  const receiptFooter = useSettingsStore((s) => s.receiptFooter);
  const setReceiptFooter = useSettingsStore((s) => s.setReceiptFooter);

  const subscription = useSyncStore((s) => s.subscription);

  const [editingLabel, setEditingLabel] = useState<PaymentMethod | null>(null);

  const { isTauri } = useTauri();

  return (
    <div className="page" style={{ maxWidth: "700px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        <GearIcon width={20} height={20} />
        <Text size="5" weight="bold">Configuración</Text>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
        {/* Company Data */}
        <CompanyForm />

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
              <Switch checked={autoPrint} onCheckedChange={setAutoPrint} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text size="2">Tamaño de papel</Text>
              <Select.Root value={paperSize} onValueChange={(v) => setPaperSize(v as typeof paperSize)}>
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="80mm">80mm (térmico)</Select.Item>
                  <Select.Item value="58mm">58mm (térmico chico)</Select.Item>
                  <Select.Item value="a4">A4</Select.Item>
                  <Select.Item value="a5">A5</Select.Item>
                  <Select.Item value="default">Automático</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
            <div>
              <Text size="2" weight="bold" style={{ display: "block", marginBottom: "4px" }}>
                Encabezado del ticket
              </Text>
              <TextField.Root
                placeholder="Ej: Gracias por elegirnos..."
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
              />
            </div>
            <div>
              <Text size="2" weight="bold" style={{ display: "block", marginBottom: "4px" }}>
                Pie del ticket
              </Text>
              <TextField.Root
                placeholder="Ej: ¡Vuelva pronto!"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Cloud Sync */}
        <CloudSyncSettings />

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

        {isTauri && <SystemManager />}
        {isTauri && <UpdateManager />}
      </div>

      {usersOpen && <UsersManager />}
      {storesOpen && <StoreManager />}
    </div>
  );
}
