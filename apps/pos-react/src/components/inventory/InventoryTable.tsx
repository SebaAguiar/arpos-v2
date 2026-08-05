import { Text, Table, Badge, Button, Flex, DropdownMenu, IconButton } from "@radix-ui/themes";
import {
  ArchiveIcon,
  CounterClockwiseClockIcon,
  PlusIcon,
  DotsVerticalIcon,
} from "@radix-ui/react-icons";
import type { StockItemData } from "@/repositories/inventory.repository";
import { StockInlineEditor } from "./StockInlineEditor";

interface InventoryTableProps {
  items: StockItemData[];
  loading: boolean;
  totalItems: number;
  search: string;
  statusFilter: string;
  onClearFilters: () => void;
  onViewHistory: (productId: string) => void;
  onAdjustStock: (productId: string) => void;
  onInlineSave?: (productId: string, type: "entry" | "exit", quantity: number) => void;
}

export function InventoryTable({
  items,
  loading,
  totalItems,
  search,
  statusFilter,
  onClearFilters,
  onViewHistory,
  onAdjustStock,
  onInlineSave,
}: InventoryTableProps) {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row style={{ backgroundColor: "#1e1e1e" }}>
          <Table.ColumnHeaderCell style={{ paddingLeft: "16px" }}>Código</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Producto</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell style={{ textAlign: "right" }}>Stock</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Estado</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell style={{ textAlign: "center" }}>Acciones</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {loading && totalItems === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={5}>
              <Flex align="center" justify="center" gap="2" style={{ padding: "40px" }}>
                <Text size="2" color="gray">
                  Cargando inventario...
                </Text>
              </Flex>
            </Table.Cell>
          </Table.Row>
        ) : items.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={5}>
              <Flex direction="column" align="center" justify="center" gap="3" style={{ padding: "48px 16px" }}>
                <ArchiveIcon width={36} height={36} style={{ opacity: 0.3 }} />
                <Flex direction="column" align="center" gap="1">
                  <Text size="3" weight="bold">
                    No se encontraron productos
                  </Text>
                  <Text size="2" color="gray">
                    {search || statusFilter !== "all"
                      ? "Intenta modificar la búsqueda o el filtro de estado seleccionado."
                      : "No hay productos registrados en el inventario."}
                  </Text>
                </Flex>
                {(search || statusFilter !== "all") && (
                  <Button size="2" variant="soft" color="gray" onClick={onClearFilters} style={{ marginTop: "4px" }}>
                    Limpiar filtros
                  </Button>
                )}
              </Flex>
            </Table.Cell>
          </Table.Row>
        ) : (
          items.map((item) => {
            const minStock = item.minStock ?? 5;
            const isOutOfStock = item.stockQuantity <= 0;
            const isLowStock = item.stockQuantity > 0 && item.stockQuantity <= minStock;

            return (
              <Table.Row
                key={item.productId}
                className={item.stockQuantity <= 0 ? "inventory-row--critical" : undefined}
                style={{
                  backgroundColor: isOutOfStock
                    ? "rgba(229, 77, 46, 0.06)"
                    : isLowStock
                    ? "rgba(245, 158, 11, 0.03)"
                    : undefined,
                  transition: "background-color 0.15s ease",
                }}
              >
                <Table.Cell style={{ paddingLeft: "16px", verticalAlign: "middle" }}>
                  <Text size="2" style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}>
                    {item.productCode}
                  </Text>
                </Table.Cell>
                <Table.Cell style={{ verticalAlign: "middle" }}>
                  <Text size="2" weight="medium">
                    {item.productName}
                  </Text>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "right", verticalAlign: "middle" }}>
                  {onInlineSave ? (
                    <StockInlineEditor item={item} onSave={onInlineSave} />
                  ) : (
                    <Text
                      size="3"
                      weight="bold"
                      color={isOutOfStock ? "red" : isLowStock ? "orange" : undefined}
                    >
                      {item.stockQuantity}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell style={{ verticalAlign: "middle" }}>
                  {isOutOfStock ? (
                    <Badge color="red" variant="soft" size="1">
                      Sin stock
                    </Badge>
                  ) : isLowStock ? (
                    <Badge color="orange" variant="soft" size="1">
                      Stock bajo
                    </Badge>
                  ) : (
                    <Badge color="green" variant="soft" size="1">
                      Normal
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell style={{ textAlign: "center", verticalAlign: "middle" }}>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <IconButton
                        variant="ghost"
                        size="1"
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
                </Table.Cell>
              </Table.Row>
            );
          })
        )}
      </Table.Body>
    </Table.Root>
  );
}
