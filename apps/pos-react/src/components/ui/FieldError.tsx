import { type CSSProperties, type ReactNode } from "react";
import { Text } from "@radix-ui/themes";

interface FieldErrorProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function FieldError({ children, style }: FieldErrorProps) {
  return (
    <Text
      size="1"
      color="red"
      style={{ display: "block", marginTop: "4px", ...style }}
    >
      {children}
    </Text>
  );
}