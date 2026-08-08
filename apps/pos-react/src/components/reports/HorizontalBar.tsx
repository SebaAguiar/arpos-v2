import { Text } from "@radix-ui/themes";

export interface HorizontalBarProps {
  label: string;
  percentage: number;
  color: string;
  detail?: string;
}

export function HorizontalBar({ label, percentage, color, detail }: HorizontalBarProps) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <Text size="2">{label}</Text>
        <Text size="2" color="gray">
          {percentage}%{detail ? ` — ${detail}` : ""}
        </Text>
      </div>
      <div
        style={{
          height: "8px",
          backgroundColor: "var(--bg-surface-hover)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percentage}%`,
            backgroundColor: color,
            borderRadius: "4px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
