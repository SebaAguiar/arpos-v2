import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  PlusIcon,
} from "@radix-ui/react-icons";
import { useShallow } from "zustand/react/shallow";
import { useCartStore } from "@/stores/cart.store";
import { useProductsStore, selectCategories } from "@/stores/products.store";
import { useDialogStore } from "@/stores/dialog.store";
import { useLayoutStore } from "@/stores/layout.store";
import { useCashRegisterStore } from "@/stores/cash-register.store";
import { StaleIndicator } from "@/components/ui/StaleIndicator";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryTabs } from "@/components/product/CategoryTabs";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useHotkeys } from "@/hooks/useHotkeys";
import { getProductStock } from "@/lib/stock";
import { VariantSelectionDialog } from "@/components/product/VariantSelectionDialog";
import { CartItem } from "@/components/cart/CartItem";
import { CustomItemDialog } from "@/components/cart/CustomItemDialog";
import { SummaryPanel } from "@/components/cart/SummaryPanel";
import { PaymentDialog } from "@/components/sales/PaymentDialog";
import { CustomerSelectionDialog } from "@/components/sales/CustomerSelectionDialog";
import { SalesHistoryDialog } from "@/components/sales/SalesHistoryDialog";
import { SaleSuccessDialog } from "@/components/sales/SaleSuccessDialog";
import {
  printReceipt,
  downloadReceiptPdf,
  shareViaWhatsApp,
  type PaperSize,
} from "@/services/receipt.service";
import { useCompanyStore } from "@/stores/company.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useArcaStore } from "@/stores/arca.store";
import type { Product, ProductVariant, Sale, StoreConfig } from "@/lib/types";

