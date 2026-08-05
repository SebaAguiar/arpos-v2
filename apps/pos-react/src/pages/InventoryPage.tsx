import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Text, Badge, Button, Flex, Card, Grid } from "@radix-ui/themes";
import {
  PlusIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  ListBulletIcon,
  GridIcon,
} from "@radix-ui/react-icons";
import { useInventoryStore } from "@/stores/inventory.store";
import { StockAdjustmentDialog } from "@/components/inventory/StockAdjustmentDialog";
import { StockMovementsDialog } from "@/components/inventory/StockMovementsDialog";
import { InventoryCard } from "@/components/inventory/InventoryCard";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ProductSearchAutocomplete } from "@/components/inventory/ProductSearchAutocomplete";
import { StaleIndicator } from "@/components/ui/StaleIndicator";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useHotkeys } from "@/hooks/useHotkeys";
import type { StockItemData } from "@/repositories/inventory.repository";

type StatusFilter = "all" | "out_of_stock" | "low_stock" | "normal";

export function InventoryPage() {
  const stock = useInventoryStore((s) => s.stock);
  const loading = useInventoryStore((s) => s.loading);
  const error = useInventoryStore((s) => s.error);
  const isStale = useInventoryStore((s) => s.isStale);
  const fetchStock = useInventoryStore((s) => s.fetchStock);
  const createMovement = useInventoryStore((s) => s.createMovement);
  const clearError = useInventoryStore((s) => s.clearError);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [movementsOpen, setMovementsOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const effectiveViewMode = isMobile ? "grid" : viewMode;

  const searchInputRef = useRef<HTMLInputElement>(null);

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const hasOpenDialog = adjustmentOpen || movementsOpen;

  useHotkeys(
    [
      { keys: "Ctrl+K", handler: focusSearch, allowInInput: true },
      { keys: "/", handler: focusSearch, allowInInput: true },
      {
        keys: "n",
        handler: () => {
          setSelectedProductId(null);
          setAdjustmentOpen(true);
        },
      },
      { keys: "g", handler: () => setViewMode("grid") },
      { keys: "t", handler: () => setViewMode("table") },
      { keys: "1", handler: () => setStatusFilter("all") },
      { keys: "2", handler: () => setStatusFilter("out_of_stock") },
      { keys: "3", handler: () => setStatusFilter("low_stock") },
    ],
    !hasOpenDialog
  );

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
    () => stock.filter((item) => item.stockQuantity > 0 && item.stockQuantity <= (item.minStock ?? 5)).length,
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

      const minStock = item.minStock ?? 5;

      if (statusFilter === "out_of_stock") return item.stockQuantity <= 0;
      if (statusFilter === "low_stock") return item.stockQuantity > 0 && item.stockQuantity <= minStock;
      if (statusFilter === "normal") return item.stockQuantity > minStock;

      return true;
    });
  }, [stock, search, statusFilter]);

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const handleAutocompleteSelect = (item: StockItemData) => {
    setSearch(item.productName);
  };

  const handleInlineStockSave = (
    productId: string,
    type: "entry" | "exit",
    quantity: number
  ) => {
    createMovement({
      productId,
      type,
      quantity,
      reason: "Ajuste rápido in-line",
    }).catch(() => {
      // El error se maneja en el store
    });
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

        {/* Barra de Filtros y Búsqueda — Sticky */}
        <div
          style={{
            position: "sticky",
            top: "0",
            zIndex: 20,
            backgroundColor: "var(--bg-page)",
            padding: "8px 0",
          }}
        >
          <Flex direction={{ initial: "column", sm: "row" }} align={{ sm: "center" }} justify="between" gap="3">
            {/* Buscador Autocomplete Predictivo */}
            <ProductSearchAutocomplete
              items={stock}
              value={search}
              onChange={setSearch}
              onSelect={handleAutocompleteSelect}
              inputRef={searchInputRef}
            />

            {/* Chips de Estado + Toggle de Vista */}
            <Flex gap="3" wrap="wrap" align="center">
              <Flex gap="2" wrap="wrap" align="center">
                <Text size="1" color="gray" weight="medium" style={{ marginRight: "4px" }}>
                  Filtrar:
                </Text>
                <Button
                  size="1"
                  variant={statusFilter === "all" ? "solid" : "soft"}
                  color="gray"
                  onClick={() => setStatusFilter("all")}
                  style={statusFilter === "all" ? { backgroundColor: "var(--accent-subtle)", color: "var(--accent)" } : undefined}
                >
                  Todos ({totalItems})
                </Button>
                <Button
                  size="1"
                  variant={statusFilter === "out_of_stock" ? "solid" : "soft"}
                  color="red"
                  onClick={() => setStatusFilter("out_of_stock")}
                  style={statusFilter === "out_of_stock" ? { backgroundColor: "var(--color-danger-subtle)", color: "var(--color-danger)" } : undefined}
                >
                  Sin stock ({outOfStockCount})
                </Button>
                <Button
                  size="1"
                  variant={statusFilter === "low_stock" ? "solid" : "soft"}
                  color="orange"
                  onClick={() => setStatusFilter("low_stock")}
                  style={statusFilter === "low_stock" ? { backgroundColor: "var(--color-warning-subtle)", color: "var(--color-warning)" } : undefined}
                >
                  Stock bajo ({lowStockCount})
                </Button>
                <Button
                  size="1"
                  variant={statusFilter === "normal" ? "solid" : "soft"}
                  color="green"
                  onClick={() => setStatusFilter("normal")}
                  style={statusFilter === "normal" ? { backgroundColor: "var(--color-success-subtle)", color: "var(--color-success)" } : undefined}
                >
                  Normal ({normalStockCount})
                </Button>
              </Flex>

              {!isMobile && (
                <Flex gap="1" align="center" style={{ borderLeft: "1px solid var(--border)", paddingLeft: "12px" }}>
                  <Text size="1" color="gray">Vista:</Text>
                  <Button
                    size="1"
                    variant={effectiveViewMode === "table" ? "solid" : "soft"}
                    color="gray"
                    onClick={() => setViewMode("table")}
                    aria-label="Vista de tabla"
                  >
                    <ListBulletIcon width={14} height={14} />
                  </Button>
                  <Button
                    size="1"
                    variant={effectiveViewMode === "grid" ? "solid" : "soft"}
                    color="gray"
                    onClick={() => setViewMode("grid")}
                    aria-label="Vista de cuadrícula"
                  >
                    <GridIcon width={14} height={14} />
                  </Button>
                </Flex>
              )}
            </Flex>
          </Flex>
        </div>

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
                Por reabastecer (≤ mín.)
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

        {/* Contenedor Vista Principal (Tabla o Grilla) */}
        <div
          style={{
            backgroundColor: "#161616",
            borderRadius: "8px",
            border: "1px solid #2a2a2a",
            overflow: "hidden",
          }}
        >
          {effectiveViewMode === "table" ? (
            <InventoryTable
              items={filtered}
              loading={loading}
              totalItems={totalItems}
              search={search}
              statusFilter={statusFilter}
              onClearFilters={handleClearFilters}
              onViewHistory={(id) => {
                setSelectedProductId(id);
                setMovementsOpen(true);
              }}
              onAdjustStock={(id) => {
                setSelectedProductId(id);
                setAdjustmentOpen(true);
              }}
              onInlineSave={handleInlineStockSave}
            />
          ) : (
            <div
              style={{
                padding: "12px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "10px",
              }}
            >
              {filtered.map((item) => (
                <InventoryCard
                  key={item.productId}
                  item={item}
                  onViewHistory={(id) => {
                    setSelectedProductId(id);
                    setMovementsOpen(true);
                  }}
                  onAdjustStock={(id) => {
                    setSelectedProductId(id);
                    setAdjustmentOpen(true);
                  }}
                />
              ))}
            </div>
          )}
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
