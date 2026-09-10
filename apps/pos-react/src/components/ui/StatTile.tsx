import { type ReactNode } from "react";
import { Text } from "@radix-ui/themes";

interface StatTileProps {
  label: string;
  value: ReactNode;
  color?: "green" | "red" | "orange";
  size?: "3" | "4";
  variant?: "surface" | "hover";
}

export function StatTile({
  label,
  value,
  color,
  size = "4",
  variant = "surface",
}: StatTileProps) {
  return (
    <div
      style={{
        padding: "10px",
        backgroundColor: variant === "hover" ? "var(--bg-surface-hover)" : "var(--bg-surface)",
        borderRadius: "6px",
      }}
    >
      <Text size="1" color="gray">
        {label}
      </Text>
      <Text
        size={size}
        weight="bold"
        color={color}
        style={{ display: "block", marginTop: size === "3" ? "2px" : "4px" }}
      >
        {value}
      </Text>
    </div>
  );
}