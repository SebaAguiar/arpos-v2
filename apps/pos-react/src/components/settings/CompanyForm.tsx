import { useState, useEffect } from "react";
import { Text, TextField, Card, Button } from "@radix-ui/themes";
import { useCompanyStore } from "@/stores/company.store";

export function CompanyForm() {
  const { company, loading, saving, error, fetchCompany, updateCompany } = useCompanyStore();
  const [form, setForm] = useState({ name: "", taxId: "", address: "", email: "", phone: "" });

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name,
        taxId: company.taxId,
        address: company.address ?? "",
        email: company.email ?? "",
        phone: company.phone ?? "",
      });
    }
  }, [company]);

  const handleSave = async () => {
    const input: Record<string, string | undefined> = {};
    if (form.name !== company?.name) input.name = form.name;
    if (form.taxId !== company?.taxId) input.taxId = form.taxId;
    if (form.address !== (company?.address ?? "")) input.address = form.address || undefined;
    if (form.email !== (company?.email ?? "")) input.email = form.email || undefined;
    if (form.phone !== (company?.phone ?? "")) input.phone = form.phone || undefined;

    if (Object.keys(input).length === 0) return;

    await updateCompany(input);
  };

  const hasChanges =
    form.name !== (company?.name ?? "") ||
    form.taxId !== (company?.taxId ?? "") ||
    form.address !== (company?.address ?? "") ||
    form.email !== (company?.email ?? "") ||
    form.phone !== (company?.phone ?? "");

  if (loading && !company) {
    return (
      <Card>
        <Text size="2" color="gray">Cargando datos de la empresa...</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
        Datos de la empresa
      </Text>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <TextField.Root
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <TextField.Root
          placeholder="CUIT / RUT"
          value={form.taxId}
          onChange={(e) => setForm({ ...form, taxId: e.target.value })}
        />
        <TextField.Root
          placeholder="Dirección"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <TextField.Root
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <TextField.Root
          placeholder="Teléfono"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>

      {error && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "var(--color-danger-subtle)",
            borderRadius: "6px",
            marginTop: "10px",
          }}
        >
          <Text size="2" color="red">{error}</Text>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
        <Button
          size="1"
          disabled={!hasChanges || saving}
          onClick={handleSave}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </Card>
  );
}
