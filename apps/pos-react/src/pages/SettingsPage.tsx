import { Text, Card, Switch, Select } from "@radix-ui/themes";
import { GearIcon } from "@radix-ui/react-icons";

export function SettingsPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <GearIcon width={20} height={20} />
        <Text size="5" weight="bold">Configuración</Text>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px" }}>
        <Card>
          <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
            Empresa
          </Text>
          <div style={{ display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text size="2">Nombre</Text>
              <Text size="2" color="gray">Mi Negocio</Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text size="2">CUIT</Text>
              <Text size="2" color="gray">20-12345678-9</Text>
            </div>
          </div>
        </Card>

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
    </div>
  );
}
