import { Badge } from "@radix-ui/themes";

interface StockBadgeProps {
  quantity: number;
  minStock?: number;
}

export function StockBadge({ quantity, minStock = 5 }: StockBadgeProps) {
  if (quantity <= 0) {
    return (
      <Badge color="red" variant="soft" radius="full">
        Agotado (0)
      </Badge>
    );
  }

  if (quantity <= minStock) {
    return (
      <Badge color="amber" variant="soft" radius="full">
        Stock Bajo ({quantity})
      </Badge>
    );
  }

  return (
    <Badge color="green" variant="soft" radius="full">
      {quantity} unid.
    </Badge>
  );
}
