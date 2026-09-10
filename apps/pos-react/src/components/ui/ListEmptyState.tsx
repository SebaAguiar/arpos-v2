import { type ComponentType, type CSSProperties } from "react";
import { Text } from "@radix-ui/themes";

type IconProps = { width?: number; height?: number; style?: CSSProperties };

interface ListEmptyStateProps {
  message: string;
  icon?: ComponentType<IconProps>;
}

export function ListEmptyState({ message, icon: Icon }: ListEmptyStateProps) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      {Icon && (
        <Icon width={32} height={32} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
      )}
      <Text size="2" color="gray">
        {message}
      </Text>
    </div>
  );
}