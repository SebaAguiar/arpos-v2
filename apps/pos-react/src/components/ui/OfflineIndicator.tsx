import { useOffline } from "@/hooks/useOffline";

export function OfflineIndicator() {
  const { isOnline } = useOffline();

  if (isOnline) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "6px",
        backgroundColor: "color-mix(in srgb, var(--color-danger) 12%, transparent)",
        color: "var(--color-danger)",
        fontSize: "12px",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: "var(--color-danger)",
          display: "inline-block",
        }}
      />
      Sin conexión
    </div>
  );
}
