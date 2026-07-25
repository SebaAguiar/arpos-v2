import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  Button,
  TextField,
  Text,
  Flex,
  Grid,
} from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { ProductsRepository } from "@/repositories/products.repository";
import type { Product } from "@/lib/types";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: Product | null;
  onSuccess: () => void;
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
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (productToEdit) {
        setCode(productToEdit.internalCode || "");
        setName(productToEdit.name || "");
        setDescription(productToEdit.description || "");
        setPrice(productToEdit.price ? String(productToEdit.price) : "");
        setCost(productToEdit.cost ? String(productToEdit.cost) : "");
        const variantStock =
          productToEdit.variants?.[0]?.stockItems?.[0]?.quantity ?? 0;
        setStockQuantity(String(variantStock));
        const variantSku = productToEdit.variants?.[0]?.sku || "";
        setSku(variantSku);
        setCategory(productToEdit.category || "");
      } else {
        setCode(`PROD-${Math.floor(1000 + Math.random() * 9000)}`);
        setName("");
        setDescription("");
        setPrice("");
        setCost("");
        setStockQuantity("0");
        setSku("");
        setCategory("");
      }
    }
  }, [open, productToEdit]);

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

      const numericPrice = parseFloat(price.replace(",", "."));
      if (isNaN(numericPrice) || numericPrice <= 0) {
        setError("Ingresá un precio válido mayor a 0.");
        return;
      }

      const priceCents = Math.round(numericPrice * 100);

      let costCents: number | undefined = undefined;
      if (cost.trim()) {
        const numericCost = parseFloat(cost.replace(",", "."));
        if (!isNaN(numericCost) && numericCost >= 0) {
          costCents = Math.round(numericCost * 100);
        }
      }

      const stockNum = parseInt(stockQuantity, 10);
      const initialStock = !isNaN(stockNum) && stockNum >= 0 ? stockNum : 0;

      setSubmitting(true);
      try {
        if (isEditing && productToEdit) {
          await ProductsRepository.update(productToEdit.id, {
            name: name.trim(),
            description: description.trim() || undefined,
            price_cents: priceCents,
            cost_cents: costCents,
            sku: sku.trim() || undefined,
            category_id: category.trim() || undefined,
          });
        } else {
          await ProductsRepository.create({
            code: code.trim(),
            name: name.trim(),
            description: description.trim() || undefined,
            price_cents: priceCents,
            cost_cents: costCents,
            stock_quantity: initialStock,
            sku: sku.trim() || undefined,
            category_id: category.trim() || undefined,
          });
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
      code,
      name,
      description,
      price,
      cost,
      stockQuantity,
      sku,
      category,
      isEditing,
      productToEdit,
      onSuccess,
      onOpenChange,
    ]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 520, padding: "24px" }}>
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
                  SKU (Opcional)
                </Text>
                <TextField.Root
                  placeholder="Ej. ART-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  aria-label="SKU del producto"
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

            <Grid columns="2" gap="3">
              <div>
                <Text size="1" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
                  Precio de Venta ($) *
                </Text>
                <TextField.Root
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-label="Precio de venta en pesos"
                />
              </div>
              <div>
                <Text size="1" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
                  Costo ($ Opcional)
                </Text>
                <TextField.Root
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  aria-label="Costo en pesos"
                />
              </div>
            </Grid>

            <Grid columns="2" gap="3">
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
              {!isEditing && (
                <div>
                  <Text size="1" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
                    Stock Inicial
                  </Text>
                  <TextField.Root
                    type="number"
                    min="0"
                    placeholder="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    aria-label="Cantidad inicial de stock"
                  />
                </div>
              )}
            </Grid>

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
