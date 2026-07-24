import { useState } from "react";
import {
  Text,
  TextField,
  Badge,
  Separator,
  Switch,
  Tabs,
} from "@radix-ui/themes";
import {
  Cross1Icon,
  PlusIcon,
  Pencil2Icon,
  TrashIcon,
  CopyIcon,
} from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { useProductsStore } from "@/stores/products.store";
import { ProductsRepository } from "@/repositories/products.repository";
import type { Product } from "@/lib/types";

interface VariantForm {
  id?: string;
  size: string;
  color: string;
  barcode: string;
  sku: string;
  cost: string;
  margin: string;
  price: string;
  initialStock: string;
  active: boolean;
}

const emptyVariant = (): VariantForm => ({
  size: "",
  color: "",
  barcode: "",
  sku: "",
  cost: "",
  margin: "",
  price: "",
  initialStock: "0",
  active: true,
});

interface ProductForm {
  name: string;
  description: string;
  category: string;
  internalCode: string;
  cost: string;
  margin: string;
  price: string;
  active: boolean;
  variants: VariantForm[];
}

const emptyForm = (): ProductForm => ({
  name: "",
  description: "",
  category: "",
  internalCode: "",
  cost: "",
  margin: "",
  price: "",
  active: true,
  variants: [],
});

