import { useState } from "react";
import { Text, TextField, Switch, Card } from "@radix-ui/themes";
import {
  DragHandleDots2Icon,
  PersonIcon,
  CameraIcon,
  IdCardIcon,
  LaptopIcon,
  FileTextIcon,
  ReaderIcon,
  TokensIcon,
} from "@radix-ui/react-icons";
import { useSettingsStore } from "@/stores/settings.store";
import { AutosaveBadge } from "./AutosaveBadge";
import type { PaymentMethod } from "@/lib/types";

const METHOD_ICONS: Record<PaymentMethod, typeof DragHandleDots2Icon> = {
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

const METHOD_HELP: Record<PaymentMethod, string> = {
  CASH: "Cobro en efectivo",
  DEBIT: "Tarjeta de débito",
  CREDIT: "Tarjeta de crédito — aplica el recargo configurado",
  QR: "QR — requiere conexión a MercadoPago",
  WALLET: "Billetera virtual",
  TRANSFER: "Transferencia bancaria",
  POINTS: "Puntos de fidelidad",
};

export function PaymentMethodsEditor() {
  const paymentMethods = useSettingsStore((s) => s.paymentMethods);
  const togglePaymentMethod = useSettingsStore((s) => s.togglePaymentMethod);
  const updatePaymentMethodLabel = useSettingsStore((s) => s.updatePaymentMethodLabel);
  const reorderPaymentMethods = useSettingsStore((s) => s.reorderPaymentMethods);

  const [editingLabel, setEditingLabel] = useState<PaymentMethod | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDrop = (targetIndex: number) => {
    if (dragIndex !== null && dragIndex !== targetIndex) {
      reorderPaymentMethods(dragIndex, targetIndex);
    }
    setDragIndex(null);
  };

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <Text size="3" weight="bold">Métodos de pago</Text>
        <AutosaveBadge revision={paymentMethods} />
      </div>

      <Text size="1" color="gray" style={{ display: "block", marginBottom: "12px" }}>
        Arrastrá para definir el orden en que aparecen en el POS. Los métodos deshabilitados no se ofrecen al cobrar.
      </Text>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {paymentMethods.map((config, index) => {
          const Icon = METHOD_ICONS[config.id];
          const color = METHOD_COLORS[config.id];
          const isEditing = editingLabel === config.id;
          const isDragging = dragIndex === index;

          return (
            <div
              key={config.id}
              draggable={!isEditing}
              onDragStart={(e) => {
                if (isEditing) {
                  e.preventDefault();
                  return;
                }
                setDragIndex(index);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (dragIndex === null) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(index);
              }}
              onDragEnd={() => setDragIndex(null)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                padding: "10px 12px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "6px",
                opacity: config.enabled ? 1 : 0.6,
                outline: isDragging ? "2px solid var(--accent-8)" : "none",
                cursor: isEditing ? "default" : "grab",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                <DragHandleDots2Icon
                  width={16}
                  height={16}
                  color="var(--text-secondary)"
                  style={{ flexShrink: 0 }}
                />
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    backgroundColor: `${color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon width={14} height={14} color={color} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                  {isEditing ? (
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
                  <Text size="1" color="gray" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {METHOD_HELP[config.id]}
                    {config.enabled ? "" : " · no aparece en el POS"}
                  </Text>
                </div>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={() => togglePaymentMethod(config.id)}
                aria-label={`${config.label}: ${config.enabled ? "habilitado" : "deshabilitado"}`}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
