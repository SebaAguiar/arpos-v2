import { useState, useEffect, useRef } from "react";
import { Text, TextField, Card, Select, Badge, Button } from "@radix-ui/themes";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  Cross2Icon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useArcaStore } from "@/stores/arca.store";

const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

function isValidCuit(raw: string): boolean {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length !== 11) return false;

  const sum = CUIT_WEIGHTS.reduce(
    (acc, weight, i) => acc + Number(digits[i]) * weight,
    0
  );
  const remainder = sum % 11;
  const expected = remainder === 0 ? 0 : remainder === 1 ? -1 : 11 - remainder;

  return expected === Number(digits[10]);
}

const RESPONSABILIDADES_IVA = [
  { value: "RI", label: "Responsable Inscripto" },
  { value: "RM", label: "Responsable Monotributo" },
  { value: "CF", label: "Consumidor Final" },
  { value: "RN", label: "Responsable No Inscripto" },
  { value: "EX", label: "Exento" },
];

export function ArcaConfigForm() {
  const {
    config,
    isLoadingConfig,
    isSaving,
    error,
    fetchConfig,
    saveConfig,
    deleteConfig,
    clearError,
  } = useArcaStore();

  const [form, setForm] = useState({
    cuit: "",
    certificate: "",
    privateKey: "",
    point_of_sale: "1",
    environment: "homologacion",
    responsabilidad_iva: "CF",
  });
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
  const [justSaved, setJustSaved] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const [prevConfig, setPrevConfig] = useState(config);
  if (config !== prevConfig) {
    setPrevConfig(config);
    if (config) {
      setForm({
        cuit: String(config.cuit),
        certificate: "",
        privateKey: "",
        point_of_sale: String(config.point_of_sale),
        environment: config.environment,
        responsabilidad_iva: config.responsabilidad_iva,
      });
    }
  }

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (justSaved) {
      setJustSaved(false);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    }
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const cuitDigits = form.cuit.replace(/[^\d]/g, "");
  const cuitError = cuitDigits.length > 0 && !isValidCuit(cuitDigits);
  const cuitIncomplete = cuitDigits.length > 0 && cuitDigits.length < 11;
  const certRequired = !config && form.certificate.trim() === "";
  const keyRequired = !config && form.privateKey.trim() === "";
  const hasErrors =
    cuitError || cuitIncomplete || certRequired || keyRequired;

  const handleSave = async () => {
    if (hasErrors) return;
    try {
      await saveConfig({
        cuit: Number(cuitDigits),
        certificate: form.certificate || "UNCHANGED",
        privateKey: form.privateKey || "UNCHANGED",
        point_of_sale: Number(form.point_of_sale) || 1,
        environment: form.environment,
        responsabilidad_iva: form.responsabilidad_iva,
      });
      setJustSaved(true);
      setForm((prev) => ({ ...prev, certificate: "", privateKey: "" }));
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setJustSaved(false), 3000);
    } catch {
      // error is set in store
    }
  };

  const handleDelete = async () => {
    try {
      await deleteConfig();
      setForm({
        cuit: "",
        certificate: "",
        privateKey: "",
        point_of_sale: "1",
        environment: "homologacion",
        responsabilidad_iva: "CF",
      });
      setShowConfirmDelete(false);
    } catch {
      // error is set in store
    }
  };

  if (isLoadingConfig) {
    return (
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            color: "var(--text-muted)",
          }}
        >
          <ReloadIcon
            width={16}
            height={16}
            style={{ animation: "spin 1s linear infinite", marginRight: "8px" }}
          />
          Cargando configuración...
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <Text size="3" weight="bold">
          Facturación Electrónica — ARCA
        </Text>
        {config ? (
          <Badge color="green" variant="soft" size="2">
            <CheckIcon width={12} height={12} />
            &nbsp;Configurado
          </Badge>
        ) : (
          <Badge color="orange" variant="soft" size="2">
            <ExclamationTriangleIcon width={12} height={12} />
            &nbsp;Sin configurar
          </Badge>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            marginBottom: "12px",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "8px",
            color: "#ef4444",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Cross2Icon width={14} height={14} />
          {error}
          <button
            onClick={clearError}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#ef4444",
            }}
          >
            <Cross2Icon width={12} height={12} />
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* CUIT */}
        <div>
          <Text
            size="2"
            weight="medium"
            style={{ display: "block", marginBottom: "6px" }}
          >
            CUIT
          </Text>
          <TextField.Root
            placeholder="20-12345678-9"
            value={form.cuit}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "").slice(0, 11);
              const formatted = raw
                .replace(/^(\d{2})(\d)/, "$1-$2")
                .replace(/-(\d{4})(\d)/, "-$1-$2");
              setField("cuit", formatted);
            }}
            onBlur={() => markTouched("cuit")}
            aria-label="CUIT"
          />
          {touched.cuit && cuitError && (
            <Text size="1" color="red" style={{ marginTop: "4px", display: "block" }}>
              CUIT inválido — debe tener 11 dígitos con verificador correcto
            </Text>
          )}
        </div>

        {/* Certificado */}
        <div>
          <Text
            size="2"
            weight="medium"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Certificado (.cert)
          </Text>
          <textarea
            placeholder={
              config
                ? "Dejar vacío para mantener el actual"
                : "Pegar contenido del certificado"
            }
            value={form.certificate}
            onChange={(e) => setField("certificate", e.target.value)}
            onBlur={() => markTouched("certificate")}
            rows={4}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--gray-a6)",
              borderRadius: "8px",
              backgroundColor: "var(--color-panel-solid)",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontFamily: "monospace",
              resize: "vertical",
            }}
            aria-label="Certificado ARCA"
          />
          {touched.certificate && certRequired && (
            <Text size="1" color="red" style={{ marginTop: "4px", display: "block" }}>
              El certificado es requerido en la primera configuración
            </Text>
          )}
        </div>

        {/* Private Key */}
        <div>
          <Text
            size="2"
            weight="medium"
            style={{ display: "block", marginBottom: "6px" }}
          >
            Clave Privada (.key)
          </Text>
          <textarea
            placeholder={
              config
                ? "Dejar vacío para mantener la actual"
                : "Pegar contenido de la clave privada"
            }
            value={form.privateKey}
            onChange={(e) => setField("privateKey", e.target.value)}
            onBlur={() => markTouched("privateKey")}
            rows={4}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--gray-a6)",
              borderRadius: "8px",
              backgroundColor: "var(--color-panel-solid)",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontFamily: "monospace",
              resize: "vertical",
            }}
            aria-label="Clave privada ARCA"
          />
          {touched.privateKey && keyRequired && (
            <Text size="1" color="red" style={{ marginTop: "4px", display: "block" }}>
              La clave privada es requerida en la primera configuración
            </Text>
          )}
        </div>

        {/* Punto de Venta + Environment + Responsabilidad IVA */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div>
            <Text
              size="2"
              weight="medium"
              style={{ display: "block", marginBottom: "6px" }}
            >
              Punto de Venta
            </Text>
            <TextField.Root
              placeholder="1"
              value={form.point_of_sale}
              onChange={(e) =>
                setField("point_of_sale", e.target.value.replace(/[^\d]/g, ""))
              }
              aria-label="Punto de venta"
            />
          </div>

          <div>
            <Text
              size="2"
              weight="medium"
              style={{ display: "block", marginBottom: "6px" }}
            >
              Ambiente
            </Text>
            <Select.Root
              value={form.environment}
              onValueChange={(v) => setField("environment", v)}
            >
              <Select.Trigger aria-label="Ambiente ARCA" />
              <Select.Content position="popper">
                <Select.Item value="homologacion">Homologación</Select.Item>
                <Select.Item value="produccion">Producción</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          <div>
            <Text
              size="2"
              weight="medium"
              style={{ display: "block", marginBottom: "6px" }}
            >
              Condición IVA
            </Text>
            <Select.Root
              value={form.responsabilidad_iva}
              onValueChange={(v) => setField("responsabilidad_iva", v)}
            >
              <Select.Trigger aria-label="Responsabilidad IVA" />
              <Select.Content position="popper">
                {RESPONSABILIDADES_IVA.map((r) => (
                  <Select.Item key={r.value} value={r.value}>
                    {r.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "8px",
            paddingTop: "12px",
            borderTop: "1px solid var(--gray-a3)",
          }}
        >
          {config && !showConfirmDelete && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Eliminar configuración
            </button>
          )}
          {showConfirmDelete && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Text size="2" color="red">
                ¿Eliminar?
              </Text>
              <Button
                size="2"
                color="red"
                variant="soft"
                onClick={handleDelete}
                disabled={isSaving}
              >
                Sí, eliminar
              </Button>
              <Button
                size="2"
                variant="ghost"
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancelar
              </Button>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginLeft: "auto",
            }}
          >
            {justSaved && (
              <Badge color="green" variant="soft" size="2">
                <CheckIcon width={12} height={12} />
                &nbsp;Guardado
              </Badge>
            )}
            <Button
              size="2"
              onClick={handleSave}
              disabled={isSaving || hasErrors}
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
