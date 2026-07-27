import { useState, useEffect } from "react";
import { Text, TextField, Badge } from "@radix-ui/themes";
import {
  Cross1Icon,
  LockOpen1Icon,
  LockClosedIcon,
} from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { useCashRegisterStore } from "@/stores/cash-register.store";

export function CashShiftDialog() {
  const closeCashControl = useDialogStore((s) => s.closeCashControl);
  const currentShift = useCashRegisterStore((s) => s.currentShift);
  const loading = useCashRegisterStore((s) => s.loading);
  const openShift = useCashRegisterStore((s) => s.openShift);
  const closeShift = useCashRegisterStore((s) => s.closeShift);
  const error = useCashRegisterStore((s) => s.error);
  const clearError = useCashRegisterStore((s) => s.clearError);
  const fetchCurrentShift = useCashRegisterStore((s) => s.fetchCurrentShift);

  useEffect(() => {
    fetchCurrentShift();
  }, [fetchCurrentShift]);

  const [amount, setAmount] = useState("");

  const handleOpen = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value < 0) return;
    await openShift(`Caja ${new Date().toLocaleDateString("es-AR")}`, value);
    setAmount("");
  };

  const handleClose = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value < 0) return;
    await closeShift(value);
    setAmount("");
  };

  const isOpen = currentShift !== null;

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
        if (e.target === e.currentTarget) closeCashControl();
      }}
    >
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          width: "400px",
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
            {isOpen ? (
              <LockOpen1Icon width={18} height={18} color="#30a46c" />
            ) : (
              <LockClosedIcon width={18} height={18} color="var(--accent)" />
            )}
            <Text size="4" weight="bold">
              {isOpen ? "Cerrar caja" : "Abrir caja"}
            </Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Badge color={isOpen ? "green" : "red"} variant="soft" size="1">
              {isOpen ? "Turno abierto" : "Sin turno"}
            </Badge>
            <button
              onClick={closeCashControl}
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

        {/* Content */}
        <div style={{ padding: "20px" }}>
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

          {!isOpen ? (
            /* Abrir caja */
            <div>
              <Text size="2" color="gray" style={{ display: "block", marginBottom: "12px" }}>
                Ingrese el monto inicial en efectivo para comenzar a operar.
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <Text size="2" weight="bold" style={{ display: "block", marginBottom: "6px" }}>
                    Monto inicial
                  </Text>
                  <TextField.Root
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleOpen()}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleOpen}
                  disabled={loading || !amount}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#30a46c",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: loading || !amount ? "not-allowed" : "pointer",
                    opacity: loading || !amount ? 0.6 : 1,
                    fontWeight: 600,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <LockOpen1Icon width={16} height={16} />
                  {loading ? "Abriendo..." : "Abrir caja"}
                </button>
              </div>
            </div>
          ) : (
            /* Cerrar caja */
            <div>
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
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <Text size="2" weight="bold" style={{ display: "block", marginBottom: "6px" }}>
                    Monto final en caja
                  </Text>
                  <TextField.Root
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleClose()}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleClose}
                  disabled={loading || !amount}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "var(--accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: loading || !amount ? "not-allowed" : "pointer",
                    opacity: loading || !amount ? 0.6 : 1,
                    fontWeight: 600,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <LockClosedIcon width={16} height={16} />
                  {loading ? "Cerrando..." : "Cerrar caja"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
