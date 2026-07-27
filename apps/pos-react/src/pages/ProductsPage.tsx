import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Text,
  Button,
  Table,
  Badge,
  IconButton,
  TextField,
  Flex,
  Select,
  Tooltip,
  Dialog,
} from "@radix-ui/themes";
import {
  PlusIcon,
  Pencil2Icon,
  TrashIcon,
  MagnifyingGlassIcon,
  Cross2Icon,
  ArchiveIcon,
  ExclamationTriangleIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import {
  useProductsStore,
  selectFilteredProducts,
  selectCategories,
} from "@/stores/products.store";
import { ProductsRepository } from "@/repositories/products.repository";
import { StockBadge } from "@/components/product/StockBadge";
import { ProductFormDialog } from "@/components/product/ProductFormDialog";
import { StockAdjustmentDialog } from "@/components/product/StockAdjustmentDialog";
import { StaleIndicator } from "@/components/ui/StaleIndicator";
import type { Product, ProductSortField, ProductSortDirection } from "@/lib/types";

export function ProductsPage() {
  const {
    products,
    loading,
    search,
    category,
    sortField,
    sortDirection,
    isStale,
    fetchProducts,
    setSearch,
    setCategory,
    setSort,
  } = useProductsStore();

  const filteredProducts = useProductsStore(selectFilteredProducts);
  const categories = useProductsStore(selectCategories);

  // Filters & State
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Global Keyboard Shortcuts ( / to focus search, N for new product)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable);

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if ((e.key === "n" || e.key === "N") && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setEditingProduct(null);
        setFormOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute stats
  const totalProducts = products.length;

  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      const qty = p.variants?.[0]?.stockItems?.[0]?.quantity ?? 0;
      const min = p.variants?.[0]?.stockItems?.[0]?.minQuantity ?? 5;
      return qty > 0 && qty <= min;
    }).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => {
      const qty = p.variants?.[0]?.stockItems?.[0]?.quantity ?? 0;
      return qty <= 0;
    }).length;
  }, [products]);

  // Filter low stock if toggle active
  const displayedProducts = useMemo(() => {
    let list = filteredProducts;
    if (lowStockOnly) {
      list = list.filter((p) => {
        const qty = p.variants?.[0]?.stockItems?.[0]?.quantity ?? 0;
        const min = p.variants?.[0]?.stockItems?.[0]?.minQuantity ?? 5;
        return qty <= min;
      });
    }
    return list;
  }, [filteredProducts, lowStockOnly]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleOpenAdjust = (product: Product) => {
    setAdjustProduct(product);
    setAdjustOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await ProductsRepository.remove(deletingProduct.id);
      await fetchProducts();
      setDeletingProduct(null);
    } catch (e) {
      console.error("[ProductsPage] Error deleting product:", e);
    } finally {
      setDeleting(false);
    }
  }, [deletingProduct, fetchProducts]);

  return (
    <div style={{ paddingBottom: "32px" }}>
      {/* Header */}
      <Flex align="center" justify="between" style={{ marginBottom: "20px" }}>
        <div>
          <Flex align="center" gap="3">
            <Text size="6" weight="bold">
              Inventario y Productos
            </Text>
            <Badge color="gray" variant="soft" size="2">
              {totalProducts} productos
            </Badge>
            {lowStockCount > 0 && (
              <Badge color="amber" variant="soft" size="2">
                {lowStockCount} stock bajo
              </Badge>
            )}
            {outOfStockCount > 0 && (
              <Badge color="red" variant="soft" size="2">
                {outOfStockCount} agotados
              </Badge>
            )}
            <StaleIndicator isStale={isStale} />
          </Flex>
          <Text size="2" color="gray" style={{ marginTop: "4px" }}>
            Administrá el catálogo de productos, precios y movimientos de stock en tiempo real.
          </Text>
        </div>

        <Button size="3" onClick={handleOpenCreate} aria-label="Crear nuevo producto (Presioná N)">
          <PlusIcon width={18} height={18} />
          Nuevo producto
          <KbdShortcut label="N" />
        </Button>
      </Flex>

      {/* Toolbar / Filters */}
      <Flex
        align="center"
        justify="between"
        gap="3"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "16px",
        }}
      >
        <Flex align="center" gap="3" style={{ flex: 1 }}>
          <TextField.Root
            ref={searchInputRef}
            placeholder="Buscar por nombre, código barcode, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "320px" }}
            aria-label="Buscar productos"
          >
            <TextField.Slot>
              <MagnifyingGlassIcon width={16} height={16} color="gray" />
            </TextField.Slot>
            {search && (
              <TextField.Slot>
                <IconButton
                  size="1"
                  variant="ghost"
                  color="gray"
                  onClick={() => setSearch("")}
                  aria-label="Limpiar búsqueda"
                >
                  <Cross2Icon width={14} height={14} />
                </IconButton>
              </TextField.Slot>
            )}
          </TextField.Root>

          {/* Category Filter */}
          {categories.length > 0 && (
            <Select.Root
              value={category ?? "all"}
              onValueChange={(val) => setCategory(val === "all" ? null : val)}
            >
              <Select.Trigger style={{ minWidth: "160px" }} aria-label="Filtrar por categoría" />
              <Select.Content style={{ height: "auto" }}>
                <Select.Item value="all">Todas las categorías</Select.Item>
                {categories.map((cat) => (
                  <Select.Item key={cat} value={cat}>
                    {cat}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          )}

          {/* Low Stock Toggle */}
          <Button
            size="2"
            variant={lowStockOnly ? "solid" : "soft"}
            color={lowStockOnly ? "amber" : "gray"}
            onClick={() => setLowStockOnly((prev) => !prev)}
            aria-label="Filtrar solo productos con stock bajo o agotado"
          >
            <ExclamationTriangleIcon width={16} height={16} />
            Stock Bajo / Crítico
          </Button>
        </Flex>

        {/* Sort */}
        <Flex align="center" gap="2">
          <Text size="2" color="gray">
            Ordenar:
          </Text>
          <Select.Root
            value={`${sortField}-${sortDirection}`}
            onValueChange={(val) => {
              const [field, dir] = val.split("-") as [
                ProductSortField,
                ProductSortDirection,
              ];
              setSort(field, dir);
            }}
          >
            <Select.Trigger style={{ minWidth: "160px" }} aria-label="Ordenar productos" />
            <Select.Content style={{ height: "auto" }}>
              <Select.Item value="name-asc">Nombre (A-Z)</Select.Item>
              <Select.Item value="name-desc">Nombre (Z-A)</Select.Item>
              <Select.Item value="price-asc">Precio: menor a mayor</Select.Item>
              <Select.Item value="price-desc">Precio: mayor a menor</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>
      </Flex>

      {/* Table Container */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <Table.Root>
          <Table.Header>
            <Table.Row style={{ backgroundColor: "var(--bg-surface-hover)" }}>
              <Table.ColumnHeaderCell>Código / SKU</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Producto / Categoría</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: "right" }}>
                Precio Venta
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: "right" }}>
                Costo / Margen
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: "center" }}>
                Stock Actual
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: "right" }}>
                Acciones
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {loading ? (
              <SkeletonRows />
            ) : displayedProducts.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    gap="3"
                    style={{ padding: "48px 16px", textAlign: "center" }}
                  >
                    <ArchiveIcon width={36} height={36} color="var(--text-muted)" />
                    <Text size="3" weight="bold" color="gray">
                      No se encontraron productos
                    </Text>
                    <Text size="2" color="gray" style={{ maxWidth: 400 }}>
                      {search || category || lowStockOnly
                        ? "Probá cambiando los filtros o el término de búsqueda."
                        : "Comenzá creando tu primer producto con el botón 'Nuevo producto'."}
                    </Text>
                    {!search && !category && !lowStockOnly && (
                      <Button size="2" onClick={handleOpenCreate}>
                        <PlusIcon width={16} height={16} />
                        Crear primer producto
                      </Button>
                    )}
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ) : (
              displayedProducts.map((product) => {
                const stockQty =
                  product.variants?.[0]?.stockItems?.[0]?.quantity ?? 0;
                const minStock =
                  product.variants?.[0]?.stockItems?.[0]?.minQuantity ?? 5;
                const skuCode = product.variants?.[0]?.sku;
                const costVal = product.cost;

                const marginPercent =
                  costVal && costVal > 0 && product.price > costVal
                    ? Math.round(((product.price - costVal) / product.price) * 100)
                    : null;

                return (
                  <Table.Row
                    key={product.id}
                    className="product-row"
                    style={{ transition: "background-color 0.15s ease" }}
                  >
                    <Table.Cell>
                      <Text size="2" weight="bold" style={{ display: "block" }}>
                        {product.internalCode}
                      </Text>
                      {skuCode && (
                        <Text size="1" color="gray" style={{ display: "block" }}>
                          SKU: {skuCode}
                        </Text>
                      )}
                    </Table.Cell>

                    <Table.Cell>
                      <Text size="2" weight="bold" style={{ display: "block" }}>
                        {product.name}
                      </Text>
                      <Flex align="center" gap="2" style={{ marginTop: "2px" }}>
                        {product.category && (
                          <Badge color="blue" variant="soft" size="1">
                            {product.category}
                          </Badge>
                        )}
                        {product.description && (
                          <Text size="1" color="gray" style={{ maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {product.description}
                          </Text>
                        )}
                      </Flex>
                    </Table.Cell>

                    <Table.Cell style={{ textAlign: "right" }}>
                      <Text size="3" weight="bold">
                        ${product.price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </Text>
                    </Table.Cell>

                    <Table.Cell style={{ textAlign: "right" }}>
                      {costVal != null && costVal > 0 ? (
                        <div>
                          <Text size="2" color="gray" style={{ display: "block" }}>
                            ${costVal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </Text>
                          {marginPercent !== null && (
                            <Text size="1" color="green">
                              +{marginPercent}% margen
                            </Text>
                          )}
                        </div>
                      ) : (
                        <Text size="2" color="gray">
                          —
                        </Text>
                      )}
                    </Table.Cell>

                    <Table.Cell style={{ textAlign: "center" }}>
                      <StockBadge quantity={stockQty} minStock={minStock} />
                    </Table.Cell>

                    <Table.Cell style={{ textAlign: "right" }}>
                      <Flex justify="end" gap="2">
                        <Tooltip content="Ajustar stock (ingreso/egreso)">
                          <IconButton
                            size="2"
                            variant="ghost"
                            color="blue"
                            onClick={() => handleOpenAdjust(product)}
                            aria-label={`Ajustar stock de ${product.name}`}
                          >
                            <UpdateIcon width={16} height={16} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip content="Editar producto">
                          <IconButton
                            size="2"
                            variant="ghost"
                            color="gray"
                            onClick={() => handleOpenEdit(product)}
                            aria-label={`Editar ${product.name}`}
                          >
                            <Pencil2Icon width={16} height={16} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip content="Eliminar producto">
                          <IconButton
                            size="2"
                            variant="ghost"
                            color="red"
                            onClick={() => setDeletingProduct(product)}
                            aria-label={`Eliminar ${product.name}`}
                          >
                            <TrashIcon width={16} height={16} />
                          </IconButton>
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

      {/* Modals */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        productToEdit={editingProduct}
        onSuccess={fetchProducts}
      />

      <StockAdjustmentDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        product={adjustProduct}
        onSuccess={fetchProducts}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      >
        <Dialog.Content style={{ maxWidth: 400, padding: "24px" }}>
          <Dialog.Title style={{ marginBottom: "8px" }}>
            ¿Eliminar producto?
          </Dialog.Title>
          <Dialog.Description size="2" color="gray" style={{ marginBottom: "20px" }}>
            ¿Estás seguro de que querés eliminar{" "}
            <strong>"{deletingProduct?.name}"</strong>? Esta acción ocultará el producto del catálogo de ventas.
          </Dialog.Description>

          <Flex justify="end" gap="3">
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray">
                Cancelar
              </Button>
            </Dialog.Close>
            <Button
              color="red"
              disabled={deleting}
              onClick={handleDeleteConfirm}
            >
              {deleting ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}

function KbdShortcut({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 6px",
        fontSize: "11px",
        fontWeight: "bold",
        backgroundColor: "var(--accent-subtle)",
        color: "var(--accent)",
        borderRadius: "4px",
        marginLeft: "6px",
        border: "1px solid var(--accent)",
      }}
    >
      {label}
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <Table.Row key={i}>
          <Table.Cell>
            <div style={{ height: "16px", width: "80px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "4px" }} />
          </Table.Cell>
          <Table.Cell>
            <div style={{ height: "16px", width: "160px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "4px" }} />
          </Table.Cell>
          <Table.Cell style={{ textAlign: "right" }}>
            <div style={{ height: "16px", width: "70px", marginLeft: "auto", backgroundColor: "var(--bg-surface-hover)", borderRadius: "4px" }} />
          </Table.Cell>
          <Table.Cell style={{ textAlign: "right" }}>
            <div style={{ height: "16px", width: "60px", marginLeft: "auto", backgroundColor: "var(--bg-surface-hover)", borderRadius: "4px" }} />
          </Table.Cell>
          <Table.Cell style={{ textAlign: "center" }}>
            <div style={{ height: "20px", width: "90px", margin: "0 auto", backgroundColor: "var(--bg-surface-hover)", borderRadius: "10px" }} />
          </Table.Cell>
          <Table.Cell style={{ textAlign: "right" }}>
            <div style={{ height: "24px", width: "80px", marginLeft: "auto", backgroundColor: "var(--bg-surface-hover)", borderRadius: "4px" }} />
          </Table.Cell>
        </Table.Row>
      ))}
    </>
  );
}
