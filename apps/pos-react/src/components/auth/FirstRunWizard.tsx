import { useState, useCallback } from "react";
import { Text, TextField } from "@radix-ui/themes";
import {
  LightningBoltIcon,
  CheckCircledIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  DownloadIcon,
} from "@radix-ui/react-icons";
import { useAuthStore } from "@/stores/auth.store";
import { SetupRepository } from "@/repositories/setup.repository";
import { LicenseRepository } from "@/repositories/license.repository";
import { MigrationWizard } from "@/components/auth/MigrationWizard";
import type { AccountLink } from "@/services/setup.service";
import { EMAIL_RE, validatePasswordMatch } from "@/lib/validators";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { FieldError } from "@/components/ui/FieldError";
import { InlineNotice } from "@/components/ui/InlineNotice";

type WizardStep = "welcome" | "account" | "company" | "admin" | "success";

interface CompanyData {
  companyName: string;
  taxId: string;
}

interface AdminData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  companyName?: string;
  taxId?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function FirstRunWizard() {
  const [step, setStep] = useState<WizardStep>("welcome");
  const [company, setCompany] = useState<CompanyData>({
    companyName: "",
    taxId: "",
  });
  const [admin, setAdmin] = useState<AdminData>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [migrationOpen, setMigrationOpen] = useState(false);

  const [accountEmail, setAccountEmail] = useState("");
  const [account, setAccount] = useState<AccountLink | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const login = useAuthStore((s) => s.login);
  const loginWithLicense = useAuthStore((s) => s.loginWithLicense);
  const checkSetup = useAuthStore((s) => s.checkSetup);

  const validateCompany = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!company.companyName.trim()) {
      newErrors.companyName = "Nombre del negocio requerido";
    }
    if (company.taxId.length < 8) {
      newErrors.taxId = "CUIT/RUT inválido (mínimo 8 caracteres)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [company]);

  const validateAdmin = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!admin.email.trim()) {
      newErrors.email = "Email requerido";
    } else if (!EMAIL_RE.test(admin.email)) {
      newErrors.email = "Email inválido";
    }
    if (admin.password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
    }
    if (!validatePasswordMatch(admin.password, admin.confirmPassword)) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [admin]);

  const handleVerifyAccount = useCallback(async () => {
    const trimmed = accountEmail.trim().toLowerCase();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setAccountError("Ingresá un email válido");
      return;
    }
    setAccountLoading(true);
    setAccountError(null);
    try {
      const { known, result } = await LicenseRepository.issueAndStore(trimmed);
      if (!known) {
        setAccountError(
          "No encontramos una cuenta activa con ese email. Verificá el email o creá tu negocio de cero.",
        );
        return;
      }
      if (result.ok && result.payload) {
        const p = result.payload;
        setAccount({
          sub: p.sub,
          email: p.email,
          name: p.name,
          planSlug: p.planSlug,
          planName: p.planName,
          maxStores: p.maxStores,
          features: p.features,
          validFrom: p.validFrom,
          validUntil: p.validUntil,
        });
      } else {
        setAccountError(
          "No pudimos verificar tu licencia ahora. Podés seguir creando tu negocio sin vincular.",
        );
      }
    } catch {
      setAccountError(
        "No pudimos verificar tu licencia ahora. Podés seguir creando tu negocio sin vincular.",
      );
    } finally {
      setAccountLoading(false);
    }
  }, [accountEmail]);

  const handleAccountContinue = useCallback(() => {
    if (!account) return;
    if (admin.email !== account.email) {
      setAdmin((prev) => ({ ...prev, email: account.email }));
    }
    setGlobalError(null);
    setStep("company");
  }, [account, admin.email]);

  const handleCompanyNext = useCallback(() => {
    if (validateCompany()) {
      setErrors({});
      setStep("admin");
    }
  }, [validateCompany]);

  const handleAdminSubmit = useCallback(async () => {
    if (!validateAdmin()) return;

    setLoading(true);
    setGlobalError(null);

    try {
      await SetupRepository.initCompany({
        companyName: company.companyName.trim(),
        taxId: company.taxId.trim(),
        adminEmail: admin.email.trim(),
        adminPassword: admin.password,
        account: account ?? undefined,
      });

      const loginSuccess = account
        ? await loginWithLicense(admin.email.trim())
        : await login(admin.email.trim(), admin.password);
      if (loginSuccess) {
        await checkSetup();
        setStep("success");
      } else {
        setGlobalError("Configuración completada. Iniciá sesión manualmente.");
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Error al inicializar la empresa";
      setGlobalError(message);
    } finally {
      setLoading(false);
    }
  }, [company, admin, validateAdmin, login, loginWithLicense, checkSetup, account]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-page)",
      }}
    >
      <div
        style={{
          width: "440px",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Step: Welcome */}
        {step === "welcome" && (
          <>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  backgroundColor: "var(--accent-subtle)",
                  marginBottom: "16px",
                }}
              >
                <LightningBoltIcon
                  width={28}
                  height={28}
                  style={{ color: "var(--accent)" }}
                />
              </div>
              <Text size="6" weight="bold" style={{ display: "block" }}>
                ¡Bienvenido a Arcom!
              </Text>
              <Text
                size="3"
                color="gray"
                style={{ display: "block", marginTop: "8px" }}
              >
                Vamos a configurar tu negocio en unos simples pasos.
              </Text>
            </div>
            <button
              onClick={() => setStep("company")}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              Comenzar configuración
              <ArrowRightIcon width={16} height={16} />
            </button>
            <button
              onClick={() => {
                setAccountError(null);
                setStep("account");
              }}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "transparent",
                color: "var(--text-primary)",
                border: "1px solid var(--accent)",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <CheckCircledIcon width={16} height={16} />
              Ya tengo una cuenta Arcom
            </button>
            <button
              onClick={() => setMigrationOpen(true)}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "transparent",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <DownloadIcon width={16} height={16} />
              Migrar mis datos desde Arcom v1
            </button>
          </>
        )}

        {/* Step: Account */}
        {step === "account" && (
          <>
            <div>
              <Text size="5" weight="bold" style={{ display: "block" }}>
                ¿Ya tenés una cuenta Arcom?
              </Text>
              <Text size="2" color="gray" style={{ display: "block", marginTop: "4px" }}>
                Ingresá el email que usás para tu suscripción. Si verificamos tu
                plan, vinculamos tu negocio local a tu cuenta automáticamente.
              </Text>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <FieldLabel>Email</FieldLabel>
                <TextField.Root
                  type="email"
                  placeholder="admin@negocio.com"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  autoFocus
                />
                {accountError && (
                  <FieldError>{accountError}</FieldError>
                )}
                {account && (
                  <Text size="2" color="green" style={{ display: "block", marginTop: "8px" }}>
                    Cuenta verificada · Plan {account.planName} · {account.maxStores}{" "}
                    {account.maxStores === 1 ? "sucursal" : "sucursales"}
                  </Text>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => {
                  setAccountError(null);
                  setStep("welcome");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <ArrowLeftIcon width={14} height={14} />
                Atrás
              </button>
              {!account ? (
                <button
                  onClick={handleVerifyAccount}
                  disabled={accountLoading}
                  style={{
                    flex: 2,
                    padding: "10px",
                    backgroundColor: accountLoading ? "var(--bg-surface)" : "var(--accent)",
                    color: accountLoading ? "var(--text-secondary)" : "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: accountLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {accountLoading ? "Verificando..." : "Verificar"}
                </button>
              ) : (
                <button
                  onClick={handleAccountContinue}
                  style={{
                    flex: 2,
                    padding: "10px",
                    backgroundColor: "var(--accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  Continuar
                  <ArrowRightIcon width={14} height={14} />
                </button>
              )}
            </div>

            {!account && accountError && (
              <Text size="2" color="gray" style={{ textAlign: "center" }}>
                ¿No es tu caso?{" "}
                <button
                  onClick={() => {
                    setAccountError(null);
                    setAccount(null);
                    setStep("company");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "var(--accent)",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Crear mi negocio de cero
                </button>
              </Text>
            )}
          </>
        )}

        {/* Step: Company */}
        {step === "company" && (
          <>
            <div>
              <Text size="5" weight="bold" style={{ display: "block" }}>
                Datos de tu negocio
              </Text>
              <Text size="2" color="gray" style={{ display: "block", marginTop: "4px" }}>
                Ingresá los datos fiscales de tu empresa.
              </Text>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <FieldLabel>
                  Nombre del negocio
                </FieldLabel>
                <TextField.Root
                  placeholder="Mi Negocio"
                  value={company.companyName}
                  onChange={(e) =>
                    setCompany({ ...company, companyName: e.target.value })
                  }
                  autoFocus
                />
                {errors.companyName && (
                  <FieldError>
                    {errors.companyName}
                  </FieldError>
                )}
              </div>

              <div>
                <FieldLabel>
                  CUIT / RUT
                </FieldLabel>
                <TextField.Root
                  placeholder="20-12345678-9"
                  value={company.taxId}
                  onChange={(e) =>
                    setCompany({ ...company, taxId: e.target.value })
                  }
                />
                {errors.taxId && (
                  <FieldError>
                    {errors.taxId}
                  </FieldError>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setStep("welcome")}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <ArrowLeftIcon width={14} height={14} />
                Atrás
              </button>
              <button
                onClick={handleCompanyNext}
                style={{
                  flex: 2,
                  padding: "10px",
                  backgroundColor: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                Siguiente
                <ArrowRightIcon width={14} height={14} />
              </button>
            </div>
          </>
        )}

        {/* Step: Admin */}
        {step === "admin" && (
          <>
            <div>
              <Text size="5" weight="bold" style={{ display: "block" }}>
                Crear usuario administrador
              </Text>
              <Text size="2" color="gray" style={{ display: "block", marginTop: "4px" }}>
                Este usuario tendrá acceso total al sistema.
              </Text>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <FieldLabel>
                  Email
                </FieldLabel>
                <TextField.Root
                  type="email"
                  placeholder="admin@negocio.com"
                  value={admin.email}
                  onChange={(e) =>
                    setAdmin({ ...admin, email: e.target.value })
                  }
                  readOnly={Boolean(account)}
                  autoFocus
                />
                {errors.email && (
                  <FieldError>
                    {errors.email}
                  </FieldError>
                )}
                {account && (
                  <Text size="2" color="gray" style={{ display: "block", marginTop: "6px" }}>
                    Email vinculado a tu cuenta Arcom ({account.email}). Se
                    aplicará tu plan {account.planName} con{" "}
                    {account.maxStores}{" "}
                    {account.maxStores === 1 ? "sucursal" : "sucursales"}.
                  </Text>
                )}
              </div>

              <div>
                <FieldLabel>
                  Contraseña
                </FieldLabel>
                <TextField.Root
                  type="password"
                  placeholder="••••••••"
                  value={admin.password}
                  onChange={(e) =>
                    setAdmin({ ...admin, password: e.target.value })
                  }
                />
                {errors.password && (
                  <FieldError>
                    {errors.password}
                  </FieldError>
                )}
              </div>

              <div>
                <FieldLabel>
                  Confirmar contraseña
                </FieldLabel>
                <TextField.Root
                  type="password"
                  placeholder="••••••••"
                  value={admin.confirmPassword}
                  onChange={(e) =>
                    setAdmin({ ...admin, confirmPassword: e.target.value })
                  }
                />
                {errors.confirmPassword && (
                  <FieldError>
                    {errors.confirmPassword}
                  </FieldError>
                )}
              </div>
            </div>

            {globalError && (
              <InlineNotice>{globalError}</InlineNotice>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => {
                  setErrors({});
                  setGlobalError(null);
                  setStep("company");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <ArrowLeftIcon width={14} height={14} />
                Atrás
              </button>
              <button
                onClick={handleAdminSubmit}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: "10px",
                  backgroundColor: loading ? "var(--bg-surface)" : "var(--accent)",
                  color: loading ? "var(--text-secondary)" : "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {loading ? "Configurando..." : "Finalizar"}
              </button>
            </div>
          </>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  backgroundColor: "#30a46c15",
                  marginBottom: "16px",
                }}
              >
                <CheckCircledIcon
                  width={28}
                  height={28}
                  style={{ color: "#30a46c" }}
                />
              </div>
              <Text size="5" weight="bold" style={{ display: "block" }}>
                ¡Configuración completada!
              </Text>
              <Text
                size="3"
                color="gray"
                style={{ display: "block", marginTop: "8px" }}
              >
                Tu negocio está listo para usar Arcom.
              </Text>
            </div>

            <div
              style={{
                padding: "16px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <Text size="2">
                • 1 sucursal creada
              </Text>
              <Text size="2">
                • 1 usuario administrador creado
              </Text>
              <Text size="2">
                • Base de datos inicializada
              </Text>
            </div>
          </>
        )}
      </div>

      <MigrationWizard
        open={migrationOpen}
        onClose={() => setMigrationOpen(false)}
        onComplete={async () => {
          await checkSetup();
        }}
      />
    </div>
  );
}
