import { type CSSProperties, type ReactNode } from "react";

interface DialogFooterProps {
  children: ReactNode;
  borderColor?: string;
  style?: CSSProperties;
}

export function DialogFooter({ children, borderColor, style }: DialogFooterProps) {
  return (
    <div
      style={{
        padding: "12px 20px",
        borderTop: `1px solid ${borderColor ?? "var(--border)"}`,
        display: "flex",
        justifyContent: "flex-end",
        gap: "8px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}