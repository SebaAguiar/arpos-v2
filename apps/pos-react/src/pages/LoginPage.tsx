import { useState, useCallback } from "react";
import { Text, TextField } from "@radix-ui/themes";
import { useAuth } from "@/hooks/useAuth";
import { InlineNotice } from "@/components/ui/InlineNotice";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { useThemeStore } from "@/stores/theme.store";

export function LoginPage() {
  const { loginWithLicense, loading, error, clearError } = useAuth();
  const theme = useThemeStore((s) => s.theme);
  const [email, setEmail] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || loading) return;
      await loginWithLicense(email.trim());
    },
    [email, loading, loginWithLicense]
  );

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
          width: "380px",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Logo — lockup completo sobre la superficie de la tarjeta */}
        <div style={{ textAlign: "center" }}>
          <BrandLockup
            variant={theme === "dark" ? "negative" : "primary"}
            claim
            width={285}
            style={{ margin: "0 auto" }}
          />
          <Text size="2" color="gray" style={{ display: "block", marginTop: "4px" }}>
            Ingresa tu email para continuar
          </Text>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Text size="2" weight="bold">
              Email
            </Text>
            <TextField.Root
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              autoFocus
            />
          </div>

          {error && (
            <InlineNotice style={{ marginBottom: "12px" }}>{error}</InlineNotice>
          )}

          <button
            type="submit"
            disabled={!email.trim() || loading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor:
                email.trim() && !loading ? "var(--accent)" : "var(--bg-surface)",
              color:
                email.trim() && !loading ? "#fff" : "var(--text-secondary)",
              border: "none",
              borderRadius: "6px",
              fontSize: "15px",
              fontWeight: 600,
              cursor:
                email.trim() && !loading ? "pointer" : "not-allowed",
              transition: "background-color 150ms ease",
            }}
          >
            {loading ? "Verificando..." : "Iniciar sesion"}
          </button>
        </form>
      </div>
    </div>
  );
}
