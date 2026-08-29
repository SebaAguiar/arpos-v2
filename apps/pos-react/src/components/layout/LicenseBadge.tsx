import { Badge } from "@radix-ui/themes";
import type { LicenseStatus } from "@/lib/license";

interface LicenseBadgeProps {
  status: LicenseStatus | null;
}

function labelFor(status: LicenseStatus | null): { text: string; color: "green" | "orange" | "red" } {
  if (!status) {
    return { text: "Sin licencia", color: "red" };
  }
  switch (status.status) {
    case "valid":
      return { text: `Licencia OK · ${status.daysLeft}d`, color: "green" };
    case "grace":
      return { text: `Licencia por vencer · ${status.daysLeft}d`, color: "orange" };
    case "expired":
      return { text: "Licencia vencida", color: "red" };
    case "invalid":
      return { text: "Sin licencia", color: "red" };
  }
}

export function LicenseBadge({ status }: LicenseBadgeProps) {
  const { text, color } = labelFor(status);
  return (
    <Badge color={color} variant="soft" size="1" title="Estado de tu licencia">
      {text}
    </Badge>
  );
}
