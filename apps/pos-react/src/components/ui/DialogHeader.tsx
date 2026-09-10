import { type CSSProperties, type ReactNode } from "react";
import { Text } from "@radix-ui/themes";
import { Cross1Icon } from "@radix-ui/react-icons";

interface DialogHeaderProps {
  title: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  right?: ReactNode;
  onClose?: () => void;
  style?: CSSProperties;
}

export function DialogHeader({
  title,
  icon,
  badge,
  right,
  onClose,
  style,
}: DialogHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {icon}
        <Text size="4" weight="bold">
          {title}
        </Text>
        {badge}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {right}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <Cross1Icon width={18} height={18} />
          </button>
        )}
      </div>
    </div>
  );
}