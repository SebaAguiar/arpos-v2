import { type ReactNode } from "react";
import { Text } from "@radix-ui/themes";

interface SummaryCardProps {
  title: string;
  children: ReactNode;
}

export function SummaryCard({ title, children }: SummaryCardProps) {
  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "var(--bg-surface-hover)",
        borderRadius: "8px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Text size="3" weight="bold" style={{ display: "block", marginBottom: "12px" }}>
        {title}
      </Text>
      {children}
    </div>
  );
}