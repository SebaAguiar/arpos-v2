import { useState, useEffect, useRef, type ReactNode } from "react";
import { Text, TextField, Card, Select, Badge, Button } from "@radix-ui/themes";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  Cross2Icon,
  ReloadIcon,
  InfoCircledIcon,
  ChevronDownIcon,
  ChevronUpIcon,
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

type HelpTab = "clave" | "cert";

function HelpStep({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <div
        style={{
          flexShrink: 0,
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: "var(--accent)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: 700,
          marginTop: "2px",
        }}
      >
        {index}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "2px",
            fontSize: "13px",
          }}
        >
          {title}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code
      style={{
        background: "var(--gray-a3)",
        padding: "1px 5px",
        borderRadius: "4px",
        whiteSpace: "nowrap",
        fontFamily: "monospace",
        fontSize: "12px",
      }}
    >
      {children}
    </code>
  );
}

function HelpPanel({ tab, onTabChange }: { tab: HelpTab; onTabChange: (t: HelpTab) => void }) {
  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "10px 12px",
    background: active ? "var(--accent-subtle)" : "transparent",
    border: "none",
    borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
    cursor: "pointer",
    color: active ? "var(--accent)" : "var(--text-muted)",
    fontSize: "13px",
    fontWeight: 600,
  });

  const stepListStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    listStyle: "none",
    margin: 0,
    padding: 0,
  };

  return (
    <div
      style={{
        marginTop: "10px",
        borderRadius: "8px",
        border: "1px solid rgba(229, 77, 46, 0.25)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          backgroundColor: "rgba(229, 77, 46, 0.05)",
        }}
      >
        <button
          onClick={() => onTabChange("clave")}
          style={tabButtonStyle(tab === "clave")}
        >
          1. Clave Fiscal
        </button>
        <button
          onClick={() => onTabChange("cert")}
          style={tabButtonStyle(tab === "cert")}
        >
          2. Certificado (WSASS)
        </button>
      </div>

      <div
        style={{
          padding: "16px",
          fontSize: "13px",
          lineHeight: 1.6,
          color: "var(--text-secondary)",
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        {tab === "clave" ? (
          <div style={stepListStyle}>
            <HelpStep index={1} title="Entrá al portal de ARCA">
              Andá a{" "}
              <a
                href="https://auth.afip.gob.ar/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)", textDecoration: "underline" }}
              >
                auth.afip.gob.ar
              </a>{" "}
              y elegí <strong>Crear cuenta</strong>.
            </HelpStep>
            <HelpStep index={2} title="Validá tu identidad">
              Ingresá tu <strong>CUIT</strong> y completá tus datos personales (DNI, correo
              electrónico, teléfono). ARCA te envía códigos de validación por correo y SMS.
            </HelpStep>
            <HelpStep index={3} title="Creá tu clave">
              Mínimo 8 caracteres, con mayúsculas, minúsculas y números.
            </HelpStep>
            <HelpStep index={4} title="Subí el nivel de seguridad">
              Para adherir servicios (WSASS, Facturación Electrónica) el nivel suele tener que ser{" "}
              <strong>3 o superior</strong>: validá tu identidad con la <strong>cámara web</strong>{" "}
              (biometría) o desde el <strong>homebanking</strong> de tu banco.
            </HelpStep>
            <HelpStep index={5} title="Adherí el servicio de Facturación Electrónica">
              Desde <em>Administrar mis servicios</em> habilitá{" "}
              <strong>"Facturación Electrónica"</strong> (ex "Comprobantes en línea"). Sin ese alta,
              ARCA rechaza el certificado.
            </HelpStep>
            <HelpStep index={6} title="Importante">
              Arcom <strong>nunca almacena tu Clave Fiscal</strong> ni tu clave privada: ambas las usás
              vos en el portal de ARCA como parte del trámite, y quedan solo en tu PC.
            </HelpStep>
          </div>
        ) : (
          <div style={stepListStyle}>
            <HelpStep index={1} title="CUIT de prueba">
              Usá{" "}
              <Code>20-11111111-2</Code>{" "}
              (el CUIT de referencia que ARCA habilita para testing). En producción va el CUIT real del
              comercio.
            </HelpStep>
            <HelpStep index={2} title="Generá la clave privada y el CSR">
              Con OpenSSL en tu PC. En <Code>serialNumber</Code> poné{" "}
              <strong>tu CUIT de persona física</strong> (ARCA emite el certificado de testing siempre a
              tu nombre):
              <pre
                style={{
                  background: "var(--gray-a3)",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  overflowX: "auto",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  margin: "6px 0 0",
                  lineHeight: 1.5,
                }}
              >
{`openssl req -new -newkey rsa:2048 -nodes \\
  -keyout private.key -out cert.csr \\
  -subj "/C=AR/O=MiEmpresa/CN=ArcomPOS/serialNumber=CUIT 20XXXXXXXXX"`}
              </pre>
            </HelpStep>
            <HelpStep index={3} title="Adherite al WSASS">
              Entrá a ARCA con tu <strong>Clave Fiscal de persona física</strong> y adherite a la
              aplicación <strong>WSASS</strong> (Autogestión de Certificados Homologación) desde el
              Administrador de Relaciones.
            </HelpStep>
            <HelpStep index={4} title="Creá el certificado">
              En WSASS: <em>Nuevo Certificado</em> → pegá el contenido de <Code>cert.csr</Code>{" "}
              (formato PKCS#10) → <em>Crear DN y obtener certificado</em>. ARCA te devuelve el
              certificado <Code>.pem</Code> (empieza con <code>-----BEGIN CERTIFICATE-----</code>).
            </HelpStep>
            <HelpStep index={5} title="Autorizá el certificado (paso que más se olvida)">
              En WSASS autorizá el certificado para el servicio <Code>wsfe</Code> indicando como{" "}
              <strong>CUIT representada</strong> la <Code>20-11111111-2</Code>. Sin esto ARCA responde{" "}
              <em>"Computador no autorizado a acceder al servicio"</em>.
            </HelpStep>
            <HelpStep index={6} title="Cargá los archivos en Arcom">
              El certificado va en el campo <strong>Certificado (.cert)</strong> — su contenido empieza
              con <Code>-----BEGIN CERTIFICATE-----</Code> — y la key en <strong>Clave Privada (.key)</strong>{" "}
              (<Code>-----BEGIN PRIVATE KEY-----</Code>).
            </HelpStep>
            <HelpStep index={7} title="Punto de venta y ambiente">
              En homologación usá <Code>1</Code> y el ambiente <em>Homologación</em>. En producción el
              punto de venta debe estar habilitado en ARCA y el certificado debe ser el real.
            </HelpStep>
            <HelpStep index={8} title="Condición IVA">
              Elegí la condición fiscal del comercio (ej. <em>Responsable Inscripto</em>).
            </HelpStep>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [showHelp, setShowHelp] = useState(false);
  const [helpTab, setHelpTab] = useState<HelpTab>("clave");
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
      </div>

      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => setShowHelp((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: "13px",
            fontWeight: 600,
            padding: "4px 0",
          }}
        >
          <InfoCircledIcon width={14} height={14} />
          ¿Cómo obtengo el certificado y la clave?
          {showHelp ? (
            <ChevronUpIcon width={14} height={14} />
          ) : (
            <ChevronDownIcon width={14} height={14} />
          )}
        </button>

        {showHelp && <HelpPanel tab={helpTab} onTabChange={setHelpTab} />}
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
                .replace(/-(\d{8})(\d)/, "-$1-$2");
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
