import { type CSSProperties, type ReactNode } from "react";

interface FormActionsProps {
  children: ReactNode;
  marginTop?: string;
  style?: CSSProperties;
}

export function FormActions({ children, marginTop, style }: FormActionsProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "8px",
        ...(marginTop ? { marginTop } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}