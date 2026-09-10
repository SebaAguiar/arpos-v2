import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  Button,
  TextField,
  Text,
  Flex,
  Grid,
  Select,
  Badge,
} from "@radix-ui/themes";
import { PlusCircledIcon, TrashIcon } from "@radix-ui/react-icons";
import { ProductsRepository } from "@/repositories/products.repository";
import { VariantsService } from "@/services/products.service";
import { PricingFields, type PricingValues } from "@/components/product/PricingFields";
import { CurrencyField } from "@/components/product/CurrencyField";
import { parseNumericInput } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { FieldError } from "@/components/ui/FieldError";
import { InlineNotice } from "@/components/ui/InlineNotice";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: Product | null;
  categories: string[];
  products: Product[];
  onSuccess: () => void;
}

interface VariantEntry {
  tempId: string;
  existingId?: string;
  size: string;
  color: string;
  barcode: string;
  sku: string;
  price: string;
  cost: string;
  stock: string;
  _deleted?: boolean;
}

let variantIdCounter = 0;
function nextVariantId() {
  return `v-${++variantIdCounter}`;
}

let defaultCodeCounter = 0;
function nextDefaultCode() {
  return `PROD-${1000 + defaultCodeCounter++}`;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  productToEdit,
  categories,
  products,
  onSuccess,
}: ProductFormDialogProps) {
  const isEditing = !!productToEdit;

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pricingValues, setPricingValues] = useState<PricingValues>({
    cost: "",
    margin: "",
    price: "",
  });
  const [category, setCategory] = useState("");
  const [categoryIsNew, setCategoryIsNew] = useState(false);
  const [variants, setVariants] = useState<VariantEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const dirtyRef = useRef(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setError(null);
      if (productToEdit) {
        setCode(productToEdit.internalCode || "");
        setName(productToEdit.name || "");
        setDescription(productToEdit.description || "");
        const editCost = productToEdit.cost ? String(productToEdit.cost) : "";
        const editPrice = productToEdit.price ? String(productToEdit.price) : "";
        const editMargin =
          editCost && editPrice && parseFloat(editCost) > 0
            ? (
                ((parseFloat(editPrice) - parseFloat(editCost)) /
                  parseFloat(editPrice)) *
                100
              ).toFixed(1)
            : "";
        setPricingValues({ cost: editCost, margin: editMargin, price: editPrice });
        const productCategory = productToEdit.category || "";
        setCategory(productCategory);
        setCategoryIsNew(productCategory !== "" && !categories.includes(productCategory));
        setLoadingVariants(true);
        const loaded = productToEdit.variants.map((v) => ({
          tempId: nextVariantId(),
          existingId: v.id.startsWith(`${productToEdit.id}-default`) ? undefined : v.id,
          size: v.size || "",
          color: v.color || "",
          barcode: v.barcode || "",
          sku: v.sku || "",
          price: v.price ? String(v.price) : "",
          cost: v.costPrice ? String(v.costPrice) : "",
          stock: v.stockItems[0]?.quantity ? String(v.stockItems[0].quantity) : "0",
        }));
        setVariants(loaded);
        setLoadingVariants(false);
      } else {
        setCode(nextDefaultCode());
        setName("");
        setDescription("");
        setPricingValues({ cost: "", margin: "", price: "" });
        setCategory("");
        setCategoryIsNew(false);
        setVariants([]);
      }
    }
  }

  const addVariant = useCallback(() => {
    setVariants((prev) => [
      ...prev,
      {
        tempId: nextVariantId(),
        size: "",
        color: "",
        barcode: "",
        sku: "",
        price: pricingValues.price,
        cost: pricingValues.cost,
        stock: "0",
      },
    ]);
  }, [pricingValues]);

  const updateVariant = useCallback(
    (tempId: string, field: keyof VariantEntry, value: string) => {
      setVariants((prev) =>
        prev.map((v) => (v.tempId === tempId ? { ...v, [field]: value } : v))
      );
    },
    []
  );

  const removeVariant = useCallback((tempId: string) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.tempId === tempId ? { ...v, _deleted: true } : v
      )
    );
  }, []);

  const markDirty = useCallback((fn: () => void) => {
    dirtyRef.current = true;
    fn();
  }, []);

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && dirtyRef.current) {
        const ok = window.confirm(
          "Tenés cambios sin guardar. ¿Desea descartarlos y cerrar?"
        );
        if (!ok) return;
        dirtyRef.current = false;
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  const numericPrice = parseNumericInput(pricingValues.price);
  const numericCost = parseNumericInput(pricingValues.cost);
  const priceBelowCost =
    numericPrice > 0 && numericCost > 0 && numericPrice < numericCost;

  const skuConflict = useCallback(
    (proposedSku: string, currentVariantId?: string) => {
      const trimmed = proposedSku.trim().toLowerCase();
      if (!trimmed) return false;
      return products.some(
        (p) =>
          p.id !== productToEdit?.id &&
          p.variants.some(
            (v) =>
              v.id !== currentVariantId &&
              (v.sku?.toLowerCase() === trimmed ||
                v.barcode?.toLowerCase() === trimmed)
          )
      );
    },
    [products, productToEdit]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!code.trim()) {
        setError("El código del producto es obligatorio.");
        return;
      }
      if (!name.trim()) {
        setError("El nombre del producto es obligatorio.");
        return;
      }

      if (products.some((p) => p.internalCode === code.trim() && p.id !== productToEdit?.id)) {
        setError("Ya existe un producto con ese código interno.");
        return;
      }

      if (priceBelowCost) {
        setError("El precio de venta no puede ser menor al costo.");
        return;
      }

      const priceCents = Math.round(numericPrice * 100);
      let costCents: number | undefined = undefined;
      if (numericCost >= 0) {
        costCents = Math.round(numericCost * 100);
      }

      const activeVariants = variants.filter((v) => !v._deleted);

      for (const v of activeVariants) {
        if (skuConflict(v.sku, v.existingId)) {
          setError(`El SKU "${v.sku}" ya existe en otro producto.`);
          return;
        }
      }

      setSubmitting(true);
      try {
        if (isEditing && productToEdit) {
          await ProductsRepository.update(productToEdit.id, {
            name: name.trim(),
            description: description.trim() || undefined,
            price_cents: priceCents,
            cost_cents: costCents,
            category_id: category.trim() || undefined,
          });

          for (const v of activeVariants) {
            const variantPriceCents = v.price
              ? Math.round(parseFloat(v.price) * 100)
              : priceCents;
            const variantCostCents = v.cost
              ? Math.round(parseFloat(v.cost) * 100)
              : costCents;

            if (v.existingId) {
              await VariantsService.update(v.existingId, {
                size: v.size || undefined,
                color: v.color || undefined,
                barcode: v.barcode || undefined,
                sku: v.sku || undefined,
                price_cents: variantPriceCents,
                cost_cents: variantCostCents,
              });
            } else {
              await VariantsService.create({
                productId: productToEdit.id,
                size: v.size || undefined,
                color: v.color || undefined,
                barcode: v.barcode || undefined,
                sku: v.sku || undefined,
                price_cents: variantPriceCents,
                cost_cents: variantCostCents,
              });
            }
          }

          const removedExisting = variants.filter(
            (v) => v._deleted && v.existingId
          );
          for (const v of removedExisting) {
            await VariantsService.remove(v.existingId!);
          }
        } else {
          const initialStock = activeVariants.length > 0
            ? parseInt(activeVariants[0]!.stock, 10) || 0
            : 0;

          const created = await ProductsRepository.create({
            code: code.trim(),
            name: name.trim(),
            description: description.trim() || undefined,
            price_cents: priceCents,
            cost_cents: costCents,
            stock_quantity: initialStock,
            category_id: category.trim() || undefined,
          });

          for (const v of activeVariants) {
            const variantPriceCents = v.price
              ? Math.round(parseFloat(v.price) * 100)
              : priceCents;
            const variantCostCents = v.cost
              ? Math.round(parseFloat(v.cost) * 100)
              : costCents;
            await VariantsService.create({
              productId: created.id,
              size: v.size || undefined,
              color: v.color || undefined,
              barcode: v.barcode || undefined,
              sku: v.sku || undefined,
              price_cents: variantPriceCents,
              cost_cents: variantCostCents,
            });
          }
        }
        dirtyRef.current = false;
        onSuccess();
        onOpenChange(false);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Ocurrió un error al guardar el producto.";
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [
      code, name, description, category, variants,
      isEditing, productToEdit, onSuccess, onOpenChange,
      numericPrice, numericCost, priceBelowCost, skuConflict, products,
    ]
  );

  const activeVariants = variants.filter((v) => !v._deleted);
  const totalStock = activeVariants.reduce(
    (sum, v) => sum + (parseInt(v.stock, 10) || 0),
    0
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 560, padding: "24px" }}>
        <Dialog.Title style={{ marginBottom: "4px" }}>
          {isEditing ? "Editar producto" : "Nuevo producto"}
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" style={{ marginBottom: "16px" }}>
          {isEditing
            ? "Modificá los detalles del producto en el catálogo."
            : "Completá la información para dar de alta un producto."}
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            {error && (
              <InlineNotice>{error}</InlineNotice>
            )}

            <Grid columns="2" gap="3">
              <div>
                <FieldLabel size="1" marginBottom="4px">
                  Código Barcode / Interno *
                </FieldLabel>
                <TextField.Root
                  placeholder="Ej. 779123456789"
                  value={code}
                  onChange={(e) => markDirty(() => setCode(e.target.value))}
                  disabled={isEditing}
                  aria-label="Código del producto"
                />
              </div>
              <div>
                <FieldLabel size="1" marginBottom="4px">
                  Categoría (Opcional)
                </FieldLabel>
                {categoryIsNew ? (
                  <Flex gap="2" align="center">
                    <TextField.Root
                      placeholder="Nueva categoría"
                      value={category}
                      onChange={(e) => markDirty(() => setCategory(e.target.value))}
                      aria-label="Nueva categoría del producto"
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="1"
                      onClick={() => markDirty(() => setCategoryIsNew(false))}
                    >
                      Usar existente
                    </Button>
                  </Flex>
                ) : (
                  <Select.Root
                    value={category || "__none__"}
                    onValueChange={(value) =>
                      markDirty(() => {
                        if (value === "__new__") {
                          setCategory("");
                          setCategoryIsNew(true);
                        } else {
                          setCategory(value === "__none__" ? "" : value);
                          setCategoryIsNew(false);
                        }
                      })
                    }
                  >
                    <Select.Trigger style={{ width: "100%" }} aria-label="Categoría del producto" />
                    <Select.Content position="popper">
                      <Select.Item value="__none__">Sin categoría</Select.Item>
                      <Select.Item value="__new__">＋ Crear nueva categoría...</Select.Item>
                      {categories.map((c) => (
                        <Select.Item key={c} value={c}>
                          {c}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              </div>
            </Grid>

            <div>
              <FieldLabel size="1" marginBottom="4px">
                Nombre del producto *
              </FieldLabel>
              <TextField.Root
                placeholder="Ej. Remera de Algodón Negra M"
                value={name}
                onChange={(e) => markDirty(() => setName(e.target.value))}
                aria-label="Nombre del producto"
              />
            </div>

            <div>
              <FieldLabel size="1" marginBottom="4px">
                Descripción (Opcional)
              </FieldLabel>
              <TextField.Root
                placeholder="Detalle del producto, talle, color..."
                value={description}
                onChange={(e) => markDirty(() => setDescription(e.target.value))}
                aria-label="Descripción del producto"
              />
            </div>

            <div>
              <PricingFields
                values={pricingValues}
                onChange={(vals) => markDirty(() => setPricingValues(vals))}
              />
              {priceBelowCost && (
                <FieldError>
                  El precio de venta es menor al costo (margen negativo).
                </FieldError>
              )}
            </div>

            {/* Variants section */}
            <div>
              <Flex align="center" justify="between" style={{ marginBottom: "8px" }}>
                <Flex align="center" gap="2">
                  <Text size="2" weight="bold">
                    Variantes
                  </Text>
                  {activeVariants.length > 0 && (
                    <Badge color="gray" variant="soft" size="1">
                      {activeVariants.length} · {totalStock} u. stock total
                    </Badge>
                  )}
                </Flex>
                <Button
                  type="button"
                  variant="soft"
                  size="1"
                  onClick={() => markDirty(addVariant)}
                >
                  <PlusCircledIcon width={14} height={14} />
                  Agregar variante
                </Button>
              </Flex>

              {loadingVariants ? (
                <Text size="2" color="gray">Cargando variantes...</Text>
              ) : activeVariants.length === 0 ? (
                <Text size="2" color="gray" style={{ padding: "8px 0" }}>
                  Sin variantes — se usará el precio general del producto
                </Text>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {activeVariants.map((v) => {
                    const variantPrice = parseNumericInput(v.price);
                    const variantCost = parseNumericInput(v.cost);
                    const variantLoss =
                      variantPrice > 0 && variantCost > 0 && variantPrice < variantCost;
                    return (
                      <div
                        key={v.tempId}
                        style={{
                          padding: "10px",
                          backgroundColor: "var(--bg-surface-hover)",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <Grid columns="3" gap="2" style={{ marginBottom: "6px" }}>
                          <div>
                            <Text size="1" color="gray">Talle</Text>
                            <TextField.Root
                              size="1"
                              placeholder="Ej: S, M, L"
                              value={v.size}
                              onChange={(e) => markDirty(() => updateVariant(v.tempId, "size", e.target.value))}
                            />
                          </div>
                          <div>
                            <Text size="1" color="gray">Color</Text>
                            <TextField.Root
                              size="1"
                              placeholder="Ej: Rojo, Azul"
                              value={v.color}
                              onChange={(e) => markDirty(() => updateVariant(v.tempId, "color", e.target.value))}
                            />
                          </div>
                          <div>
                            <Text size="1" color="gray">Código de barras</Text>
                            <TextField.Root
                              size="1"
                              placeholder="Opcional"
                              value={v.barcode}
                              onChange={(e) => markDirty(() => updateVariant(v.tempId, "barcode", e.target.value))}
                            />
                          </div>
                        </Grid>
                        <Grid columns="4" gap="2" style={{ marginBottom: "6px" }}>
                          <div>
                            <Text size="1" color="gray">SKU</Text>
                            <TextField.Root
                              size="1"
                              placeholder="Opcional"
                              value={v.sku}
                              onChange={(e) => markDirty(() => updateVariant(v.tempId, "sku", e.target.value))}
                            />
                            {skuConflict(v.sku, v.existingId) && (
                              <Text size="1" color="red">SKU duplicado</Text>
                            )}
                          </div>
                          <div>
                            <Text size="1" color="gray">Precio</Text>
                            <CurrencyField
                              size="1"
                              placeholder={pricingValues.price || "0"}
                              value={v.price}
                              onChange={(value) => markDirty(() => updateVariant(v.tempId, "price", value))}
                              ariaLabel="Precio de la variante"
                            />
                          </div>
                          <div>
                            <Text size="1" color="gray">Costo</Text>
                            <CurrencyField
                              size="1"
                              placeholder={pricingValues.cost || "0"}
                              value={v.cost}
                              onChange={(value) => markDirty(() => updateVariant(v.tempId, "cost", value))}
                              ariaLabel="Costo de la variante"
                            />
                          </div>
                          {!isEditing && (
                            <div>
                              <Text size="1" color="gray">Stock</Text>
                              <TextField.Root
                                size="1"
                                type="number"
                                placeholder="0"
                                value={v.stock}
                                onChange={(e) => markDirty(() => updateVariant(v.tempId, "stock", e.target.value))}
                              />
                            </div>
                          )}
                        </Grid>
                        {variantLoss && (
                          <FieldError style={{ marginTop: 0, marginBottom: "4px" }}>
                            Precio menor al costo de esta variante.
                          </FieldError>
                        )}
                        <Flex justify="end">
                          <Button
                            type="button"
                            variant="ghost"
                            color="red"
                            size="1"
                            onClick={() => markDirty(() => removeVariant(v.tempId))}
                          >
                            <TrashIcon width={12} height={12} />
                            {v.existingId ? "Eliminar" : "Quitar"}
                          </Button>
                        </Flex>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Flex justify="end" gap="3" style={{ marginTop: "16px" }}>
              <Dialog.Close>
                <Button type="button" variant="soft" color="gray">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Guardando..."
                  : isEditing
                  ? "Guardar cambios"
                  : "Crear producto"}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
