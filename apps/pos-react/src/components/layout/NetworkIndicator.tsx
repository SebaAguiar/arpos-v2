import { Badge } from "@radix-ui/themes";

interface NetworkIndicatorProps {
  isOnline: boolean;
  isBackendAvailable: boolean;
  pendingCount: number;
  isProcessing: boolean;
}

export function NetworkIndicator({
  isOnline,
  isBackendAvailable,
  pendingCount,
  isProcessing,
}: NetworkIndicatorProps) {
  if (isProcessing) {
    return (
      <Badge color="blue" variant="soft" size="1">
        Sincronizando...
      </Badge>
    );
  }

  if (!isBackendAvailable) {
    return (
      <Badge color="red" variant="soft" size="1">
        Sin conexión al servidor
      </Badge>
    );
  }

  if (!isOnline) {
    return (
      <Badge color="yellow" variant="soft" size="1">
        Modo offline
      </Badge>
    );
  }

  if (pendingCount > 0) {
    return (
      <Badge color="yellow" variant="soft" size="1">
        Sync pendiente ({pendingCount})
      </Badge>
    );
  }

  return (
    <Badge color="green" variant="soft" size="1">
      Sincronizado
    </Badge>
  );
}
