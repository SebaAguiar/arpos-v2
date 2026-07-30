import { useState } from "react";
import { Text, TextField, Badge } from "@radix-ui/themes";
import {
  Cross1Icon,
  LockClosedIcon,
  PlusCircledIcon,
  MinusCircledIcon,
} from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { useCashRegisterStore } from "@/stores/cash-register.store";

export function CloseRegisterModal() {
  const close = useDialogStore((s) => s.closeCashControl);
  const currentShift = useCashRegisterStore((s) => s.currentShift);
  const loading = useCashRegisterStore((s) => s.loading);
  const closeShift = useCashRegisterStore((s) => s.closeShift);
  const addMovement = useCashRegisterStore((s) => s.addMovement);
  const error = useCashRegisterStore((s) => s.error);
  const clearError = useCashRegisterStore((s) => s.clearError);

  const [closingAmount, setClosingAmount] = useState("");
  const [movementType, setMovementType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDesc, setMovementDesc] = useState("");

  if (!currentShift) {
    close();
    return null;
  }

  const expected =
    currentShift.initialAmount +
    currentShift.totalSales +
    currentShift.totalIncome -
    currentShift.totalExpenses;

  const parsedClosing = parseFloat(closingAmount);
  const diff = !isNaN(parsedClosing) ? parsedClosing - expected : null;

  const handleClose = async () => {
    const value = parseFloat(closingAmount);
    if (isNaN(value) || value < 0) return;
    await closeShift(value);
    setClosingAmount("");
  };

  const handleAddMovement = async () => {
    const value = parseFloat(movementAmount);
    if (isNaN(value) || value <= 0 || !movementDesc.trim()) return;
    await addMovement(movementType, value, movementDesc.trim());
    setMovementAmount("");
    setMovementDesc("");
  };

  const diffColor = diff === null ? "gray" : diff === 0 ? "green" : diff > 0 ? "blue" : "red";

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
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          width: "480px",
          maxHeight: "85vh",
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <LockClosedIcon width={18} height={18} color="var(--accent)" />
            <Text size="4" weight="bold">Cerrar caja</Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Badge color="green" variant="soft" size="1">
              {currentShift.status === "OPEN" ? "Turno abierto" : "Cerrado"}
            </Badge>
            <button
              onClick={close}
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
        </div>

        <div style={{ padding: "20px", overflow: "auto", flex: 1 }}>
          {error && (
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "#e54d2e15",
                border: "1px solid #e54d2e30",
                borderRadius: "6px",
                marginBottom: "12px",
                cursor: "pointer",
              }}
              onClick={clearError}
            >
              <Text size="2" color="red">{error}</Text>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <div style={{ padding: "10px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "6px" }}>
              <Text size="1" color="gray">Monto inicial</Text>
              <Text size="3" weight="bold" style={{ display: "block", marginTop: "2px" }}>
                ${currentShift.initialAmount.toLocaleString("es-AR")}
              </Text>
            </div>
            <div style={{ padding: "10px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "6px" }}>
              <Text size="1" color="gray">Ventas</Text>
              <Text size="3" weight="bold" color="green" style={{ display: "block", marginTop: "2px" }}>
                ${currentShift.totalSales.toLocaleString("es-AR")}
              </Text>
            </div>
            <div style={{ padding: "10px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "6px" }}>
              <Text size="1" color="gray">Ingresos extra</Text>
              <Text size="3" weight="bold" color="green" style={{ display: "block", marginTop: "2px" }}>
                +${currentShift.totalIncome.toLocaleString("es-AR")}
              </Text>
            </div>
            <div style={{ padding: "10px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "6px" }}>
              <Text size="1" color="gray">Egresos</Text>
              <Text size="3" weight="bold" color="red" style={{ display: "block", marginTop: "2px" }}>
                -${currentShift.totalExpenses.toLocaleString("es-AR")}
              </Text>
            </div>
          </div>

          <div
            style={{
              padding: "12px",
              backgroundColor: "var(--bg-surface-hover)",
              borderRadius: "6px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text size="2" color="gray">Monto esperado</Text>
              <Text size="5" weight="bold">${expected.toLocaleString("es-AR")}</Text>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <Text size="2" weight="bold" style={{ display: "block", marginBottom: "6px" }}>
              Monto final en caja
            </Text>
            <TextField.Root
              type="number"
              placeholder="0.00"
              value={closingAmount}
              onChange={(e) => setClosingAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleClose()}
              autoFocus
            />
            {diff !== null && (
              <div style={{ marginTop: "6px" }}>
                <Badge color={diffColor as "green" | "blue" | "red" | "gray"} variant="soft" size="1">
                  {diff === 0
                    ? "Cuadrado"
                    : diff > 0
                      ? `Sobrante: +$${diff.toLocaleString("es-AR")}`
                      : `Faltante: -$${Math.abs(diff).toLocaleString("es-AR")}`}
                </Badge>
              </div>
            )}
          </div>

          <button
            onClick={handleClose}
            disabled={loading || !closingAmount}
            style={{
              width: "100%",
              padding: "10px 20px",
              backgroundColor: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: loading || !closingAmount ? "not-allowed" : "pointer",
              opacity: loading || !closingAmount ? 0.6 : 1,
              fontWeight: 600,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginBottom: "20px",
            }}
          >
            <LockClosedIcon width={16} height={16} />
            {loading ? "Cerrando..." : "Cerrar caja"}
          </button>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
            <Text size="3" weight="bold" style={{ display: "block", marginBottom: "8px" }}>
              Movimientos de efectivo
            </Text>

            <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
              <button
                onClick={() => setMovementType("INCOME")}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "2px solid",
                  borderColor: movementType === "INCOME" ? "#30a46c" : "var(--border)",
                  borderRadius: "6px",
                  backgroundColor: movementType === "INCOME" ? "#30a46c15" : "transparent",
                  color: "#30a46c",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <PlusCircledIcon width={14} height={14} />
                Ingreso
              </button>
              <button
                onClick={() => setMovementType("EXPENSE")}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "2px solid",
                  borderColor: movementType === "EXPENSE" ? "#e54d2e" : "var(--border)",
                  borderRadius: "6px",
                  backgroundColor: movementType === "EXPENSE" ? "#e54d2e15" : "transparent",
                  color: "#e54d2e",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <MinusCircledIcon width={14} height={14} />
                Egreso
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <div style={{ flex: 1 }}>
                <TextField.Root
                  type="number"
                  placeholder="Monto"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                />
              </div>
              <div style={{ flex: 2 }}>
                <TextField.Root
                  placeholder="Descripción"
                  value={movementDesc}
                  onChange={(e) => setMovementDesc(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMovement()}
                />
              </div>
              <button
                onClick={handleAddMovement}
                disabled={loading || !movementAmount || !movementDesc.trim()}
                style={{
                  padding: "0 14px",
                  backgroundColor: movementType === "INCOME" ? "#30a46c" : "#e54d2e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading || !movementAmount || !movementDesc.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !movementAmount || !movementDesc.trim() ? 0.6 : 1,
                  fontWeight: 600,
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                Agregar
              </button>
            </div>

            {currentShift.movements.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {currentShift.movements.map((mov) => (
                  <div
                    key={mov.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      backgroundColor: "var(--bg-surface-hover)",
                      borderRadius: "6px",
                    }}
                  >
                    <div>
                      <Text size="2">{mov.description}</Text>
                      <Text size="1" color="gray" style={{ display: "block" }}>
                        {new Date(mov.createdAt * 1000).toLocaleString("es-AR")}
                      </Text>
                    </div>
                    <Text size="2" weight="bold" color={mov.type === "INCOME" ? "green" : "red"}>
                      {mov.type === "INCOME" ? "+" : "-"}${mov.amount.toLocaleString("es-AR")}
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <Text size="2" color="gray" style={{ textAlign: "center", display: "block", padding: "12px 0" }}>
                Sin movimientos registrados
              </Text>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
