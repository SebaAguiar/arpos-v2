import { Text, TextField, Card } from "@radix-ui/themes";
import { useSettingsStore } from "@/stores/settings.store";
import { AutosaveBadge } from "./AutosaveBadge";

export function GeneralSettingsEditor() {
  const taxRate = useSettingsStore((s) => s.taxRate);
  const setTaxRate = useSettingsStore((s) => s.setTaxRate);
  const creditSurcharge = useSettingsStore((s) => s.creditSurcharge);
  const setCreditSurcharge = useSettingsStore((s) => s.setCreditSurcharge);

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <Text size="3" weight="bold">Configuración general</Text>
        <AutosaveBadge revision={[taxRate, creditSurcharge]} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <Text size="2" weight="medium" style={{ display: "block", marginBottom: "6px" }}>
            IVA (%)
          </Text>
          <TextField.Root
            type="number"
            value={taxRate * 100}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100 || 0)}
            aria-label="IVA en porcentaje"
          />
        </div>
        <div>
          <Text size="2" weight="medium" style={{ display: "block", marginBottom: "6px" }}>
            Recargo crédito (%)
          </Text>
          <TextField.Root
            type="number"
            value={creditSurcharge}
            onChange={(e) => setCreditSurcharge(parseFloat(e.target.value) || 0)}
            aria-label="Recargo por pago con crédito en porcentaje"
          />
        </div>
      </div>
    </Card>
  );
}
