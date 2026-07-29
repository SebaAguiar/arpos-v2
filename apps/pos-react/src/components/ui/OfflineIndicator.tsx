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
        backgroundColor: "rgba(239, 68, 68, 0.12)",
        color: "#ef4444",
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
          backgroundColor: "#ef4444",
          display: "inline-block",
        }}
      />
      Sin conexión
    </div>
  );
}
