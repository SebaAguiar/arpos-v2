import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Text,
  Button,
  Table,
  Badge,
  IconButton,
  TextField,
  Flex,
  Tooltip,
  Dialog,
} from "@radix-ui/themes";
import {
  PlusIcon,
  Pencil2Icon,
  TrashIcon,
  MagnifyingGlassIcon,
  Cross2Icon,
  PersonIcon,
  ArchiveIcon,
  CardStackIcon,
} from "@radix-ui/react-icons";
import { useCustomersStore } from "@/stores/customers.store";
import { ContactsRepository } from "@/repositories/contacts.repository";
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import { StaleIndicator } from "@/components/ui/StaleIndicator";
import type { Customer } from "@/lib/types";

export function CustomersPage() {
  const {
    customers,
    loading,
    search,
    sortField,
    sortDirection,
    isStale,
    fetchCustomers,
    setSearch,
    setSort,
  } = useCustomersStore();

  const filteredCustomers = useMemo(() => {
    let result = customers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q),
      );
    }
    return [...result].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      const aVal = (a[sortField] ?? "").toString().toLowerCase();
      const bVal = (b[sortField] ?? "").toString().toLowerCase();
      return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
    });
  }, [customers, search, sortField, sortDirection]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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
        setEditingCustomer(null);
        setFormOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const totalCustomers = customers.length;

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingCustomer) return;
    setDeleting(true);
    try {
      await ContactsRepository.remove(deletingCustomer.id);
      await fetchCustomers();
      setDeletingCustomer(null);
    } catch (e) {
      console.error("[CustomersPage] Error deleting customer:", e);
    } finally {
      setDeleting(false);
    }
  }, [deletingCustomer, fetchCustomers]);

  const displayedCustomers = filteredCustomers;

  return (
    <div style={{ paddingBottom: "32px" }}>
      <Flex align="center" justify="between" style={{ marginBottom: "20px" }}>
        <div>
          <Flex align="center" gap="3">
            <Text size="6" weight="bold">
              Clientes
            </Text>
            <Badge color="gray" variant="soft" size="2">
              {totalCustomers} clientes
            </Badge>
            <StaleIndicator isStale={isStale} />
          </Flex>
          <Text size="2" color="gray" style={{ marginTop: "4px" }}>
            Administrá la cartera de clientes del negocio.
          </Text>
        </div>

        <Button size="3" onClick={handleOpenCreate} aria-label="Crear nuevo cliente (Presioná N)">
          <PlusIcon width={18} height={18} />
          Nuevo cliente
          <KbdShortcut label="N" />
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
            ref={searchInputRef}
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "320px" }}
            aria-label="Buscar clientes"
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
              <Table.ColumnHeaderCell
                style={{ cursor: "pointer" }}
                onClick={() => setSort("name")}
              >
                Nombre {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Teléfono</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>CUIT / Documento</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Saldo</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: "right" }}>
                Acciones
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {loading ? (
              <SkeletonRows />
            ) : displayedCustomers.length === 0 ? (
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
                      No se encontraron clientes
                    </Text>
                    <Text size="2" color="gray" style={{ maxWidth: 400 }}>
                      {search
                        ? "Probá cambiando el término de búsqueda."
                        : "Comenzá registrando tu primer cliente con el botón 'Nuevo cliente'."}
                    </Text>
                    {!search && (
                      <Button size="2" onClick={handleOpenCreate}>
                        <PlusIcon width={16} height={16} />
                        Crear primer cliente
                      </Button>
                    )}
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ) : (
              displayedCustomers.map((customer) => (
                <Table.Row
                  key={customer.id}
                  style={{ transition: "background-color 0.15s ease" }}
                >
                  <Table.Cell>
                    <Flex align="center" gap="2">
                      <PersonIcon width={14} height={14} color="var(--text-muted)" />
                      <Text size="2" weight="bold">
                        {customer.name}
                      </Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">
                      {customer.email ?? "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">
                      {customer.phone ?? "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">
                      {customer.taxId ?? "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={(customer.balance ?? 0) > 0 ? "green" : "gray"}
                      size="1"
                    >
                      ${((customer.balance ?? 0)).toFixed(2)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: "right" }}>
                    <Flex justify="end" gap="2">
                      <Tooltip content="Billetera">
                        <IconButton
                          size="2"
                          variant="ghost"
                          color="gray"
                          onClick={() => window.location.href = `/wallet`}
                          aria-label={`Billetera de ${customer.name}`}
                        >
                          <CardStackIcon width={16} height={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip content="Editar cliente">
                        <IconButton
                          size="2"
                          variant="ghost"
                          color="gray"
                          onClick={() => handleOpenEdit(customer)}
                          aria-label={`Editar ${customer.name}`}
                        >
                          <Pencil2Icon width={16} height={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip content="Eliminar cliente">
                        <IconButton
                          size="2"
                          variant="ghost"
                          color="red"
                          onClick={() => setDeletingCustomer(customer)}
                          aria-label={`Eliminar ${customer.name}`}
                        >
                          <TrashIcon width={16} height={16} />
                        </IconButton>
                      </Tooltip>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </div>

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customerToEdit={editingCustomer}
        onSuccess={fetchCustomers}
      />

      <Dialog.Root
        open={!!deletingCustomer}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
      >
        <Dialog.Content style={{ maxWidth: 400, padding: "24px" }}>
          <Dialog.Title style={{ marginBottom: "8px" }}>
            ¿Eliminar cliente?
          </Dialog.Title>
          <Dialog.Description size="2" color="gray" style={{ marginBottom: "20px" }}>
            ¿Estás seguro de que querés eliminar a{" "}
            <strong>"{deletingCustomer?.name}"</strong>? Esta acción ocultará el cliente del sistema.
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
            <div style={{ height: "16px", width: "140px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "4px" }} />
          </Table.Cell>
          <Table.Cell>
            <div style={{ height: "16px", width: "180px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "4px" }} />
          </Table.Cell>
          <Table.Cell>
            <div style={{ height: "16px", width: "100px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "4px" }} />
          </Table.Cell>
          <Table.Cell style={{ textAlign: "right" }}>
            <div style={{ height: "24px", width: "80px", marginLeft: "auto", backgroundColor: "var(--bg-surface-hover)", borderRadius: "4px" }} />
          </Table.Cell>
        </Table.Row>
      ))}
    </>
  );
}
