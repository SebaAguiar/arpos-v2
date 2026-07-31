import { useEffect, useState, useMemo } from "react";
import {
  Text,
  Button,
  Table,
  Badge,
  Tooltip,
  TextField,
  Flex,
  Dialog,
  Select,
  IconButton,
} from "@radix-ui/themes";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  Cross2Icon,
  ArchiveIcon,
  UploadIcon,
  EyeOpenIcon,
} from "@radix-ui/react-icons";
import { usePurchasesStore } from "@/stores/purchases.store";
import { PurchasesRepository } from "@/repositories/purchases.repository";
import { ProductsRepository } from "@/repositories/products.repository";
import { ContactsRepository } from "@/repositories/contacts.repository";
import { StaleIndicator } from "@/components/ui/StaleIndicator";
import type { PurchaseOrder, Customer, Product } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  ordered: "Pedido",
  partial: "Parcial",
  received: "Recibido",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, "gray" | "blue" | "orange" | "green" | "red"> = {
  draft: "gray",
  ordered: "blue",
  partial: "orange",
  received: "green",
  cancelled: "red",
};

export function PurchasesPage() {
  const { orders, loading, search, isStale, fetchOrders, setSearch } =
    usePurchasesStore();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.supplier.name.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    return result;
  }, [orders, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div style={{ paddingBottom: "32px" }}>
      <Flex align="center" justify="between" style={{ marginBottom: "20px" }}>
        <div>
          <Flex align="center" gap="3">
            <Text size="6" weight="bold">
              Órdenes de Compra
            </Text>
            <Badge color="gray" variant="soft" size="2">
              {orders.length} órdenes
            </Badge>
            <StaleIndicator isStale={isStale} />
          </Flex>
          <Text size="2" color="gray" style={{ marginTop: "4px" }}>
            Gestioná las órdenes de compra a proveedores y recibí mercadería.
          </Text>
        </div>

        <Button size="3" onClick={() => setCreateOpen(true)}>
          <PlusIcon width={18} height={18} />
          Nueva orden
        </Button>
      </Flex>

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
            placeholder="Buscar por proveedor o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "320px" }}
            aria-label="Buscar órdenes de compra"
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
        </Flex>

        <Select.Root
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v)}
        >
          <Select.Trigger placeholder="Filtrar por estado" />
          <Select.Content>
            <Select.Item value="all">Todos</Select.Item>
            <Select.Item value="draft">Borrador</Select.Item>
            <Select.Item value="ordered">Pedido</Select.Item>
            <Select.Item value="partial">Parcial</Select.Item>
            <Select.Item value="received">Recibido</Select.Item>
            <Select.Item value="cancelled">Cancelado</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

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
              <Table.ColumnHeaderCell>Proveedor</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Estado</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: "right" }}>
                Total
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: "right" }}>
                Items
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Fecha</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: "right" }}>
                Acciones
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {loading ? (
              <SkeletonRows />
            ) : filteredOrders.length === 0 ? (
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
                      No se encontraron órdenes
                    </Text>
                    <Text size="2" color="gray" style={{ maxWidth: 400 }}>
                      {search || statusFilter !== "all"
                        ? "Probá cambiando el filtro o la búsqueda."
                        : "Comenzá creando tu primera orden de compra."}
                    </Text>
                    {!search && statusFilter === "all" && (
                      <Button size="2" onClick={() => setCreateOpen(true)}>
                        <PlusIcon width={16} height={16} />
                        Crear orden
                      </Button>
                    )}
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredOrders.map((order) => (
                <Table.Row key={order.id}>
                  <Table.Cell>
                    <Text size="2" weight="bold">
                      {order.supplier.name}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={STATUS_COLORS[order.status]} variant="soft" size="1">
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: "right" }}>
                    <Text size="2" weight="bold">
                      ${(order.total_cents / 100).toFixed(2)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: "right" }}>
                    <Text size="2">{order.items.length}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">
                      {new Date(order.created_at * 1000).toLocaleDateString()}
                    </Text>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: "right" }}>
                    <Flex justify="end" gap="2">
                      <Tooltip content="Ver detalle">
                        <IconButton
                          size="2"
                          variant="ghost"
                          color="gray"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDetailOpen(true);
                          }}
                          aria-label="Ver detalle"
                        >
                          <EyeOpenIcon width={16} height={16} />
                        </IconButton>
                      </Tooltip>
                      {(order.status === "ordered" || order.status === "partial") && (
                        <Tooltip content="Recibir mercadería">
                          <IconButton
                            size="2"
                            variant="ghost"
                            color="green"
                            onClick={() => {
                              setSelectedOrder(order);
                              setReceiveOpen(true);
                            }}
                            aria-label="Recibir mercadería"
                          >
                            <UploadIcon width={16} height={16} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </div>

      <CreateOrderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => fetchOrders()}
      />

      {selectedOrder && (
        <>
          <ReceiveOrderDialog
            open={receiveOpen}
            onOpenChange={(open) => {
              setReceiveOpen(open);
              if (!open) setSelectedOrder(null);
            }}
            order={selectedOrder}
            onSuccess={() => fetchOrders()}
          />
          <OrderDetailDialog
            open={detailOpen}
            onOpenChange={(open) => {
              setDetailOpen(open);
              if (!open) setSelectedOrder(null);
            }}
            order={selectedOrder}
          />
        </>
      )}
    </div>
  );
}

function CreateOrderDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [suppliers, setSuppliers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<
    Array<{
      productId: string;
      variantId?: string;
      quantity_ordered: number;
      unit_cost_cents: number;
    }>
  >([{ productId: "", quantity_ordered: 1, unit_cost_cents: 0 }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      ContactsRepository.getAll("supplier").then(setSuppliers).catch(() => {});
      ProductsRepository.getAll().then(setProducts).catch(() => {});
    }
  }, [open]);

  const addItem = () => {
    setItems([...items, { productId: "", quantity_ordered: 1, unit_cost_cents: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!supplierId || items.some((i) => !i.productId)) return;
    setSubmitting(true);
    try {
      await PurchasesRepository.create({
        supplierId,
        notes: notes || undefined,
        items,
      });
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      console.error("[CreateOrderDialog] Error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 600, padding: "24px" }}>
        <Dialog.Title style={{ marginBottom: "8px" }}>
          Nueva orden de compra
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" style={{ marginBottom: "20px" }}>
          Seleccioná el proveedor y los productos a ordenar.
        </Dialog.Description>

        <Flex direction="column" gap="4">
          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">
              Proveedor
            </Text>
            <Select.Root value={supplierId} onValueChange={setSupplierId}>
              <Select.Trigger placeholder="Seleccionar proveedor..." />
              <Select.Content>
                {suppliers.map((s) => (
                  <Select.Item key={s.id} value={s.id}>
                    {s.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">
              Productos
            </Text>
            {items.map((item, index) => (
              <Flex key={index} align="center" gap="2">
                <Select.Root
                  value={item.productId}
                  onValueChange={(v) => updateItem(index, "productId", v)}
                >
                  <Select.Trigger placeholder="Seleccionar producto..." style={{ width: "100%" }} />
                  <Select.Content>
                    {products.map((p) => (
                      <Select.Item key={p.id} value={p.id}>
                        {p.name} — ${p.price.toFixed(2)}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                <TextField.Root
                  type="number"
                  placeholder="Cant."
                  value={item.quantity_ordered}
                  onChange={(e) =>
                    updateItem(index, "quantity_ordered", Number(e.target.value))
                  }
                  style={{ width: "80px" }}
                />
                <TextField.Root
                  type="number"
                  placeholder="Costo"
                  value={item.unit_cost_cents ? item.unit_cost_cents / 100 : ""}
                  onChange={(e) =>
                    updateItem(
                      index,
                      "unit_cost_cents",
                      Math.round(Number(e.target.value) * 100),
                    )
                  }
                  style={{ width: "100px" }}
                />
                {items.length > 1 && (
                  <IconButton
                    size="1"
                    variant="ghost"
                    color="red"
                    onClick={() => removeItem(index)}
                    aria-label="Quitar producto"
                  >
                    <Cross2Icon width={14} height={14} />
                  </IconButton>
                )}
              </Flex>
            ))}
            <Button size="1" variant="soft" onClick={addItem}>
              <PlusIcon width={14} height={14} />
              Agregar producto
            </Button>
          </Flex>

          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">
              Notas
            </Text>
            <TextField.Root
              placeholder="Notas opcionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Flex>
        </Flex>

        <Flex justify="end" gap="3" style={{ marginTop: "24px" }}>
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancelar
            </Button>
          </Dialog.Close>
          <Button
            disabled={
              submitting || !supplierId || items.some((i) => !i.productId)
            }
            onClick={handleSubmit}
          >
            {submitting ? "Creando..." : "Crear orden"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

function ReceiveOrderDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder;
  onSuccess: () => void;
}) {
  const [items, setItems] = useState<
    Array<{ itemId: string; quantity_received: number }>
  >([]);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && order) {
      setItems(
        order.items
          .filter((i) => i.quantity_received < i.quantity_ordered)
          .map((i) => ({ itemId: i.id, quantity_received: 1 })),
      );
    }
  }

  const updateQuantity = (itemId: string, qty: number) => {
    setItems(items.map((i) => (i.itemId === itemId ? { ...i, quantity_received: qty } : i)));
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      await PurchasesRepository.receive({
        orderId: order.id,
        receipt_number: receiptNumber || undefined,
        notes: notes || undefined,
        items,
      });
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      console.error("[ReceiveOrderDialog] Error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingItems = order.items.filter(
    (i) => i.quantity_received < i.quantity_ordered,
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 500, padding: "24px" }}>
        <Dialog.Title style={{ marginBottom: "8px" }}>
          Recibir mercadería
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" style={{ marginBottom: "20px" }}>
          Orden: {order.supplier.name} — ${(order.total_cents / 100).toFixed(2)}
        </Dialog.Description>

        <Flex direction="column" gap="4">
          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">
              N° de remito (opcional)
            </Text>
            <TextField.Root
              placeholder="Remito del proveedor..."
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
            />
          </Flex>

          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">
              Cantidades a recibir
            </Text>
            {pendingItems.map((item) => {
              const qty = items.find((i) => i.itemId === item.id);
              return (
                <Flex key={item.id} align="center" justify="between" gap="2">
                  <Text size="2">
                    {item.product.name}
                    {item.variant
                      ? ` (${[item.variant.size, item.variant.color].filter(Boolean).join(" / ")})`
                      : ""}
                  </Text>
                  <Text size="2" color="gray">
                    Pendiente: {item.quantity_ordered - item.quantity_received}
                  </Text>
                  <TextField.Root
                    type="number"
                    value={qty?.quantity_received ?? 0}
                    onChange={(e) =>
                      updateQuantity(item.id, Number(e.target.value))
                    }
                    style={{ width: "80px" }}
                  />
                </Flex>
              );
            })}
          </Flex>

          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">
              Notas
            </Text>
            <TextField.Root
              placeholder="Notas opcionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Flex>
        </Flex>

        <Flex justify="end" gap="3" style={{ marginTop: "24px" }}>
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancelar
            </Button>
          </Dialog.Close>
          <Button
            disabled={submitting || items.length === 0}
            onClick={handleSubmit}
          >
            {submitting ? "Recibiendo..." : "Confirmar recepción"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

function OrderDetailDialog({
  open,
  onOpenChange,
  order,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 600, padding: "24px" }}>
        <Dialog.Title style={{ marginBottom: "8px" }}>
          Detalle de orden
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" style={{ marginBottom: "20px" }}>
          Proveedor: {order.supplier.name}
        </Dialog.Description>

        <Flex direction="column" gap="4">
          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">
              Items
            </Text>
            {order.items.map((item) => (
              <Flex
                key={item.id}
                align="center"
                justify="between"
                style={{
                  padding: "8px 12px",
                  backgroundColor: "var(--bg-surface-hover)",
                  borderRadius: "6px",
                }}
              >
                <div>
                  <Text size="2" weight="medium">
                    {item.product.name}
                  </Text>
                  {item.variant && (
                    <Text size="1" color="gray">
                      {[item.variant.size, item.variant.color].filter(Boolean).join(" / ")}
                    </Text>
                  )}
                </div>
                <Flex align="center" gap="3">
                  <Text size="2" color="gray">
                    {item.quantity_ordered} × ${(item.unit_cost_cents / 100).toFixed(2)}
                  </Text>
                  <Text size="2" weight="bold">
                    ${(item.total_cents / 100).toFixed(2)}
                  </Text>
                  <Badge
                    color={
                      item.quantity_received >= item.quantity_ordered
                        ? "green"
                        : item.quantity_received > 0
                          ? "orange"
                          : "gray"
                    }
                    variant="soft"
                    size="1"
                  >
                    Recibido: {item.quantity_received}/{item.quantity_ordered}
                  </Badge>
                </Flex>
              </Flex>
            ))}
          </Flex>

          <Flex justify="between" style={{ paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
            <Text size="2" color="gray">
              Estado:{" "}
              <Badge color={STATUS_COLORS[order.status]} variant="soft" size="1">
                {STATUS_LABELS[order.status]}
              </Badge>
            </Text>
            <Text size="3" weight="bold">
              Total: ${(order.total_cents / 100).toFixed(2)}
            </Text>
          </Flex>

          {order.receipts && order.receipts.length > 0 && (
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">
                Recepciones
              </Text>
              {order.receipts.map((r) => (
                <Flex
                  key={r.id}
                  justify="between"
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "var(--bg-surface-hover)",
                    borderRadius: "6px",
                  }}
                >
                  <Text size="2">
                    {r.receipt_number ?? "Sin remito"}
                  </Text>
                  <Text size="2" color="gray">
                    {new Date(r.created_at * 1000).toLocaleString()}
                  </Text>
                  <Text size="2" color="gray">
                    {r.creator.name}
                  </Text>
                </Flex>
              ))}
            </Flex>
          )}
        </Flex>

        <Flex justify="end" gap="3" style={{ marginTop: "24px" }}>
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cerrar
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <Table.Row key={i}>
          <Table.Cell>
            <div
              style={{
                height: "16px",
                width: "120px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "4px",
              }}
            />
          </Table.Cell>
          <Table.Cell>
            <div
              style={{
                height: "16px",
                width: "80px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "4px",
              }}
            />
          </Table.Cell>
          <Table.Cell>
            <div
              style={{
                height: "16px",
                width: "60px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "4px",
              }}
            />
          </Table.Cell>
          <Table.Cell>
            <div
              style={{
                height: "16px",
                width: "40px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "4px",
              }}
            />
          </Table.Cell>
          <Table.Cell>
            <div
              style={{
                height: "16px",
                width: "80px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "4px",
              }}
            />
          </Table.Cell>
          <Table.Cell>
            <div
              style={{
                height: "24px",
                width: "80px",
                marginLeft: "auto",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "4px",
              }}
            />
          </Table.Cell>
        </Table.Row>
      ))}
    </>
  );
}
