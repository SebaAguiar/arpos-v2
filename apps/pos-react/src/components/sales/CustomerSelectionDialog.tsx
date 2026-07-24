import { useState, useEffect, useCallback } from "react";
import { Text, TextField } from "@radix-ui/themes";
import { Cross1Icon, MagnifyingGlassIcon, PlusIcon } from "@radix-ui/react-icons";
import { useCartStore } from "@/stores/cart.store";
import { useDialogStore } from "@/stores/dialog.store";
import { ContactsRepository } from "@/repositories/contacts.repository";
import type { Customer } from "@/lib/types";

export function CustomerSelectionDialog() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const closeCustomerSelection = useDialogStore((s) => s.closeCustomerSelection);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ContactsRepository.getAll("customer");
      setCustomers(data);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const created = await ContactsRepository.create({
        name: newName.trim(),
        email: newEmail.trim() || undefined,
        phone: newPhone.trim() || undefined,
      });
      setCustomers((prev) => [...prev, created]);
      setCustomer(created.id, created.name);
      closeCustomerSelection();
    } catch {
      setCreating(false);
    }
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

          {loading ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <Text size="2" color="gray">Cargando clientes...</Text>
            </div>
          ) : (
            filtered.map((customer) => (
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
            ))
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <Text size="2" color="gray">
                No se encontraron clientes
              </Text>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
          {showCreateForm ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <TextField.Root
                placeholder="Nombre *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <TextField.Root
                placeholder="Email (opcional)"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <TextField.Root
                placeholder="Teléfono (opcional)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewName("");
                    setNewEmail("");
                    setNewPhone("");
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    backgroundColor: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: newName.trim() && !creating ? "var(--accent)" : "var(--bg-surface)",
                    color: newName.trim() && !creating ? "#fff" : "var(--text-secondary)",
                    cursor: newName.trim() && !creating ? "pointer" : "not-allowed",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {creating ? "Creando..." : "Crear"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
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
          )}
        </div>
      </div>
    </div>
  );
}