export function ProductManagementDialog() {
  const closeProductManagement = useDialogStore((s) => s.closeProductManagement);
  const products = useProductsStore((s) => s.products);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  const [saving, setSaving] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.internalCode?.toLowerCase().includes(search.toLowerCase())
  );

  const calcPriceFromCost = (cost: string, margin: string) => {
    const c = parseFloat(cost);
    const m = parseFloat(margin);
    if (isNaN(c) || isNaN(m)) return "";
    return (c * (1 + m / 100)).toFixed(2);
  };

  const calcMarginFromPrice = (cost: string, price: string) => {
    const c = parseFloat(cost);
    const p = parseFloat(price);
    if (isNaN(c) || isNaN(p) || p === 0) return "";
    return (((p - c) / p) * 100).toFixed(1);
  };

  const handleSave = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      const priceCents = Math.round((parseFloat(form.price) || 0) * 100);
      const costCents = form.cost ? Math.round(parseFloat(form.cost) * 100) : undefined;

      if (editingId) {
        await ProductsRepository.update(editingId, {
          name: form.name.trim(),
          description: form.description || undefined,
          price_cents: priceCents,
          cost_cents: costCents,
          category_id: form.category || undefined,
          is_active: form.active,
        });
      } else {
        const code = form.internalCode.trim() || form.name.trim().slice(0, 10).toLowerCase().replace(/\s+/g, "-");
        await ProductsRepository.create({
          code,
          name: form.name.trim(),
          description: form.description || undefined,
          price_cents: priceCents,
          cost_cents: costCents,
          category_id: form.category || undefined,
        });
      }

      await fetchProducts();
      setForm(emptyForm());
      setEditingId(null);
      setActiveTab("list");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description || "",
      category: product.category || "",
      internalCode: product.internalCode || "",
      cost: product.cost?.toString() || "",
      margin: product.margin?.toString() || "",
      price: product.price.toString(),
      active: product.active,
      variants: product.variants.map((v) => ({
        id: v.id,
        size: v.size || "",
        color: v.color || "",
        barcode: v.barcode || "",
        sku: v.sku || "",
        cost: v.costPrice?.toString() || "",
        margin: "",
        price: v.price?.toString() || "",
        initialStock: v.stockItems?.[0]?.quantity.toString() || "0",
        active: v.active,
      })),
    });
    setEditingId(product.id);
    setActiveTab("form");
  };

  const handleDelete = async (id: string) => {
    await ProductsRepository.remove(id);
    await fetchProducts();
  };

  const handleDuplicate = async (product: Product) => {
    const code = `${product.internalCode || product.name.slice(0, 10).toLowerCase().replace(/\s+/g, "-")}-copy`;
    await ProductsRepository.create({
      code,
      name: `${product.name} (copia)`,
      description: product.description,
      price_cents: Math.round(product.price * 100),
      cost_cents: product.cost ? Math.round(product.cost * 100) : undefined,
      category_id: product.category,
    });
    await fetchProducts();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          width: "720px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Text size="4" weight="bold">Gestión de Productos</Text>
            <Badge color="gray" variant="soft" size="1">{products.length} productos</Badge>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => { setForm(emptyForm()); setEditingId(null); setActiveTab("form"); }}
              style={{
                padding: "6px 12px",
                backgroundColor: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <PlusIcon width={14} height={14} />
              Nuevo producto
            </button>
            <button
              onClick={closeProductManagement}
              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
            >
              <Cross1Icon width={18} height={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List style={{ padding: "0 20px" }}>
              <Tabs.Trigger value="list">Lista</Tabs.Trigger>
              <Tabs.Trigger value="form">{editingId ? "Editar" : "Nuevo"}</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="list" style={{ padding: "16px 20px" }}>
              <TextField.Root
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: "12px" }}
              />

              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Text size="2" color="gray">No hay productos</Text>
                </div>
              ) : (
                filtered.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Text size="2" weight="bold">{product.name}</Text>
                        {!product.active && <Badge color="red" variant="soft" size="1">Inactivo</Badge>}
                        {product.category && <Badge color="blue" variant="soft" size="1">{product.category}</Badge>}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        ${product.price.toLocaleString("es-AR")} • Stock:{" "}
                        {product.variants.reduce(
                          (s, v) => s + v.stockItems.reduce((si, item) => si + item.quantity, 0),
                          0
                        )}
                        {product.variants.length > 0 && ` • ${product.variants.length} variantes`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{ padding: "4px 8px", border: "none", backgroundColor: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}
                      >
                        <Pencil2Icon width={14} height={14} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(product)}
                        style={{ padding: "4px 8px", border: "none", backgroundColor: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}
                      >
                        <CopyIcon width={14} height={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        style={{ padding: "4px 8px", border: "none", backgroundColor: "transparent", color: "var(--accent)", cursor: "pointer" }}
                      >
                        <TrashIcon width={14} height={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </Tabs.Content>

            <Tabs.Content value="form" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Text size="2" weight="bold" color="gray">Información básica</Text>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <TextField.Root
                    placeholder="Nombre *"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <TextField.Root
                    placeholder="Código interno"
                    value={form.internalCode}
                    onChange={(e) => setForm({ ...form, internalCode: e.target.value })}
                  />
                </div>
                <TextField.Root
                  placeholder="Descripción"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <TextField.Root
                    placeholder="Categoría"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
                    <Text size="2">Activo</Text>
                  </div>
                </div>

                <Separator style={{ backgroundColor: "var(--border)" }} />

                <Text size="2" weight="bold" color="gray">Precio y costo</Text>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  <div>
                    <Text size="1" color="gray" style={{ display: "block", marginBottom: "4px" }}>Costo</Text>
                    <TextField.Root
                      type="number"
                      placeholder="0"
                      value={form.cost}
                      onChange={(e) => {
                        const cost = e.target.value;
                        const price = calcPriceFromCost(cost, form.margin);
                        setForm({ ...form, cost, price: price || form.price });
                      }}
                    />
                  </div>
                  <div>
                    <Text size="1" color="gray" style={{ display: "block", marginBottom: "4px" }}>Margen %</Text>
                    <TextField.Root
                      type="number"
                      placeholder="0"
                      value={form.margin}
                      onChange={(e) => {
                        const margin = e.target.value;
                        const price = calcPriceFromCost(form.cost, margin);
                        setForm({ ...form, margin, price: price || form.price });
                      }}
                    />
                  </div>
                  <div>
                    <Text size="1" color="gray" style={{ display: "block", marginBottom: "4px" }}>Precio venta</Text>
                    <TextField.Root
                      type="number"
                      placeholder="0"
                      value={form.price}
                      onChange={(e) => {
                        const price = e.target.value;
                        const margin = calcMarginFromPrice(form.cost, price);
                        setForm({ ...form, price, margin: margin || form.margin });
                      }}
                    />
                  </div>
                </div>

                <Separator style={{ backgroundColor: "var(--border)" }} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Text size="2" weight="bold" color="gray">Variantes</Text>
                  <button
                    onClick={() => setForm({ ...form, variants: [...form.variants, emptyVariant()] })}
                    style={{
                      padding: "4px 10px",
                      border: "1px dashed var(--border)",
                      borderRadius: "4px",
                      backgroundColor: "transparent",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <PlusIcon width={12} height={12} />
                    Agregar variante
                  </button>
                </div>

                {form.variants.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px",
                      backgroundColor: "var(--bg-surface-hover)",
                      borderRadius: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Text size="1" color="gray">Variante {i + 1}</Text>
                      <button
                        onClick={() =>
                          setForm({
                            ...form,
                            variants: form.variants.filter((_, vi) => vi !== i),
                          })
                        }
                        style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer" }}
                      >
                        <TrashIcon width={12} height={12} />
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
                      <TextField.Root placeholder="Talle" value={v.size} onChange={(e) => {
                        const variants = [...form.variants];
                        variants[i] = { ...variants[i], size: e.target.value };
                        setForm({ ...form, variants });
                      }} />
                      <TextField.Root placeholder="Color" value={v.color} onChange={(e) => {
                        const variants = [...form.variants];
                        variants[i] = { ...variants[i], color: e.target.value };
                        setForm({ ...form, variants });
                      }} />
                      <TextField.Root placeholder="Código barras" value={v.barcode} onChange={(e) => {
                        const variants = [...form.variants];
                        variants[i] = { ...variants[i], barcode: e.target.value };
                        setForm({ ...form, variants });
                      }} />
                      <TextField.Root placeholder="SKU" value={v.sku} onChange={(e) => {
                        const variants = [...form.variants];
                        variants[i] = { ...variants[i], sku: e.target.value };
                        setForm({ ...form, variants });
                      }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
                      <TextField.Root type="number" placeholder="Costo" value={v.cost} onChange={(e) => {
                        const variants = [...form.variants];
                        variants[i] = { ...variants[i], cost: e.target.value };
                        setForm({ ...form, variants });
                      }} />
                      <TextField.Root type="number" placeholder="Precio" value={v.price} onChange={(e) => {
                        const variants = [...form.variants];
                        variants[i] = { ...variants[i], price: e.target.value };
                        setForm({ ...form, variants });
                      }} />
                      <TextField.Root type="number" placeholder="Stock" value={v.initialStock} onChange={(e) => {
                        const variants = [...form.variants];
                        variants[i] = { ...variants[i], initialStock: e.target.value };
                        setForm({ ...form, variants });
                      }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Switch checked={v.active} onCheckedChange={(c) => {
                          const variants = [...form.variants];
                          variants[i] = { ...variants[i], active: c };
                          setForm({ ...form, variants });
                        }} />
                        <Text size="1">Activo</Text>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button
                    onClick={() => { setForm(emptyForm()); setEditingId(null); setActiveTab("list"); }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "transparent",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!form.name.trim() || saving}
                    style={{
                      padding: "8px 20px",
                      backgroundColor: form.name.trim() && !saving ? "var(--accent)" : "var(--bg-surface)",
                      color: form.name.trim() && !saving ? "#fff" : "var(--text-secondary)",
                      border: "none",
                      borderRadius: "6px",
                      cursor: form.name.trim() && !saving ? "pointer" : "not-allowed",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear producto"}
                  </button>
                </div>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
}
