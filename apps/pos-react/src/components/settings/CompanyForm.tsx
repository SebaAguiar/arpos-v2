import { useState, useEffect, useRef } from "react";
import { Text, TextField, Card, Button } from "@radix-ui/themes";
import { CheckIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useCompanyStore } from "@/stores/company.store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

function isValidCuit(raw: string): boolean {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length !== 11) return false;

  const sum = CUIT_WEIGHTS.reduce((acc, weight, i) => acc + Number(digits[i]) * weight, 0);
  const remainder = sum % 11;
  const expected =
    remainder === 0 ? 0 : remainder === 1 ? -1 : 11 - remainder;

  return expected === Number(digits[10]);
}

type FormField = "name" | "taxId" | "address" | "email" | "phone";

export function CompanyForm() {
  const { company, loading, saving, error, fetchCompany, updateCompany } = useCompanyStore();
  const [form, setForm] = useState({ name: "", taxId: "", address: "", email: "", phone: "" });
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>({});
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const [prevCompany, setPrevCompany] = useState(company);
  if (company !== prevCompany) {
    setPrevCompany(company);
    if (company) {
      setForm({
        name: company.name,
        taxId: company.taxId,
        address: company.address ?? "",
        email: company.email ?? "",
        phone: company.phone ?? "",
      });
    }
  }

  const setField = (field: FormField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: FormField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const nameError = form.name.trim() === "";
  const emailError = form.email.trim() !== "" && !EMAIL_RE.test(form.email.trim());
  const cuitError = form.taxId.trim() !== "" && !isValidCuit(form.taxId);
  const hasErrors = nameError || emailError;

  const handleSave = async () => {
    if (hasErrors) return;
    const input: Record<string, string | undefined> = {};
    if (form.name !== company?.name) input.name = form.name;
    if (form.taxId !== company?.taxId) input.taxId = form.taxId;
    if (form.address !== (company?.address ?? "")) input.address = form.address || undefined;
    if (form.email !== (company?.email ?? "")) input.email = form.email || undefined;
    if (form.phone !== (company?.phone ?? "")) input.phone = form.phone || undefined;

    if (Object.keys(input).length === 0) return;

    if (savedTimer.current) clearTimeout(savedTimer.current);
    setJustSaved(false);
    const ok = await updateCompany(input);
    if (ok) {
      setJustSaved(true);
      savedTimer.current = setTimeout(() => setJustSaved(false), 2000);
    }
  };

  const hasChanges =
    form.name !== (company?.name ?? "") ||
    form.taxId !== (company?.taxId ?? "") ||
    form.address !== (company?.address ?? "") ||
    form.email !== (company?.email ?? "") ||
    form.phone !== (company?.phone ?? "");

  if (error && !company) {
    return (
      <Card>
        <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
          Datos de la empresa
        </Text>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            padding: "16px 0",
          }}
        >
          <ExclamationTriangleIcon width={28} height={28} color="var(--red-9)" />
          <Text size="2" color="gray" style={{ textAlign: "center" }}>
            {error}
          </Text>
          <Button size="1" variant="soft" onClick={() => fetchCompany()}>
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  if (loading && !company) {
    return (
      <Card>
        <Text size="2" color="gray">Cargando datos de la empresa...</Text>
      </Card>
    );
  }

  const fieldLabel = (label: string) => (
    <Text size="2" weight="medium" style={{ display: "block", marginBottom: "6px" }}>
      {label}
    </Text>
  );

  return (
    <Card>
      <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
        Datos de la empresa
      </Text>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          {fieldLabel("Nombre")}
          <TextField.Root
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => markTouched("name")}
            aria-label="Nombre de la empresa"
            aria-invalid={touched.name && nameError}
          />
          {touched.name && nameError && (
            <Text size="1" color="red" style={{ display: "block", marginTop: "4px" }}>
              El nombre es obligatorio
            </Text>
          )}
        </div>

        <div>
          {fieldLabel("CUIT / RUT")}
          <TextField.Root
            value={form.taxId}
            onChange={(e) => setField("taxId", e.target.value)}
            onBlur={() => markTouched("taxId")}
            aria-label="CUIT o RUT de la empresa"
            aria-invalid={touched.taxId && cuitError}
          />
          {touched.taxId && cuitError && (
            <Text size="1" color="red" style={{ display: "block", marginTop: "4px" }}>
              Formato de CUIT inválido (11 dígitos)
            </Text>
          )}
        </div>

        <div>
          {fieldLabel("Dirección")}
          <TextField.Root
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            aria-label="Dirección de la empresa"
          />
        </div>

        <div>
          {fieldLabel("Email")}
          <TextField.Root
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={() => markTouched("email")}
            aria-label="Email de la empresa"
            aria-invalid={touched.email && emailError}
          />
          {touched.email && emailError && (
            <Text size="1" color="red" style={{ display: "block", marginTop: "4px" }}>
              Ingresá un email válido
            </Text>
          )}
        </div>

        <div>
          {fieldLabel("Teléfono")}
          <TextField.Root
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            aria-label="Teléfono de la empresa"
          />
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "var(--color-danger-subtle)",
            borderRadius: "6px",
            marginTop: "12px",
          }}
        >
          <Text size="2" color="red">{error}</Text>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" }}>
        <div>
          {hasChanges && !justSaved && !saving && (
            <Text size="1" color="orange">Hay cambios sin guardar</Text>
          )}
          {justSaved && (
            <Text size="1" color="green" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <CheckIcon width={12} height={12} />
              Guardado
            </Text>
          )}
        </div>
        <Button size="1" disabled={!hasChanges || saving || hasErrors} onClick={handleSave}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </Card>
  );
}