export function POSPage() {
  const navigate = useNavigate();
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen);
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const updateCustomItem = useCartStore((s) => s.updateCustomItem);
  const addCustomItem = useCartStore((s) => s.addCustomItem);
  const customerName = useCartStore((s) => s.customerName);

  const search = useProductsStore((s) => s.search);
  const setSearch = useProductsStore((s) => s.setSearch);
  const allProducts = useProductsStore((s) => s.products);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const fetchCurrentShift = useCashRegisterStore((s) => s.fetchCurrentShift);
  const isProductsStale = useProductsStore((s) => s.isStale);
  const category = useProductsStore((s) => s.category);
  const setCategory = useProductsStore((s) => s.setCategory);
  const categories = useProductsStore(useShallow(selectCategories));
  const sortField = useProductsStore((s) => s.sortField);
  const sortDirection = useProductsStore((s) => s.sortDirection);

  const company = useCompanyStore((s) => s.company);
  const fetchCompany = useCompanyStore((s) => s.fetchCompany);
  const settingsAutoPrint = useSettingsStore((s) => s.autoPrint);
  const paperSize = useSettingsStore((s) => s.paperSize);
  const receiptHeader = useSettingsStore((s) => s.receiptHeader);
  const receiptFooter = useSettingsStore((s) => s.receiptFooter);

  useEffect(() => {
    fetchProducts();
    fetchCurrentShift();
    fetchCompany();
  }, [fetchProducts, fetchCurrentShift, fetchCompany]);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  // Sale success dialog state
  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    sale: Sale | null;
    change: number;
    email: string;
  }>({ open: false, sale: null, change: 0, email: "" });

  const storeConfig: StoreConfig | null = useMemo(() => {
    if (!company) return null;
    return {
      name: company.name,
      address: company.address,
      phone: company.phone,
      email: company.email,
      taxRate: 0,
      creditSurcharge: 0,
      receiptHeader,
      receiptFooter,
    };
  }, [company, receiptHeader, receiptFooter]);

  const handleSaleComplete = useCallback(
    (sale: Sale, change: number, email: string) => {
      setSuccessDialog({ open: true, sale, change, email });
      if (settingsAutoPrint && storeConfig) {
        setTimeout(() => printReceipt(sale, storeConfig, paperSize as PaperSize), 300);
      }
    },
    [settingsAutoPrint, storeConfig, paperSize]
  );

  const handleSuccessClose = useCallback(
    (action: "close" | "print" | "download" | "whatsapp" | "invoice") => {
      const { sale } = successDialog;
      if (sale) {
        switch (action) {
          case "print":
            printReceipt(sale, storeConfig, paperSize as PaperSize);
            break;
          case "download":
            downloadReceiptPdf(sale, storeConfig, paperSize as PaperSize);
            break;
          case "whatsapp":
            shareViaWhatsApp(sale, storeConfig);
            break;
          case "invoice": {
            const { createInvoice } = useArcaStore.getState();
            createInvoice(sale.id).catch(() => {});
            break;
          }
        }
      }
      setSuccessDialog({ open: false, sale: null, change: 0, email: "" });
    },
    [successDialog, storeConfig, paperSize]
  );

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
  const payment = useDialogStore((s) => s.payment);
  const customerSelection = useDialogStore((s) => s.customerSelection);
  const salesHistory = useDialogStore((s) => s.salesHistory);

  const displayProducts = filteredProducts;

  const [variantDialog, setVariantDialog] = useState<Product | null>(null);
  const [customItemDialog, setCustomItemDialog] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const handleAddToCart = useCallback(
    (product: Product) => {
      const totalStock = getProductStock(product);
      if (totalStock === 0) return;

      if (product.variants.length > 1) {
        setVariantDialog(product);
        return;
      }
      const variant = product.variants[0];
      addItem({
        productId: product.id,
        variantId: variant?.id,
        name: product.name,
        variantLabel: variant?.size || variant?.color
          ? [variant?.size, variant?.color].filter(Boolean).join(" / ")
          : undefined,
        price: variant?.price ?? product.price,
        quantity: 1,
        sku: variant?.sku,
      });
    },
    [addItem]
  );

  const handleVariantSelect = useCallback(
    (product: Product, variant: ProductVariant) => {
      addItem({
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        variantLabel: [variant.size, variant.color].filter(Boolean).join(" / ") || undefined,
        price: variant.price ?? product.price,
        quantity: 1,
        sku: variant.sku,
      });
      setVariantDialog(null);
    },
    [addItem]
  );

  const handleSearchEnter = useCallback(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return;
    const matches = allProducts.filter((p) => {
      if (!p.active) return false;
      return (
        p.name.toLowerCase().includes(q) ||
        p.internalCode?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.variants.some(
          (v) =>
            v.barcode?.toLowerCase().includes(q) ||
            v.sku?.toLowerCase().includes(q)
        )
      );
    });
    if (matches.length === 1) {
      handleAddToCart(matches[0]);
      setSearchInput("");
      setSearch("");
    }
  }, [searchInput, allProducts, handleAddToCart, setSearch]);

  const hasOpenDialog =
    !!payment ||
    !!customerSelection ||
    !!salesHistory ||
    variantDialog !== null ||
    customItemDialog;

  useHotkeys(
    [
      { keys: "F2", handler: () => searchRef.current?.focus(), allowInInput: true },
      { keys: "Alt+N", handler: () => setCustomItemDialog(true), allowInInput: true },
    ],
    !hasOpenDialog
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
              { icon: LightningBoltIcon, label: "Caja", action: () => navigate("/cash-register") },
              { icon: TimerIcon, label: "Tareas", action: () => navigate("/tasks") },
              { icon: CubeIcon, label: "Productos", action: () => navigate("/products") },
              { icon: BarChartIcon, label: "Reportes", action: () => navigate("/reports") },
              { icon: GearIcon, label: "Configuración", action: () => navigate("/settings") },
            ].map(({ icon: Icon, label, action }) =>
              action ? (
                <Tooltip key={label} content={label}>
                  <button
                    onClick={action}
                    aria-label={`Abrir ${label}`}
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
                    aria-label={label}
                    style={{
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "6px",
                      backgroundColor: "var(--accent-subtle)",
                      color: "var(--accent)",
                      border: "1px solid var(--accent)",
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
            ref={searchRef}
            placeholder="Escanear código o buscar producto..."
            aria-label="Buscar productos o escanear código de barras"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchEnter();
              }
            }}
            style={{ flex: 1 }}
          >
            <TextField.Slot>
              <CameraIcon height={16} width={16} />
            </TextField.Slot>
          </TextField.Root>
          <Badge color="gray" variant="soft" size="1">
            {displayProducts.length} productos
          </Badge>
          <StaleIndicator isStale={isProductsStale} />
        </div>

        {/* Category quick filters */}
        <CategoryTabs categories={categories} active={category} onChange={setCategory} />

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
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "10px",
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
          width: "360px",
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => setCustomItemDialog(true)}
              aria-label="Agregar ítem custom al carrito"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                border: "1px dashed var(--accent)",
                borderRadius: "4px",
                backgroundColor: "var(--accent-subtle)",
                color: "var(--accent)",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 500,
              }}
            >
              <PlusIcon width={12} height={12} />
              Ítem custom
            </button>
            <button
              onClick={openCustomerSelection}
              aria-label="Seleccionar cliente para la venta"
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
                padding: "24px",
                textAlign: "center",
              }}
            >
              <Text size="2" color="gray">
                Carrito vacío — escanee, seleccione un producto o agregue un ítem custom
              </Text>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
                onUpdateCustomItem={updateCustomItem}
              />
            ))
          )}
        </div>

        {/* Summary (Stably anchored) */}
        <SummaryPanel onCharge={openPayment} onCustomerClick={openCustomerSelection} />
      </div>

      {/* Dialogs */}
      {payment && <PaymentDialog onSaleComplete={handleSaleComplete} />}
      {customerSelection && <CustomerSelectionDialog />}
      {salesHistory && <SalesHistoryDialog />}
      <SaleSuccessDialog
        open={successDialog.open}
        sale={successDialog.sale}
        change={successDialog.change}
        email={successDialog.email}
        onClose={handleSuccessClose}
      />
      {variantDialog && (
        <VariantSelectionDialog
          product={variantDialog}
          onSelect={handleVariantSelect}
          onClose={() => setVariantDialog(null)}
        />
      )}
      {customItemDialog && (
        <CustomItemDialog
          onAdd={(name, price, quantity) => {
            addCustomItem(name, price, quantity);
            setCustomItemDialog(false);
          }}
          onClose={() => setCustomItemDialog(false)}
        />
      )}
    </div>
  );
}
