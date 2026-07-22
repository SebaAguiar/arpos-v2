import { useState } from "react";
import { Text, TextField, Switch } from "@radix-ui/themes";
import {
  Cross1Icon,
  PersonIcon,
  CameraIcon,
  IdCardIcon,
  LaptopIcon,
  FileTextIcon,
  ReaderIcon,
  TokensIcon,
  GearIcon,
} from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { useSettingsStore } from "@/stores/settings.store";
import type { PaymentMethod } from "@/lib/types";

const METHOD_ICONS: Record<PaymentMethod, typeof Cross1Icon> = {
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

export function SettingsDialog() {
  const closeSettings = useDialogStore((s) => s.closeSettings);
  const paymentMethods = useSettingsStore((s) => s.paymentMethods);
  const togglePaymentMethod = useSettingsStore((s) => s.togglePaymentMethod);
  const updatePaymentMethodLabel = useSettingsStore((s) => s.updatePaymentMethodLabel);
  const creditSurcharge = useSettingsStore((s) => s.creditSurcharge);
  const setCreditSurcharge = useSettingsStore((s) => s.setCreditSurcharge);
  const taxRate = useSettingsStore((s) => s.taxRate);
  const setTaxRate = useSettingsStore((s) => s.setTaxRate);

  const [editingLabel, setEditingLabel] = useState<PaymentMethod | null>(null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          width: "520px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <GearIcon width={18} height={18} color="var(--text-secondary)" />
            <Text size="4" weight="bold">
              Configuración
            </Text>
          </div>
          <button
            onClick={closeSettings}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <Cross1Icon width={18} height={18} />
          </button>
        </div>

        <div style={{ padding: "20px", overflow: "auto", flex: 1 }}>
          {/* Payment Methods */}
          <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
            Métodos de pago
          </Text>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
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

          {/* General Settings */}
          <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
            Configuración general
          </Text>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Tax Rate */}
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

            {/* Credit Surcharge */}
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
        </div>
      </div>
    </div>
  );
}
