import { useState } from "react";
import { Text, TextField, Switch, Card, Select } from "@radix-ui/themes";
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
} from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { useSettingsStore } from "@/stores/settings.store";
import { UsersManager } from "@/components/settings/UsersManager";
import { StoreManager } from "@/components/settings/StoreManager";
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

  const [editingLabel, setEditingLabel] = useState<PaymentMethod | null>(null);

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

        {/* Sync */}
        <Card>
          <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
            Sync
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text size="2">Sincronización automática</Text>
              <Switch />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text size="2">Última sincronización</Text>
              <Text size="2" color="gray">Nunca</Text>
            </div>
          </div>
        </Card>

        {/* License */}
        <Card>
          <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
            Licencia
          </Text>
          <div style={{ display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text size="2">Plan actual</Text>
              <Text size="2" color="orange">Free</Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text size="2">Dispositivo</Text>
              <Text size="2" color="gray">1 de 1</Text>
            </div>
          </div>
        </Card>
      </div>

      {usersOpen && <UsersManager />}
      {storesOpen && <StoreManager />}
    </div>
  );
}
