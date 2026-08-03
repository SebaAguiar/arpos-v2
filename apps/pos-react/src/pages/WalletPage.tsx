import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  MinusIcon,
  MagnifyingGlassIcon,
  Cross2Icon,
  PersonIcon,
  ArchiveIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useCustomersStore } from "@/stores/customers.store";
import { useWalletStore } from "@/stores/wallet.store";
import { StaleIndicator } from "@/components/ui/StaleIndicator";
import type { Customer } from "@/lib/types";

function formatBalance(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function WalletOperationDialog({
  open,
  onOpenChange,
  customer,
  operation,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  operation: "credit" | "debit";
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const credit = useWalletStore((s) => s.credit);
  const debit = useWalletStore((s) => s.debit);

  const isCredit = operation === "credit";

  const handleConfirm = useCallback(async () => {
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      setError("Ingresá un monto válido mayor a 0");
      return;
    }
    const amountCents = Math.round(amountFloat * 100);
    setLoading(true);
    setError(null);
    try {
      if (isCredit) {
        await credit(customer.id, { amount_cents: amountCents, notes: notes || undefined });
      } else {
        await debit(customer.id, { amount_cents: amountCents, notes: notes || undefined });
      }
      setAmount("");
      setNotes("");
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar la operación");
    } finally {
      setLoading(false);
    }
  }, [amount, notes, isCredit, customer.id, credit, debit, onSuccess, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 420, padding: "24px" }}>
        <Dialog.Title style={{ marginBottom: "8px" }}>
          {isCredit ? "Acreditar saldo" : "Debitar saldo"} — {customer.name}
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" style={{ marginBottom: "20px" }}>
          {isCredit
            ? "Ingresá el monto para acreditar en la billetera del cliente."
            : "Ingresá el monto para debitar de la billetera del cliente."}
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <label>
            <Text size="2" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
              Monto
            </Text>
            <TextField.Root
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="Monto"
            >
              <TextField.Slot>$</TextField.Slot>
            </TextField.Root>
          </label>

          <label>
            <Text size="2" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
              Notas (opcional)
            </Text>
            <TextField.Root
              placeholder="Motivo de la operación..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-label="Notas"
            />
          </label>

          {error && (
            <Text size="2" color="red">
              {error}
            </Text>
          )}

          <Flex justify="end" gap="3" style={{ marginTop: "12px" }}>
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray" disabled={loading}>
                Cancelar
              </Button>
            </Dialog.Close>
            <Button
              color={isCredit ? "green" : "red"}
              disabled={loading || !amount}
              onClick={handleConfirm}
            >
              {loading
                ? "Procesando..."
                : isCredit
                  ? "Acreditar"
                  : "Debitar"}
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

function CustomerWalletDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}) {
  const { balanceCents, transactions, loading, error, fetchBalance, fetchTransactions, reset } =
    useWalletStore();
  const [operation, setOperation] = useState<"credit" | "debit" | null>(null);

  useEffect(() => {
    if (open && customer) {
      fetchBalance(customer.id);
      fetchTransactions(customer.id);
    }
  }, [open, customer, fetchBalance, fetchTransactions]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleSuccess = useCallback(() => {
    if (customer) {
      fetchBalance(customer.id);
      fetchTransactions(customer.id);
    }
  }, [customer, fetchBalance, fetchTransactions]);

  if (!customer) return null;

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ maxWidth: 640, padding: "24px" }}>
          <Dialog.Title style={{ marginBottom: "4px" }}>
            Billetera — {customer.name}
          </Dialog.Title>

          <Flex align="center" gap="3" style={{ marginBottom: "20px" }}>
            <Badge color={balanceCents >= 0 ? "green" : "red"} size="3">
              Saldo: {formatBalance(balanceCents)}
            </Badge>
            <Button size="1" variant="soft" color="green" onClick={() => setOperation("credit")}>
              <PlusIcon width={14} height={14} />
              Acreditar
            </Button>
            <Button size="1" variant="soft" color="red" onClick={() => setOperation("debit")}>
              <MinusIcon width={14} height={14} />
              Debitar
            </Button>
          </Flex>

          {error && (
            <Text size="2" color="red" style={{ marginBottom: "12px" }}>
              {error}
            </Text>
          )}

          <Text size="2" weight="bold" style={{ marginBottom: "8px" }}>
            Historial de movimientos
          </Text>

          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Fecha</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Tipo</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Monto</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Saldo posterior</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Referencia</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Notas</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {loading && transactions.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    <Flex justify="center" style={{ padding: "24px" }}>
                      <ReloadIcon width={20} height={20} className="spin" />
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ) : transactions.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    <Text size="2" color="gray" style={{ textAlign: "center", display: "block", padding: "24px" }}>
                      Sin movimientos aún.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                transactions.map((tx) => (
                  <Table.Row key={tx.id}>
                    <Table.Cell>
                      <Text size="2">{formatDate(tx.created_at)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={tx.type === "credit" ? "green" : "red"} size="1">
                        {tx.type === "credit" ? "Crédito" : "Débito"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" weight="bold" color={tx.type === "credit" ? "green" : "red"}>
                        {tx.type === "credit" ? "+" : "-"}
                        {formatBalance(tx.amount_cents)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">{formatBalance(tx.balance_after)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">{tx.reference ?? "—"}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">{tx.notes ?? "—"}</Text>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>

          <Flex justify="end" style={{ marginTop: "16px" }}>
            <Dialog.Close>
              <Button variant="soft" color="gray">Cerrar</Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <WalletOperationDialog
        open={operation !== null}
        onOpenChange={() => setOperation(null)}
        customer={customer}
        operation={operation ?? "credit"}
        onSuccess={handleSuccess}
      />
    </>
  );
}

export function WalletPage() {
  const { customers, loading, isStale, fetchCustomers, search, setSearch } = useCustomersStore();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    return [...result].sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0));
  }, [customers, search]);

  const handleOpenWallet = (customer: Customer) => {
    setSelectedCustomer(customer);
    setWalletOpen(true);
  };

  const totalBalance = customers.reduce((sum, c) => sum + (c.balance ?? 0), 0);

  return (
    <div className="page">
      <Flex direction="column" gap="5">
        <Flex align="center" justify="between" wrap="wrap" gap="3">
          <Flex direction="column" gap="1">
            <Flex align="center" gap="3" wrap="wrap">
              <Text size="5" weight="bold">
                Billetera
              </Text>
              <Badge color="gray" variant="soft" size="2">
                {customers.length} clientes
              </Badge>
              <Badge color="green" variant="soft" size="2">
                Saldo total: {formatBalance(Math.round(totalBalance * 100))}
              </Badge>
              <StaleIndicator isStale={isStale} />
            </Flex>
            <Text size="2" color="gray">
              Gestioná las billeteras de tus clientes: acreditá o debitá saldo y consultá el historial.
            </Text>
          </Flex>
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
          <TextField.Root
            ref={searchInputRef}
            placeholder="Buscar cliente por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "320px" }}
            aria-label="Buscar cliente"
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
              <Table.ColumnHeaderCell>Cliente</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Saldo</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: "right" }}>
                Acciones
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {loading ? (
              <SkeletonRows />
            ) : filteredCustomers.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={4}>
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
                        : "No hay clientes registrados. Creá clientes desde la sección Clientes."}
                    </Text>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredCustomers.map((customer) => (
                <Table.Row key={customer.id}>
                  <Table.Cell>
                    <Flex align="center" gap="2">
                      <PersonIcon width={14} height={14} color="var(--text-muted)" />
                      <Text size="2" weight="bold">
                        {customer.name}
                      </Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">{customer.email ?? "—"}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={(customer.balance ?? 0) > 0 ? "green" : "gray"}
                      size="2"
                    >
                      {formatBalance(Math.round((customer.balance ?? 0) * 100))}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: "right" }}>
                    <Tooltip content="Gestionar billetera">
                      <IconButton
                        size="2"
                        variant="ghost"
                        color="gray"
                        onClick={() => handleOpenWallet(customer)}
                        aria-label={`Billetera de ${customer.name}`}
                      >
                        <PlusIcon width={16} height={16} />
                      </IconButton>
                    </Tooltip>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
        </div>
      </Flex>

      <CustomerWalletDialog
        open={walletOpen}
        onOpenChange={setWalletOpen}
        customer={selectedCustomer}
      />
    </div>
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
                width: "140px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "4px",
              }}
            />
          </Table.Cell>
          <Table.Cell>
            <div
              style={{
                height: "16px",
                width: "180px",
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
          <Table.Cell style={{ textAlign: "right" }}>
            <div
              style={{
                height: "24px",
                width: "40px",
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
