import { useEffect, useState, useMemo } from "react";
import { Text, Table, Badge, Button, TextField, Tooltip, Flex, Card, Grid } from "@radix-ui/themes";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
  ArchiveIcon,
  CubeIcon,
  CounterClockwiseClockIcon,
} from "@radix-ui/react-icons";
import { useInventoryStore } from "@/stores/inventory.store";
import { StockAdjustmentDialog } from "@/components/inventory/StockAdjustmentDialog";
import { StockMovementsDialog } from "@/components/inventory/StockMovementsDialog";
import { StaleIndicator } from "@/components/ui/StaleIndicator";

type StatusFilter = "all" | "out_of_stock" | "low_stock" | "normal";

export function InventoryPage() {
  const stock = useInventoryStore((s) => s.stock);
  const loading = useInventoryStore((s) => s.loading);
  const error = useInventoryStore((s) => s.error);
  const isStale = useInventoryStore((s) => s.isStale);
  const fetchStock = useInventoryStore((s) => s.fetchStock);
  const clearError = useInventoryStore((s) => s.clearError);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [movementsOpen, setMovementsOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  // Contadores para KPIs
  const totalItems = stock.length;
  const totalUnits = useMemo(
    () => stock.reduce((sum, item) => sum + Math.max(0, item.stockQuantity), 0),
    [stock]
  );
  const outOfStockCount = useMemo(
    () => stock.filter((item) => item.stockQuantity <= 0).length,
    [stock]
  );
  const lowStockCount = useMemo(
    () => stock.filter((item) => item.stockQuantity > 0 && item.stockQuantity <= 5).length,
    [stock]
  );
  const normalStockCount = totalItems - outOfStockCount - lowStockCount;

  // Filtrado compuesto (Búsqueda + Filtro por Estado)
  const filtered = useMemo(() => {
    return stock.filter((item) => {
      const searchLower = search.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        item.productName.toLowerCase().includes(searchLower) ||
        item.productCode.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (statusFilter === "out_of_stock") return item.stockQuantity <= 0;
      if (statusFilter === "low_stock") return item.stockQuantity > 0 && item.stockQuantity <= 5;
      if (statusFilter === "normal") return item.stockQuantity > 5;

      return true;
    });
  }, [stock, search, statusFilter]);

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="page">
      <Flex direction="column" gap="5">
        {/* Header con Título y Acción Principal */}
      <Flex align="center" justify="between" wrap="wrap" gap="3">
        <Flex direction="column" gap="1">
          <Text size="5" weight="bold">
            Inventario
          </Text>
          <Text size="2" color="gray">
            Control de existencias, historial de movimientos y alertas de reabastecimiento.
          </Text>
        </Flex>
        <Flex align="center" gap="2">
          <StaleIndicator isStale={isStale} />
          <Button
            size="2"
            onClick={() => {
              setSelectedProductId(null);
              setAdjustmentOpen(true);
            }}
          >
            <PlusIcon width={16} height={16} />
            Nuevo movimiento
          </Button>
        </Flex>
      </Flex>

      {/* Alerta de Error si existiera */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "rgba(229, 77, 46, 0.1)",
            border: "1px solid rgba(229, 77, 46, 0.25)",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onClick={clearError}
        >
          <Flex align="center" justify="between">
            <Text size="2" color="red" weight="medium">
              {error}
            </Text>
            <Text size="1" color="red" style={{ opacity: 0.7 }}>
              Haz clic para descartar
            </Text>
          </Flex>
        </div>
      )}

      {/* Tarjetas de KPI (Resumen Interactivo) */}
      <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="3">
        {/* Total Productos */}
        <Card
          style={{
            cursor: "pointer",
            border: statusFilter === "all" ? "1px solid var(--accent-8, #3b82f6)" : undefined,
            transition: "all 0.15s ease",
          }}
          onClick={() => setStatusFilter("all")}
        >
          <Flex direction="column" gap="1">
            <Flex align="center" justify="between">
              <Text size="1" color="gray" weight="medium">
                Total Productos
              </Text>
              <CubeIcon width={16} height={16} style={{ opacity: 0.5 }} />
            </Flex>
            <Text size="6" weight="bold">
              {totalItems}
            </Text>
            <Text size="1" color="gray">
              {totalUnits} unidades totales
            </Text>
          </Flex>
        </Card>

        {/* Stock Normal */}
        <Card
          style={{
            cursor: "pointer",
            border: statusFilter === "normal" ? "1px solid var(--green-8, #30a46c)" : undefined,
            transition: "all 0.15s ease",
          }}
          onClick={() => setStatusFilter("normal")}
        >
          <Flex direction="column" gap="1">
            <Flex align="center" justify="between">
              <Text size="1" color="gray" weight="medium">
                Stock Normal
              </Text>
              <Badge color="green" variant="soft" size="1">
                Óptimo
              </Badge>
            </Flex>
            <Text size="6" weight="bold" color="green">
              {normalStockCount}
            </Text>
            <Text size="1" color="gray">
              Productos con nivel adecuado
            </Text>
          </Flex>
        </Card>

        {/* Stock Bajo */}
        <Card
          style={{
            cursor: "pointer",
            border: statusFilter === "low_stock" ? "1px solid var(--orange-8, #f59e0b)" : undefined,
            backgroundColor: lowStockCount > 0 ? "rgba(245, 158, 11, 0.04)" : undefined,
            transition: "all 0.15s ease",
          }}
          onClick={() => setStatusFilter((prev) => (prev === "low_stock" ? "all" : "low_stock"))}
        >
          <Flex direction="column" gap="1">
            <Flex align="center" justify="between">
              <Text size="1" color="orange" weight="medium">
                Stock Bajo
              </Text>
              <ExclamationTriangleIcon width={16} height={16} color="var(--orange-9, #f59e0b)" />
            </Flex>
            <Text size="6" weight="bold" color="orange">
              {lowStockCount}
            </Text>
            <Text size="1" color="gray">
              Por reabastecer (≤ 5 un.)
            </Text>
          </Flex>
        </Card>

        {/* Sin Stock (Agotados) */}
        <Card
          style={{
            cursor: "pointer",
            border: statusFilter === "out_of_stock" ? "1px solid var(--red-8, #e54d2e)" : undefined,
            backgroundColor: outOfStockCount > 0 ? "rgba(229, 77, 46, 0.05)" : undefined,
            transition: "all 0.15s ease",
          }}
          onClick={() => setStatusFilter((prev) => (prev === "out_of_stock" ? "all" : "out_of_stock"))}
        >
          <Flex direction="column" gap="1">
            <Flex align="center" justify="between">
              <Text size="1" color="red" weight="medium">
                Sin Stock
              </Text>
              <Badge color="red" variant="soft" size="1">
                Agotados
              </Badge>
            </Flex>
            <Text size="6" weight="bold" color="red">
              {outOfStockCount}
            </Text>
            <Text size="1" color="gray">
              Sin unidades disponibles
            </Text>
          </Flex>
        </Card>
      </Grid>

      {/* Barra de Filtros y Búsqueda */}
      <Flex direction={{ initial: "column", sm: "row" }} align={{ sm: "center" }} justify="between" gap="3">
        {/* Buscador de Texto */}
        <div style={{ width: "100%", maxWidth: "340px", position: "relative" }}>
          <TextField.Root
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon width={16} height={16} />
            </TextField.Slot>
            {search && (
              <TextField.Slot>
                <Button size="1" variant="ghost" color="gray" onClick={() => setSearch("")} style={{ padding: 0 }}>
                  <Cross2Icon width={14} height={14} />
                </Button>
              </TextField.Slot>
            )}
          </TextField.Root>
        </div>

        {/* Chips de Estado */}
        <Flex gap="2" wrap="wrap" align="center">
          <Text size="1" color="gray" weight="medium" style={{ marginRight: "4px" }}>
            Filtrar:
          </Text>
          <Button
            size="1"
            variant={statusFilter === "all" ? "solid" : "soft"}
            color="gray"
            onClick={() => setStatusFilter("all")}
          >
            Todos ({totalItems})
          </Button>
          <Button
            size="1"
            variant={statusFilter === "out_of_stock" ? "solid" : "soft"}
            color="red"
            onClick={() => setStatusFilter("out_of_stock")}
          >
            Sin stock ({outOfStockCount})
          </Button>
          <Button
            size="1"
            variant={statusFilter === "low_stock" ? "solid" : "soft"}
            color="orange"
            onClick={() => setStatusFilter("low_stock")}
          >
            Stock bajo ({lowStockCount})
          </Button>
          <Button
            size="1"
            variant={statusFilter === "normal" ? "solid" : "soft"}
            color="green"
            onClick={() => setStatusFilter("normal")}
          >
            Normal ({normalStockCount})
          </Button>
        </Flex>
      </Flex>

      {/* Contenedor Tabla de Inventario */}
      <div
        style={{
          backgroundColor: "#161616",
          borderRadius: "8px",
          border: "1px solid #2a2a2a",
          overflow: "hidden",
        }}
      >
        <Table.Root>
          <Table.Header>
            <Table.Row style={{ backgroundColor: "#1e1e1e" }}>
              <Table.ColumnHeaderCell style={{ paddingLeft: "16px" }}>Código</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Producto</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: "right" }}>Stock</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Estado</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: "right", paddingRight: "16px" }}>Acciones</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {loading && stock.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5}>
                  <Flex align="center" justify="center" gap="2" style={{ padding: "40px" }}>
                    <Text size="2" color="gray">
                      Cargando inventario...
                    </Text>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ) : filtered.length === 0 ? (
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
                      <Button size="2" variant="soft" color="gray" onClick={handleClearFilters} style={{ marginTop: "4px" }}>
                        Limpiar filtros
                      </Button>
                    )}
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ) : (
              filtered.map((item) => {
                const isOutOfStock = item.stockQuantity <= 0;
                const isLowStock = item.stockQuantity > 0 && item.stockQuantity <= 5;

                return (
                  <Table.Row
                    key={item.productId}
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
                      <Text
                        size="3"
                        weight="bold"
                        color={isOutOfStock ? "red" : isLowStock ? "orange" : undefined}
                      >
                        {item.stockQuantity}
                      </Text>
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
                    <Table.Cell style={{ textAlign: "right", paddingRight: "16px", verticalAlign: "middle" }}>
                      <Flex gap="2" justify="end" align="center">
                        <Tooltip content="Ver historial de movimientos">
                          <Button
                            size="1"
                            variant="soft"
                            color="gray"
                            onClick={() => {
                              setSelectedProductId(item.productId);
                              setMovementsOpen(true);
                            }}
                          >
                            <CounterClockwiseClockIcon width={12} height={12} />
                            Historial
                          </Button>
                        </Tooltip>
                        <Tooltip content="Registrar entrada, salida o ajuste">
                          <Button
                            size="1"
                            variant="surface"
                            onClick={() => {
                              setSelectedProductId(item.productId);
                              setAdjustmentOpen(true);
                            }}
                          >
                            <PlusIcon width={12} height={12} />
                            Ajustar
                          </Button>
                        </Tooltip>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>
      </div>

      {/* Footer Info */}
      <Flex align="center" justify="between">
        <Text size="1" color="gray">
          Mostrando {filtered.length} de {totalItems} productos
        </Text>
        {(search || statusFilter !== "all") && (
          <Button size="1" variant="ghost" color="gray" onClick={handleClearFilters}>
            Restablecer vista
          </Button>
        )}
      </Flex>
    </Flex>

    {/* Dialogs */}
    {adjustmentOpen && (
      <StockAdjustmentDialog
        preselectedProductId={selectedProductId}
        onClose={() => {
          setAdjustmentOpen(false);
          setSelectedProductId(null);
        }}
      />
    )}
    {movementsOpen && (
      <StockMovementsDialog
        preselectedProductId={selectedProductId}
        onClose={() => {
          setMovementsOpen(false);
          setSelectedProductId(null);
        }}
      />
    )}
  </div>
);
}

