import { type CSSProperties, type ReactNode } from "react";
import { Text } from "@radix-ui/themes";

interface SectionHeaderProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function SectionHeader({ children, style }: SectionHeaderProps) {
  return (
    <Text
      size="1"
      color="gray"
      style={{ display: "block", textTransform: "uppercase", letterSpacing: "0.05em", ...style }}
    >
      {children}
    </Text>
  );
}