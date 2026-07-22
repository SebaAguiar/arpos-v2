import { useCallback, useEffect, useMemo } from "react";
import { Text, TextField, Badge, Tooltip } from "@radix-ui/themes";
import {
  CameraIcon,
  PersonIcon,
  BackpackIcon,
  LightningBoltIcon,
  GearIcon,
  BarChartIcon,
  TimerIcon,
  CubeIcon,
} from "@radix-ui/react-icons";
import { useCartStore } from "@/stores/cart.store";
import { useProductsStore } from "@/stores/products.store";
import { useDialogStore } from "@/stores/dialog.store";
import { useLayoutStore } from "@/stores/layout.store";
import { ProductCard } from "@/components/product/ProductCard";
import { CartItem } from "@/components/cart/CartItem";
import { SummaryPanel } from "@/components/cart/SummaryPanel";
import { PaymentDialog } from "@/components/sales/PaymentDialog";
import { CustomerSelectionDialog } from "@/components/sales/CustomerSelectionDialog";
import { SalesHistoryDialog } from "@/components/sales/SalesHistoryDialog";
import { CashControlDialog } from "@/components/sales/CashControlDialog";
import { DashboardDialog } from "@/components/dashboard/DashboardDialog";
import { TasksDialog } from "@/components/tasks/TasksDialog";
import { ProductManagementDialog } from "@/components/products/ProductManagementDialog";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import type { Product } from "@/lib/types";

export function POSPage() {
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen);
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const customerName = useCartStore((s) => s.customerName);

  const search = useProductsStore((s) => s.search);
  const setSearch = useProductsStore((s) => s.setSearch);
  const allProducts = useProductsStore((s) => s.products);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const category = useProductsStore((s) => s.category);
  const sortField = useProductsStore((s) => s.sortField);
  const sortDirection = useProductsStore((s) => s.sortDirection);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    let result = allProducts.filter((p) => p.active);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.internalCode?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    if (category) {
      result = result.filter((p) => p.category === category);
    }
    result.sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * dir;
      if (sortField === "price") return (a.price - b.price) * dir;
      return 0;
    });
    return result;
  }, [allProducts, search, category, sortField, sortDirection]);

  const openPayment = useDialogStore((s) => s.openPayment);
  const openCustomerSelection = useDialogStore((s) => s.openCustomerSelection);
  const openCashControl = useDialogStore((s) => s.openCashControl);
  const openSettings = useDialogStore((s) => s.openSettings);
  const openDashboard = useDialogStore((s) => s.openDashboard);
  const openReports = useDialogStore((s) => s.openReports);
  const openTasks = useDialogStore((s) => s.openTasks);
  const openProductManagement = useDialogStore((s) => s.openProductManagement);
  const payment = useDialogStore((s) => s.payment);
  const customerSelection = useDialogStore((s) => s.customerSelection);
  const salesHistory = useDialogStore((s) => s.salesHistory);
  const cashControl = useDialogStore((s) => s.cashControl);
  const dashboard = useDialogStore((s) => s.dashboard);
  const tasks = useDialogStore((s) => s.tasks);
  const productManagement = useDialogStore((s) => s.productManagement);
  const settings = useDialogStore((s) => s.settings);

  const displayProducts = filteredProducts;

  const handleAddToCart = useCallback(
    (product: Product) => {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    },
    [addItem]
  );

  return (
    <div style={{ display: "flex", gap: "0", height: "100%" }}>
      {/* Left sidebar - quick actions (when main sidebar is closed) */}
      {!sidebarOpen && (
          <div
            style={{
              width: "48px",
              backgroundColor: "var(--bg-surface)",
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "8px 0",
              gap: "4px",
            }}
          >
            {[
              { icon: BackpackIcon, label: "POS", action: undefined },
              { icon: LightningBoltIcon, label: "Caja", action: openCashControl },
              { icon: TimerIcon, label: "Tareas", action: openTasks },
              { icon: CubeIcon, label: "Productos", action: openProductManagement },
              { icon: BarChartIcon, label: "Dashboard", action: openDashboard },
              { icon: BarChartIcon, label: "Reportes", action: openReports },
              { icon: GearIcon, label: "Configuración", action: openSettings },
            ].map(({ icon: Icon, label, action }) =>
              action ? (
                <Tooltip key={label} content={label}>
                  <button
                    onClick={action}
                    style={{
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "none",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    <Icon width={18} height={18} />
                  </button>
                </Tooltip>
              ) : (
                <Tooltip key={label} content={label}>
                  <span
                    style={{
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "6px",
                      backgroundColor: "var(--bg-surface-hover)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <Icon width={18} height={18} />
                  </span>
                </Tooltip>
              )
            )}
          </div>
      )}

      {/* Products area */}
      <div style={{ flex: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Search bar */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <TextField.Root
            placeholder="Escanear código o buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          >
            <TextField.Slot>
              <CameraIcon height={16} width={16} />
            </TextField.Slot>
          </TextField.Root>
          <Badge color="gray" variant="soft" size="1">
            {displayProducts.length} productos
          </Badge>
        </div>

        {/* Product grid */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "12px 16px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "8px",
            }}
          >
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Cart + Summary */}
      <div
        style={{
          width: "340px",
          backgroundColor: "var(--bg-surface)",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Cart header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Text size="3" weight="bold">
              Carrito
            </Text>
            {items.length > 0 && (
              <Badge color="orange" variant="soft" size="1">
                {items.length}
              </Badge>
            )}
          </div>
          <button
            onClick={openCustomerSelection}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              backgroundColor: customerName ? "var(--bg-surface-hover)" : "transparent",
              color: customerName ? "var(--text-primary)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            <PersonIcon width={12} height={12} />
            {customerName || "Cliente"}
          </button>
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {items.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text size="2" color="gray">
                Carrito vacío — escanee o seleccione un producto
              </Text>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <SummaryPanel onCharge={openPayment} onCustomerClick={openCustomerSelection} />
        )}
      </div>

      {/* Dialogs */}
      {payment && <PaymentDialog />}
      {customerSelection && <CustomerSelectionDialog />}
      {salesHistory && <SalesHistoryDialog />}
      {cashControl && <CashControlDialog />}
      {dashboard && <DashboardDialog />}
      {tasks && <TasksDialog />}
      {productManagement && <ProductManagementDialog />}
      {settings && <SettingsDialog />}
    </div>
  );
}
