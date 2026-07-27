import { Badge } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

interface StaleIndicatorProps {
  isStale: boolean;
}

export function StaleIndicator({ isStale }: StaleIndicatorProps) {
  if (!isStale) return null;

  return (
    <Badge color="yellow" variant="soft" size="1">
      <ExclamationTriangleIcon style={{ width: 12, height: 12 }} />
      Datos desactualizados
    </Badge>
  );
}
