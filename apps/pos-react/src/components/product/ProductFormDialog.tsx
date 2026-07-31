import { useState, useCallback } from "react";
import {
  Dialog,
  Button,
  TextField,
  Text,
  Flex,
  Grid,
} from "@radix-ui/themes";
import { ExclamationTriangleIcon, PlusCircledIcon, TrashIcon } from "@radix-ui/react-icons";
import { ProductsRepository } from "@/repositories/products.repository";
import { VariantsService } from "@/services/products.service";
import { PricingFields } from "@/components/product/PricingFields";
import { parseNumericInput } from "@/lib/pricing";
import type { Product } from "@/lib/types";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: Product | null;
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
  onSuccess,
}: ProductFormDialogProps) {
  const isEditing = !!productToEdit;

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pricingValues, setPricingValues] = useState({
    cost: "",
    margin: "",
    price: "",
  });
  const [category, setCategory] = useState("");
  const [variants, setVariants] = useState<VariantEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);

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
        setCategory(productToEdit.category || "");
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

      const numericPrice = parseNumericInput(pricingValues.price);
      if (numericPrice <= 0) {
        setError("Ingresá un precio válido mayor a 0.");
        return;
      }

      const priceCents = Math.round(numericPrice * 100);
      let costCents: number | undefined = undefined;
      const numericCost = parseNumericInput(pricingValues.cost);
      if (numericCost >= 0) {
        costCents = Math.round(numericCost * 100);
      }

      const activeVariants = variants.filter((v) => !v._deleted);

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
      code, name, description, pricingValues, category, variants,
      isEditing, productToEdit, onSuccess, onOpenChange,
    ]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
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
              <Flex
                align="center"
                gap="2"
                style={{
                  padding: "10px 12px",
                  backgroundColor: "var(--color-danger-subtle)",
                  border: "1px solid var(--color-danger)",
                  borderRadius: "6px",
                }}
              >
                <ExclamationTriangleIcon color="var(--color-danger)" />
                <Text size="2" color="red">
                  {error}
                </Text>
              </Flex>
            )}

            <Grid columns="2" gap="3">
              <div>
                <Text size="1" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
                  Código Barcode / Interno *
                </Text>
                <TextField.Root
                  placeholder="Ej. 779123456789"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isEditing}
                  aria-label="Código del producto"
                />
              </div>
              <div>
                <Text size="1" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
                  Categoría (Opcional)
                </Text>
                <TextField.Root
                  placeholder="Ej. Indumentaria, Bebidas..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Categoría del producto"
                />
              </div>
            </Grid>

            <div>
              <Text size="1" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
                Nombre del producto *
              </Text>
              <TextField.Root
                placeholder="Ej. Remera de Algodón Negra M"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Nombre del producto"
              />
            </div>

            <div>
              <Text size="1" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
                Descripción (Opcional)
              </Text>
              <TextField.Root
                placeholder="Detalle del producto, talle, color..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-label="Descripción del producto"
              />
            </div>

            <div>
              <PricingFields values={pricingValues} onChange={setPricingValues} />
            </div>

            {/* Variants section */}
            <div>
              <Flex align="center" justify="between" style={{ marginBottom: "8px" }}>
                <Text size="2" weight="bold">
                  Variantes
                </Text>
                <Button
                  type="button"
                  variant="soft"
                  size="1"
                  onClick={addVariant}
                >
                  <PlusCircledIcon width={14} height={14} />
                  Agregar variante
                </Button>
              </Flex>

              {loadingVariants ? (
                <Text size="2" color="gray">Cargando variantes...</Text>
              ) : variants.filter((v) => !v._deleted).length === 0 ? (
                <Text size="2" color="gray" style={{ padding: "8px 0" }}>
                  Sin variantes — se usará el precio general del producto
                </Text>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {variants
                    .filter((v) => !v._deleted)
                    .map((v) => (
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
                              onChange={(e) => updateVariant(v.tempId, "size", e.target.value)}
                            />
                          </div>
                          <div>
                            <Text size="1" color="gray">Color</Text>
                            <TextField.Root
                              size="1"
                              placeholder="Ej: Rojo, Azul"
                              value={v.color}
                              onChange={(e) => updateVariant(v.tempId, "color", e.target.value)}
                            />
                          </div>
                          <div>
                            <Text size="1" color="gray">Código de barras</Text>
                            <TextField.Root
                              size="1"
                              placeholder="Opcional"
                              value={v.barcode}
                              onChange={(e) => updateVariant(v.tempId, "barcode", e.target.value)}
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
                              onChange={(e) => updateVariant(v.tempId, "sku", e.target.value)}
                            />
                          </div>
                          <div>
                            <Text size="1" color="gray">Precio</Text>
                            <TextField.Root
                              size="1"
                              type="number"
                              placeholder={pricingValues.price || "0"}
                              value={v.price}
                              onChange={(e) => updateVariant(v.tempId, "price", e.target.value)}
                            />
                          </div>
                          <div>
                            <Text size="1" color="gray">Costo</Text>
                            <TextField.Root
                              size="1"
                              type="number"
                              placeholder={pricingValues.cost || "0"}
                              value={v.cost}
                              onChange={(e) => updateVariant(v.tempId, "cost", e.target.value)}
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
                                onChange={(e) => updateVariant(v.tempId, "stock", e.target.value)}
                              />
                            </div>
                          )}
                        </Grid>
                        <Flex justify="end">
                          <Button
                            type="button"
                            variant="ghost"
                            color="red"
                            size="1"
                            onClick={() => removeVariant(v.tempId)}
                          >
                            <TrashIcon width={12} height={12} />
                            {v.existingId ? "Eliminar" : "Quitar"}
                          </Button>
                        </Flex>
                      </div>
                    ))}
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
