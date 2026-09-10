export function KbdShortcut({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 6px",
        fontSize: "11px",
        fontWeight: "bold",
        backgroundColor: "var(--accent-subtle)",
        color: "var(--accent)",
        borderRadius: "4px",
        marginLeft: "6px",
        border: "1px solid var(--accent)",
      }}
    >
      {label}
    </span>
  );
}