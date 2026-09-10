import { useState, useCallback } from "react";
import { Text, TextField } from "@radix-ui/themes";
import { LightningBoltIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/hooks/useAuth";
import { InlineNotice } from "@/components/ui/InlineNotice";

export function LoginPage() {
  const { loginWithLicense, loading, error, clearError } = useAuth();
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
        {/* Logo */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "var(--accent-subtle)",
              marginBottom: "12px",
            }}
          >
            <LightningBoltIcon width={24} height={24} style={{ color: "var(--accent)" }} />
          </div>
          <Text size="5" weight="bold" style={{ display: "block" }}>
            Arcom
          </Text>
          <Text size="2" color="gray">
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
