import { useState, useEffect } from "react";
import { Text, TextField, Select, Badge } from "@radix-ui/themes";
import { PersonIcon, PlusIcon, Pencil2Icon, TrashIcon, Cross1Icon, LockClosedIcon, EyeOpenIcon, EyeNoneIcon } from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { useUsersStore } from "@/stores/users.store";
import { StaleIndicator } from "@/components/ui/StaleIndicator";
import { validatePasswordMatch } from "@/lib/validators";
import type { User } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  cashier: "Cajero",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "red",
  manager: "orange",
  cashier: "green",
};

export function UsersManager() {
  const { users, loading, error, isStale, fetchUsers, createUser, updateUser, deleteUser } = useUsersStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "cashier" });
  const [saving, setSaving] = useState(false);
  const [changingPasswordFor, setChangingPasswordFor] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editing) {
        await updateUser(editing.id, {
          email: form.email,
          name: form.name,
          role: form.role,
        });
      } else {
        await createUser(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ email: "", password: "", name: "", role: "cashier" });
    } catch {
      // error handled by store
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditing(user);
    setForm({ email: user.email, password: "", name: user.name, role: user.role });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteUser(id);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ email: "", password: "", name: "", role: "cashier" });
  };

  const handleCancelPassword = () => {
    setChangingPasswordFor(null);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  const handleChangePassword = async () => {
    if (!changingPasswordFor || !newPassword || newPassword !== confirmPassword) return;
    setSavingPassword(true);
    try {
      await updateUser(changingPasswordFor.id, { password: newPassword });
      setChangingPasswordFor(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      // error handled by store
    } finally {
      setSavingPassword(false);
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
          width: "600px",
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
            <PersonIcon width={20} height={20} />
            <Text size="4" weight="bold">Usuarios</Text>
            <StaleIndicator isStale={isStale} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {!showForm && (
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
                <PlusIcon width={14} height={14} /> Nuevo
              </button>
            )}
            <button
              onClick={() => useDialogStore.getState().closeUsers()}
              style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
            >
              <Cross1Icon width={18} height={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
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
                {editing ? "Editar usuario" : "Nuevo usuario"}
              </Text>
              <TextField.Root
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <TextField.Root
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {!editing && (
                <TextField.Root
                  placeholder="Contraseña"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              )}
              <Select.Root value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <Select.Trigger
                  className="select-compact"
                  style={{ minWidth: "140px" }}
                />
                <Select.Content position="popper">
                  <Select.Item value="admin">Administrador</Select.Item>
                  <Select.Item value="manager">Gerente</Select.Item>
                  <Select.Item value="cashier">Cajero</Select.Item>
                </Select.Content>
              </Select.Root>
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
                  disabled={saving || !form.name || !form.email || (!editing && !form.password)}
                  style={{
                    padding: "6px 14px",
                    backgroundColor: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving || !form.name || !form.email || (!editing && !form.password) ? 0.5 : 1,
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

          {/* User list */}
          {loading && users.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Text size="2" color="gray">Cargando usuarios...</Text>
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Text size="2" color="gray">No hay usuarios registrados</Text>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {users.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    backgroundColor: "var(--bg-surface-hover)",
                    borderRadius: "8px",
                    opacity: user.is_active ? 1 : 0.5,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Text size="2" weight="bold">{user.name}</Text>
                      {!user.is_active && <Badge color="gray" size="1">Inactivo</Badge>}
                    </div>
                    <Text size="1" color="gray">{user.email}</Text>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Badge color={ROLE_COLORS[user.role] as "red" | "orange" | "green"} size="1">
                      {ROLE_LABELS[user.role]}
                    </Badge>
                    <button
                      onClick={() => { setChangingPasswordFor(user); setNewPassword(""); }}
                      title="Cambiar contraseña"
                      style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
                    >
                      <LockClosedIcon width={14} height={14} />
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
                    >
                      <Pencil2Icon width={14} height={14} />
                    </button>
                    {user.role !== "admin" && (
                      <button
                        onClick={() => handleDelete(user.id)}
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

          {/* Password change form */}
          {changingPasswordFor && (
            <div
              style={{
                padding: "16px",
                backgroundColor: "var(--bg-surface-hover)",
                borderRadius: "8px",
                marginTop: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <Text size="3" weight="bold" style={{ display: "block", marginBottom: "4px" }}>
                Cambiar contraseña — {changingPasswordFor.name}
              </Text>
              <div style={{ position: "relative" }}>
                <TextField.Root
                  placeholder="Nueva contraseña"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: "36px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeNoneIcon width={14} height={14} /> : <EyeOpenIcon width={14} height={14} />}
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <TextField.Root
                  placeholder="Confirmar contraseña"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleChangePassword(); }}
                  style={{ paddingRight: "36px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeNoneIcon width={14} height={14} /> : <EyeOpenIcon width={14} height={14} />}
                </button>
              </div>
              {newPassword && confirmPassword && !validatePasswordMatch(newPassword, confirmPassword) && (
                <Text size="1" color="red">Las contraseñas no coinciden</Text>
              )}
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button
                  onClick={handleCancelPassword}
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
                  onClick={handleChangePassword}
                  disabled={savingPassword || !newPassword || newPassword !== confirmPassword}
                  style={{
                    padding: "6px 14px",
                    backgroundColor: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: savingPassword ? "not-allowed" : "pointer",
                    opacity: savingPassword || !newPassword || newPassword !== confirmPassword ? 0.5 : 1,
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {savingPassword ? "Guardando..." : "Cambiar contraseña"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
