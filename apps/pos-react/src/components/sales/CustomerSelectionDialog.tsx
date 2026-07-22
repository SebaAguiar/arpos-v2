import { useState } from "react";
import { Text, TextField } from "@radix-ui/themes";
import { Cross1Icon, MagnifyingGlassIcon, PlusIcon } from "@radix-ui/react-icons";
import { useCartStore } from "@/stores/cart.store";
import { useDialogStore } from "@/stores/dialog.store";
import type { Customer } from "@/lib/types";

const mockCustomers: Customer[] = [
  { id: "1", name: "Consumidor Final", email: "", phone: "" },
  { id: "2", name: "Juan Pérez", email: "juan@mail.com", phone: "+54 11 1234-5678" },
  { id: "3", name: "María López", email: "maria@mail.com", phone: "+54 11 8765-4321" },
];

export function CustomerSelectionDialog() {
  const [search, setSearch] = useState("");
  const [customers] = useState<Customer[]>(mockCustomers);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const closeCustomerSelection = useDialogStore((s) => s.closeCustomerSelection);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  const handleSelect = (customer: Customer) => {
    setCustomer(customer.id, customer.name);
    closeCustomerSelection();
  };

  const handleClear = () => {
    setCustomer(null, null);
    closeCustomerSelection();
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
          width: "440px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Text size="4" weight="bold">
            Seleccionar cliente
          </Text>
          <button
            onClick={closeCustomerSelection}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <Cross1Icon width={18} height={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 20px" }}>
          <TextField.Root
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon height={16} width={16} />
            </TextField.Slot>
          </TextField.Root>
        </div>

        {/* Customer list */}
        <div style={{ flex: 1, overflow: "auto", padding: "0 20px" }}>
          <button
            onClick={handleClear}
            style={{
              width: "100%",
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              marginBottom: "6px",
              textAlign: "left",
              fontSize: "13px",
            }}
          >
            Sin cliente (Consumidor Final)
          </button>

          {filtered.map((customer) => (
            <button
              key={customer.id}
              onClick={() => handleSelect(customer)}
              style={{
                width: "100%",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                backgroundColor: "transparent",
                color: "var(--text-primary)",
                cursor: "pointer",
                marginBottom: "6px",
                textAlign: "left",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 500 }}>
                  {customer.name}
                </div>
                {customer.email && (
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {customer.email}
                  </div>
                )}
              </div>
              {customer.phone && (
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  {customer.phone}
                </span>
              )}
            </button>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <Text size="2" color="gray">
                No se encontraron clientes
              </Text>
            </div>
          )}
        </div>

        {/* Create new */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
          <button
            style={{
              width: "100%",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              border: "1px dashed var(--border)",
              borderRadius: "6px",
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            <PlusIcon width={14} height={14} />
            Crear nuevo cliente
          </button>
        </div>
      </div>
    </div>
  );
}
