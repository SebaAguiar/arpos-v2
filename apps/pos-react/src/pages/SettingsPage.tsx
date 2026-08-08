import { Tabs, Text, TextField, Switch, Select, Card, Badge } from "@radix-ui/themes";
import {
  GearIcon,
  PersonIcon,
  HomeIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  GlobeIcon,
} from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useSyncStore } from "@/stores/sync.store";
import { useTauri } from "@/hooks/useTauri";
import { UsersManager } from "@/components/settings/UsersManager";
import { StoreManager } from "@/components/settings/StoreManager";
import { CompanyForm } from "@/components/settings/CompanyForm";
import { PaymentMethodsEditor } from "@/components/settings/PaymentMethodsEditor";
import { GeneralSettingsEditor } from "@/components/settings/GeneralSettingsEditor";
import { CloudSyncSettings } from "@/components/settings/CloudSyncSettings";
import { AutosaveBadge } from "@/components/settings/AutosaveBadge";
import { SystemManager } from "@/components/settings/SystemManager";
import { UpdateManager } from "@/components/settings/UpdateManager";

export function SettingsPage() {
  const usersOpen = useDialogStore((s) => s.users);
  const openUsers = useDialogStore((s) => s.openUsers);
  const storesOpen = useDialogStore((s) => s.stores);
  const openStores = useDialogStore((s) => s.openStores);
  const autoPrint = useSettingsStore((s) => s.autoPrint);
  const setAutoPrint = useSettingsStore((s) => s.setAutoPrint);
  const paperSize = useSettingsStore((s) => s.paperSize);
  const setPaperSize = useSettingsStore((s) => s.setPaperSize);
  const receiptHeader = useSettingsStore((s) => s.receiptHeader);
  const setReceiptHeader = useSettingsStore((s) => s.setReceiptHeader);
  const receiptFooter = useSettingsStore((s) => s.receiptFooter);
  const setReceiptFooter = useSettingsStore((s) => s.setReceiptFooter);

  const subscription = useSyncStore((s) => s.subscription);

  const { isTauri } = useTauri();

  return (
    <div className="page" style={{ maxWidth: "700px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <GearIcon width={20} height={20} />
        <Text size="5" weight="bold">Configuración</Text>
      </div>
      <Text size="1" color="gray" style={{ display: "block", marginBottom: "20px" }}>
        Los cambios en pagos, impresión y configuración general se guardan automáticamente en este
        dispositivo. Los datos de la empresa se guardan con el botón correspondiente.
      </Text>

      <Tabs.Root defaultValue="general">
        <Tabs.List style={{ flexWrap: "wrap" }}>
          <Tabs.Trigger value="general">General</Tabs.Trigger>
          <Tabs.Trigger value="pagos">Pagos</Tabs.Trigger>
          <Tabs.Trigger value="impresion">Impresión</Tabs.Trigger>
          <Tabs.Trigger value="sincronizacion">Sincronización</Tabs.Trigger>
          <Tabs.Trigger value="gestion">Usuarios y sucursales</Tabs.Trigger>
          {isTauri && <Tabs.Trigger value="sistema">Sistema</Tabs.Trigger>}
        </Tabs.List>

        <Tabs.Content value="general" style={{ paddingTop: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <CompanyForm />
            <GeneralSettingsEditor />
          </div>
        </Tabs.Content>

        <Tabs.Content value="pagos" style={{ paddingTop: "16px" }}>
          <PaymentMethodsEditor />
        </Tabs.Content>

        <Tabs.Content value="impresion" style={{ paddingTop: "16px" }}>
          <Card>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <Text size="3" weight="bold">Impresión</Text>
              <AutosaveBadge revision={[autoPrint, paperSize, receiptHeader, receiptFooter]} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text size="2">Auto-imprimir tickets</Text>
                <Switch
                  checked={autoPrint}
                  onCheckedChange={setAutoPrint}
                  aria-label={`Auto-imprimir tickets: ${autoPrint ? "habilitado" : "deshabilitado"}`}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text size="2">Tamaño de papel</Text>
                <Select.Root value={paperSize} onValueChange={(v) => setPaperSize(v as typeof paperSize)}>
                  <Select.Trigger aria-label="Tamaño de papel" />
                  <Select.Content position="popper">
                    <Select.Item value="80mm">80mm (térmico)</Select.Item>
                    <Select.Item value="58mm">58mm (térmico chico)</Select.Item>
                    <Select.Item value="a4">A4</Select.Item>
                    <Select.Item value="a5">A5</Select.Item>
                    <Select.Item value="default">Automático</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>
              <div>
                <Text size="2" weight="medium" style={{ display: "block", marginBottom: "6px" }}>
                  Encabezado del ticket
                </Text>
                <TextField.Root
                  placeholder="Ej: Gracias por elegirnos..."
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                  aria-label="Encabezado del ticket"
                />
              </div>
              <div>
                <Text size="2" weight="medium" style={{ display: "block", marginBottom: "6px" }}>
                  Pie del ticket
                </Text>
                <TextField.Root
                  placeholder="Ej: ¡Vuelva pronto!"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  aria-label="Pie del ticket"
                />
              </div>
            </div>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="sincronizacion" style={{ paddingTop: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <CloudSyncSettings />
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <GlobeIcon width={16} height={16} />
                <Text size="3" weight="bold">Cloud Sync — Suscripción</Text>
              </div>
              <div style={{ display: "grid", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text size="2">Estado</Text>
                  {subscription?.status === "active" ? (
                    <Badge color="green" variant="soft" size="2">
                      <CheckCircledIcon width={12} height={12} />
                      &nbsp;Activo
                    </Badge>
                  ) : (
                    <Badge color="orange" variant="soft" size="2">
                      <CrossCircledIcon width={12} height={12} />
                      &nbsp;Sin suscripción activa
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
        </Tabs.Content>

        <Tabs.Content value="gestion" style={{ paddingTop: "16px" }}>
          <Card>
            <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
              Usuarios y sucursales
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
        </Tabs.Content>

        {isTauri && (
          <Tabs.Content value="sistema" style={{ paddingTop: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <SystemManager />
              <UpdateManager />
            </div>
          </Tabs.Content>
        )}
      </Tabs.Root>

      {usersOpen && <UsersManager />}
      {storesOpen && <StoreManager />}
    </div>
  );
}
