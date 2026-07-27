import { useState, useEffect } from "react";
import { Text, TextField, Badge } from "@radix-ui/themes";
import { HomeIcon, PlusIcon, Pencil2Icon, TrashIcon, Cross1Icon } from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { useStoresStore } from "@/stores/stores.store";
import { StaleIndicator } from "@/components/ui/StaleIndicator";
import type { Store } from "@/lib/types";

export function StoreManager() {
  const { stores, storeCount, loading, error, isStale, canAddStore, fetchStores, createStore, updateStore, deleteStore } =
    useStoresStore();
  const closeStores = useDialogStore((s) => s.closeStores);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editing) {
        await updateStore(editing.id, form);
      } else {
        await createStore(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", address: "", phone: "" });
    } catch {
      // error handled by store
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (store: Store) => {
    setEditing(store);
    setForm({ name: store.name, address: store.address ?? "", phone: store.phone ?? "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteStore(id);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", address: "", phone: "" });
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
          width: "550px",
          maxHeight: "85vh",
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <HomeIcon width={20} height={20} />
            <Text size="4" weight="bold">Sucursales</Text>
            <StaleIndicator isStale={isStale} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {!showForm && canAddStore && (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  backgroundColor: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                <PlusIcon width={14} height={14} /> Nueva
              </button>
            )}
            <button
              onClick={closeStores}
              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
            >
              <Cross1Icon width={18} height={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {!canAddStore && storeCount >= 1 && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "var(--color-warning-subtle)",
                borderRadius: "6px",
                marginBottom: "16px",
              }}
            >
              <Text size="2" color="orange">
                Modo local: solo 1 sucursal permitida. Suscribite al plan multi-sucursal para agregar más.
              </Text>
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div
              style={{
                padding: "16px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "8px",
                marginBottom: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <Text size="3" weight="bold" style={{ display: "block", marginBottom: "4px" }}>
                {editing ? "Editar sucursal" : "Nueva sucursal"}
              </Text>
              <TextField.Root
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <TextField.Root
                placeholder="Dirección"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <TextField.Root
                placeholder="Teléfono"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: "6px 14px",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || !form.name}
                  style={{
                    padding: "6px 14px",
                    backgroundColor: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving || !form.name ? 0.5 : 1,
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: "10px 14px", backgroundColor: "var(--color-danger-subtle)", borderRadius: "6px", marginBottom: "12px" }}>
              <Text size="2" color="red">{error}</Text>
            </div>
          )}

          {/* Store list */}
          {loading && stores.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Text size="2" color="gray">Cargando sucursales...</Text>
            </div>
          ) : stores.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Text size="2" color="gray">No hay sucursales registradas</Text>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {stores.map((store) => (
                <div
                  key={store.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    backgroundColor: "var(--bg-surface-hover)",
                    borderRadius: "8px",
                    opacity: store.is_active ? 1 : 0.5,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Text size="2" weight="bold">{store.name}</Text>
                      {!store.is_active && <Badge color="gray" size="1">Inactiva</Badge>}
                    </div>
                    {store.address && <Text size="1" color="gray">{store.address}</Text>}
                    {store.phone && <Text size="1" color="gray">{store.phone}</Text>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => handleEdit(store)}
                      style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
                    >
                      <Pencil2Icon width={14} height={14} />
                    </button>
                    {storeCount > 1 && (
                      <button
                        onClick={() => handleDelete(store.id)}
                        style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", padding: "4px" }}
                      >
                        <TrashIcon width={14} height={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
