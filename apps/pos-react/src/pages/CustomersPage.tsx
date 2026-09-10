import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Text,
  Table,
  Badge,
  IconButton,
  Flex,
  Tooltip,
} from "@radix-ui/themes";
import {
  Pencil2Icon,
  TrashIcon,
  PersonIcon,
  CardStackIcon,
} from "@radix-ui/react-icons";
import { useCustomersStore } from "@/stores/customers.store";
import { ContactsRepository } from "@/repositories/contacts.repository";
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import { StaleIndicator } from "@/components/ui/StaleIndicator";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSearchInput } from "@/components/ui/PageSearchInput";
import { AddButton } from "@/components/ui/AddButton";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { useHotkeys } from "@/hooks/useHotkeys";
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

  useHotkeys([
    { keys: "/", handler: () => searchInputRef.current?.focus() },
    {
      keys: "n",
      handler: () => {
        setEditingCustomer(null);
        setFormOpen(true);
      },
    },
  ]);

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
    <div className="page">
      <Flex direction="column" gap="5">
        <Flex align="center" justify="between" wrap="wrap" gap="3">
          <Flex direction="column" gap="1">
            <Flex align="center" gap="3" wrap="wrap">
              <Text size="5" weight="bold">
                Clientes
              </Text>
              <Badge color="gray" variant="soft" size="2">
                {totalCustomers} clientes
              </Badge>
              <StaleIndicator isStale={isStale} />
            </Flex>
            <Text size="2" color="gray">
              Administrá la cartera de clientes del negocio.
            </Text>
          </Flex>

          <AddButton label="Nuevo cliente" size="2" shortcut="n" onClick={handleOpenCreate} />
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
          }}
        >
        <Flex align="center" gap="3" style={{ flex: 1 }}>
          <PageSearchInput
            placeholder="Buscar por nombre, email o teléfono..."
            ariaLabel="Buscar clientes"
            value={search}
            onChange={setSearch}
            inputRef={searchInputRef}
          />
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
              <TableSkeleton
                columns={[
                  { width: 140 },
                  { width: 180 },
                  { width: 100 },
                  { width: 80, align: "right", height: 24 },
                ]}
              />
            ) : displayedCustomers.length === 0 ? (
              <EmptyState
                colSpan={6}
                title="No se encontraron clientes"
                description={
                  search
                    ? "Probá cambiando el término de búsqueda."
                    : "Comenzá registrando tu primer cliente con el botón 'Nuevo cliente'."
                }
                action={
                  !search
                    ? { label: "Crear primer cliente", onClick: handleOpenCreate }
                    : undefined
                }
              />
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
      </Flex>

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customerToEdit={editingCustomer}
        onSuccess={fetchCustomers}
      />

      <ConfirmDeleteDialog
        open={!!deletingCustomer}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
        title="¿Eliminar cliente?"
        description={
          <>
            ¿Estás seguro de que querés eliminar a{" "}
            <strong>"{deletingCustomer?.name}"</strong>? Esta acción ocultará el cliente del sistema.
          </>
        }
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
}
