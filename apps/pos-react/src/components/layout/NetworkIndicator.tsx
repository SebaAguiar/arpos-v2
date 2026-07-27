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
        Syncing...
      </Badge>
    );
  }

  if (!isBackendAvailable) {
    return (
      <Badge color="red" variant="soft" size="1">
        Backend offline
      </Badge>
    );
  }

  if (!isOnline) {
    return (
      <Badge color="yellow" variant="soft" size="1">
        Sin internet
      </Badge>
    );
  }

  if (pendingCount > 0) {
    return (
      <Badge color="yellow" variant="soft" size="1">
        Sync pending ({pendingCount})
      </Badge>
    );
  }

  return (
    <Badge color="green" variant="soft" size="1">
      Online
    </Badge>
  );
}
