import { Text, IconButton, DropdownMenu } from "@radix-ui/themes";
import {
  DotsVerticalIcon,
  CounterClockwiseClockIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { StockBadge } from "@/components/product/StockBadge";
import type { StockItemData } from "@/repositories/inventory.repository";
import { useSwipeReveal } from "@/hooks/useSwipeReveal";

interface InventoryCardProps {
  item: StockItemData;
  onViewHistory: (productId: string) => void;
  onAdjustStock: (productId: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  const ms = timestamp > 1e11 ? timestamp : timestamp * 1000;
  const now = Date.now();
  const diffSec = Math.floor((now - ms) / 1000);

  if (diffSec < 60) return "hace un momento";
  if (diffSec < 3600) return `hace ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `hace ${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 2592000) return `hace ${Math.floor(diffSec / 86400)} d`;
  return new Date(ms).toLocaleDateString("es-AR");
}

export function InventoryCard({ item, onViewHistory, onAdjustStock }: InventoryCardProps) {
  const stockQty = item.stockQuantity;
  const minStock = item.minStock ?? 5;
  const { translateX, reset, handlers } = useSwipeReveal({ threshold: 40, maxDistance: 90 });

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "8px",
      }}
    >
      {/* Botones de acción revelados al hacer Swipe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "90px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          backgroundColor: "var(--bg-elevated)",
          paddingRight: "8px",
        }}
      >
        <IconButton
          size="1"
          variant="soft"
          color="gray"
          onClick={() => {
            reset();
            onViewHistory(item.productId);
          }}
          aria-label="Ver historial"
        >
          <CounterClockwiseClockIcon width={14} height={14} />
        </IconButton>
        <IconButton
          size="1"
          variant="solid"
          color="orange"
          onClick={() => {
            reset();
            onAdjustStock(item.productId);
          }}
          aria-label="Ajustar stock"
        >
          <PlusIcon width={14} height={14} />
        </IconButton>
      </div>

      {/* Tarjeta frontal con soporte para drag/pointer events */}
      <div
        {...handlers}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 || translateX === -90 ? "transform 0.2s ease-out" : "none",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "12px",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          userSelect: "none",
          touchAction: "pan-y",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="3" weight="bold" style={{ display: "block" }}>
              {item.productName}
            </Text>
            <Text size="1" color="gray" style={{ fontFamily: "monospace", display: "block" }}>
              {item.productCode}
            </Text>
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <IconButton
                size="1"
                variant="ghost"
                style={{ cursor: "pointer", color: "var(--text-secondary)" }}
                aria-label={`Acciones para ${item.productName}`}
              >
                <DotsVerticalIcon width={14} height={14} />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" sideOffset={4}>
              <DropdownMenu.Item onSelect={() => onViewHistory(item.productId)}>
                <CounterClockwiseClockIcon width={14} height={14} style={{ marginRight: "6px" }} />
                Ver historial
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => onAdjustStock(item.productId)}>
                <PlusIcon width={14} height={14} style={{ marginRight: "6px" }} />
                Ajustar stock
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <StockBadge quantity={stockQty} minStock={minStock} />
        </div>

        {item.lastMovementAt != null && (
          <Text size="1" color="gray">
            Último movimiento: {formatRelativeTime(item.lastMovementAt)}
          </Text>
        )}
      </div>
    </div>
  );
}
