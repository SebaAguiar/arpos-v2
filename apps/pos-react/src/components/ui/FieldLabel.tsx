import { type ReactNode } from "react";
import { Text } from "@radix-ui/themes";

interface FieldLabelProps {
  children: ReactNode;
  size?: "1" | "2" | "3";
  weight?: "regular" | "medium" | "bold";
  marginBottom?: string;
}

export function FieldLabel({
  children,
  size = "2",
  weight = "bold",
  marginBottom = "6px",
}: FieldLabelProps) {
  return (
    <Text
      size={size}
      weight={weight}
      style={{ display: "block", marginBottom }}
    >
      {children}
    </Text>
  );
}