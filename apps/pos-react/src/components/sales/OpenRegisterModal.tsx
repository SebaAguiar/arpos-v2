import { useState } from "react";
import { Text, TextField } from "@radix-ui/themes";
import { LockOpen1Icon } from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { useCashRegisterStore } from "@/stores/cash-register.store";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { DialogHeader } from "@/components/ui/DialogHeader";

export function OpenRegisterModal() {
  const close = useDialogStore((s) => s.closeCashControl);
  const loading = useCashRegisterStore((s) => s.loading);
  const openShift = useCashRegisterStore((s) => s.openShift);
  const error = useCashRegisterStore((s) => s.error);
  const clearError = useCashRegisterStore((s) => s.clearError);

  const [amount, setAmount] = useState("");

  const handleOpen = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value < 0) return;
    await openShift(`Caja ${new Date().toLocaleDateString("es-AR")}`, value);
    setAmount("");
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
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          width: "400px",
          overflow: "hidden",
        }}
      >
        <DialogHeader
          icon={<LockOpen1Icon width={18} height={18} color="#30a46c" />}
          title="Abrir caja"
          onClose={close}
        />

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

          <Text size="2" color="gray" style={{ display: "block", marginBottom: "12px" }}>
            Ingrese el monto inicial en efectivo para comenzar a operar.
          </Text>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <FieldLabel>
                Monto inicial
              </FieldLabel>
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
      </div>
    </div>
  );
}
