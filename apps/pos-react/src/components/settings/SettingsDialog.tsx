import { Text } from "@radix-ui/themes";
import { PersonIcon, HomeIcon, GearIcon } from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { UsersManager } from "./UsersManager";
import { StoreManager } from "./StoreManager";
import { PaymentMethodsEditor } from "./PaymentMethodsEditor";
import { GeneralSettingsEditor } from "./GeneralSettingsEditor";

export function SettingsDialog() {
  const closeSettings = useDialogStore((s) => s.closeSettings);
  const usersOpen = useDialogStore((s) => s.users);
  const openUsers = useDialogStore((s) => s.openUsers);
  const storesOpen = useDialogStore((s) => s.stores);
  const openStores = useDialogStore((s) => s.openStores);

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
        <DialogHeader
          icon={<GearIcon width={18} height={18} color="var(--text-secondary)" />}
          title="Configuración"
          onClose={closeSettings}
        />

        <div style={{ padding: "20px", overflow: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          <PaymentMethodsEditor />
          <GeneralSettingsEditor />

          <Text size="3" weight="bold" style={{ display: "block" }}>
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
        </div>
      </div>

      {usersOpen && <UsersManager />}
      {storesOpen && <StoreManager />}
    </div>
  );
}
