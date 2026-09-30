interface BackendLoadingProps {
  error: string | null;
  onRetry?: () => void;
}

export function BackendLoading({ error, onRetry }: BackendLoadingProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-page, #0f0f0f)",
        color: "var(--text-primary, #fff)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "400px", padding: "24px" }}>
        <div
          style={{
            fontSize: "32px",
            fontWeight: 700,
            marginBottom: "8px",
            letterSpacing: "-0.5px",
          }}
        >
          Arcom
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "var(--text-secondary, #888)",
            marginBottom: "32px",
          }}
        >
          Point of Sale System
        </div>

        {error ? (
          <div>
            <div
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-danger) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-danger)",
                  marginBottom: "4px",
                  fontWeight: 500,
                }}
              >
                Error al iniciar el backend
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary, #888)",
                  wordBreak: "break-word",
                }}
              >
                {error}
              </div>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  backgroundColor: "var(--accent, #3b82f6)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Reintentar
              </button>
            )}
          </div>
        ) : (
          <div>
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid var(--border, #333)",
                borderTopColor: "var(--accent, #3b82f6)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div
              style={{
                fontSize: "14px",
                color: "var(--text-secondary, #888)",
              }}
            >
              Iniciando servidor...
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-tertiary, #555)",
                marginTop: "8px",
              }}
            >
              Esto puede tomar unos segundos
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
