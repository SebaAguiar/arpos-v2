import { type ReactNode } from "react";
import { Text } from "@radix-ui/themes";

interface StatTileProps {
  label: string;
  value: ReactNode;
  color?: "green" | "red" | "orange";
  size?: "3" | "4" | "5";
  variant?: "surface" | "hover";
}

const SIZE_PADDING: Record<NonNullable<StatTileProps["size"]>, { padding: string; radius: string }> = {
  "3": { padding: "10px", radius: "6px" },
  "4": { padding: "10px", radius: "6px" },
  "5": { padding: "14px", radius: "8px" },
};

const SIZE_MARGIN_TOP: Record<NonNullable<StatTileProps["size"]>, string> = {
  "3": "2px",
  "4": "4px",
  "5": "4px",
};

export function StatTile({
  label,
  value,
  color,
  size = "4",
  variant = "surface",
}: StatTileProps) {
  const tileStyle = SIZE_PADDING[size];
  return (
    <div
      style={{
        padding: tileStyle.padding,
        backgroundColor: variant === "hover" ? "var(--bg-surface-hover)" : "var(--bg-surface)",
        borderRadius: tileStyle.radius,
      }}
    >
      <Text size="1" color="gray">
        {label}
      </Text>
      <Text
        size={size}
        weight="bold"
        color={color}
        style={{ display: "block", marginTop: SIZE_MARGIN_TOP[size] }}
      >
        {value}
      </Text>
    </div>
  );
}