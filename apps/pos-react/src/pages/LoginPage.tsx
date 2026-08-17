import { useState, useCallback } from "react";
import { Text, TextField } from "@radix-ui/themes";
import { ExclamationTriangleIcon, LightningBoltIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const { login, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password || loading) return;
      await login(email.trim(), password);
    },
    [email, password, loading, login]
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
            Ingresá para continuar
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
              placeholder="admin@arcom.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              autoFocus
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Text size="2" weight="bold">
              Contraseña
            </Text>
            <TextField.Root
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
            />
          </div>

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                backgroundColor: "#e5484d15",
                border: "1px solid #e5484d50",
                borderRadius: "6px",
              }}
            >
              <ExclamationTriangleIcon width={16} height={16} color="#e5484d" />
              <Text size="2" color="red" style={{ flex: 1 }}>
                {error}
              </Text>
            </div>
          )}

          <button
            type="submit"
            disabled={!email.trim() || !password || loading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor:
                email.trim() && password && !loading ? "var(--accent)" : "var(--bg-surface)",
              color:
                email.trim() && password && !loading ? "#fff" : "var(--text-secondary)",
              border: "none",
              borderRadius: "6px",
              fontSize: "15px",
              fontWeight: 600,
              cursor:
                email.trim() && password && !loading ? "pointer" : "not-allowed",
              transition: "background-color 150ms ease",
            }}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
