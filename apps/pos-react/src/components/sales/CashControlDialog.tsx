import { useState } from "react";
import { Text, TextField, Badge, Separator, Tabs, Select } from "@radix-ui/themes";
import {
  Cross1Icon,
  LockOpen1Icon,
  LockClosedIcon,
  PlusIcon,
  MinusIcon,
  ArrowRightIcon,
  CalendarIcon,
} from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import {
  useCashRegisterStore,
  selectShiftSummary,
} from "@/stores/cash-register.store";

export function CashControlDialog() {
  const closeCashControl = useDialogStore((s) => s.closeCashControl);
  const currentShift = useCashRegisterStore((s) => s.currentShift);
  const shifts = useCashRegisterStore((s) => s.shifts);
  const openShift = useCashRegisterStore((s) => s.openShift);
  const closeShift = useCashRegisterStore((s) => s.closeShift);
  const addMovement = useCashRegisterStore((s) => s.addMovement);

  const [initialAmount, setInitialAmount] = useState("");
  const [finalAmount, setFinalAmount] = useState("");
  const [movAmount, setMovAmount] = useState("");
  const [movDesc, setMovDesc] = useState("");
  const [movType, setMovType] = useState<"INCOME" | "EXPENSE" | "WALLET_TRANSFER">("INCOME");

  const summary = useCashRegisterStore(selectShiftSummary);

  const handleOpenShift = () => {
    const amount = parseFloat(initialAmount);
    if (isNaN(amount) || amount < 0) return;
    openShift(`Caja ${new Date().toLocaleDateString("es-AR")}`, amount);
    setInitialAmount("");
  };

  const handleCloseShift = () => {
    const amount = parseFloat(finalAmount);
    if (isNaN(amount) || amount < 0) return;
    closeShift(amount);
    setFinalAmount("");
  };

  const handleAddMovement = () => {
    const amount = parseFloat(movAmount);
    if (isNaN(amount) || amount <= 0 || !movDesc.trim()) return;
    addMovement(movType, amount, movDesc.trim());
    setMovAmount("");
    setMovDesc("");
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
          width: "640px",
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
            <Text size="4" weight="bold">Control de Caja</Text>
            {currentShift ? (
              <Badge color="green" variant="soft">Turno abierto</Badge>
            ) : (
              <Badge color="red" variant="soft">Sin turno</Badge>
            )}
          </div>
          <button
            onClick={closeCashControl}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
          >
            <Cross1Icon width={18} height={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <Tabs.Root defaultValue="current">
            <Tabs.List style={{ padding: "0 20px" }}>
              <Tabs.Trigger value="current">Turno actual</Tabs.Trigger>
              <Tabs.Trigger value="history">Historial</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="current" style={{ padding: "16px 20px" }}>
              {!currentShift ? (
                /* Open shift */
                <div>
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#e54d2e10",
                      border: "1px solid #e54d2e30",
                      borderRadius: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <LockClosedIcon width={20} height={20} color="var(--accent)" />
                      <Text size="3" weight="bold" color="red">Caja cerrada</Text>
                    </div>
                    <Text size="2" color="gray">
                      Abra un turno para comenzar a operar. Ingrese el monto inicial en efectivo.
                    </Text>
                  </div>

                  <Text size="2" color="gray" style={{ display: "block", marginBottom: "8px" }}>
                    Monto inicial en caja
                  </Text>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <TextField.Root
                      type="number"
                      placeholder="0.00"
                      value={initialAmount}
                      onChange={(e) => setInitialAmount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleOpenShift()}
                      style={{ flex: 1 }}
                    />
                    <button
                      onClick={handleOpenShift}
                      style={{
                        padding: "8px 24px",
                        backgroundColor: "#30a46c",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <LockOpen1Icon width={14} height={14} />
                      Abrir turno
                    </button>
                  </div>
                </div>
              ) : (
                /* Active shift */
                <div>
                  {/* Summary cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
                    <div style={{ padding: "12px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                      <Text size="1" color="gray">Monto inicial</Text>
                      <Text size="4" weight="bold" style={{ display: "block", marginTop: "4px" }}>
                        ${summary?.initialAmount.toLocaleString("es-AR")}
                      </Text>
                    </div>
                    <div style={{ padding: "12px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                      <Text size="1" color="gray">Ventas</Text>
                      <Text size="4" weight="bold" color="green" style={{ display: "block", marginTop: "4px" }}>
                        ${summary?.totalSales.toLocaleString("es-AR")}
                      </Text>
                    </div>
                    <div style={{ padding: "12px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px" }}>
                      <Text size="1" color="gray">Efectivo esperado</Text>
                      <Text size="4" weight="bold" color="orange" style={{ display: "block", marginTop: "4px" }}>
                        ${summary?.expectedCash.toLocaleString("es-AR")}
                      </Text>
                    </div>
                  </div>

                  {/* Income / Expense summary */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                    <div style={{ padding: "10px", backgroundColor: "#30a46c10", border: "1px solid #30a46c30", borderRadius: "8px" }}>
                      <Text size="1" color="green">Ingresos</Text>
                      <Text size="3" weight="bold" color="green">
                        +${summary?.totalIncome.toLocaleString("es-AR")}
                      </Text>
                    </div>
                    <div style={{ padding: "10px", backgroundColor: "#e54d2e10", border: "1px solid #e54d2e30", borderRadius: "8px" }}>
                      <Text size="1" color="red">Egresos</Text>
                      <Text size="3" weight="bold" color="red">
                        -${summary?.totalExpenses.toLocaleString("es-AR")}
                      </Text>
                    </div>
                  </div>

                  {/* Add movement */}
                  <div style={{ padding: "12px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px", marginBottom: "16px" }}>
                    <Text size="2" weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                      Registrar movimiento
                    </Text>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <Select.Root value={movType} onValueChange={(v) => setMovType(v as typeof movType)}>
                        <Select.Trigger style={{ width: "160px" }} />
                        <Select.Content>
                          <Select.Item value="INCOME">
                            <PlusIcon width={12} /> Ingreso
                          </Select.Item>
                          <Select.Item value="EXPENSE">
                            <MinusIcon width={12} /> Egreso
                          </Select.Item>
                          <Select.Item value="WALLET_TRANSFER">
                            <ArrowRightIcon width={12} /> Transferencia
                          </Select.Item>
                        </Select.Content>
                      </Select.Root>
                      <TextField.Root
                        type="number"
                        placeholder="Monto"
                        value={movAmount}
                        onChange={(e) => setMovAmount(e.target.value)}
                        style={{ width: "120px" }}
                      />
                      <TextField.Root
                        placeholder="Descripción"
                        value={movDesc}
                        onChange={(e) => setMovDesc(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddMovement()}
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={handleAddMovement}
                        disabled={!movDesc.trim() || !movAmount}
                        style={{
                          padding: "6px 14px",
                          backgroundColor: movDesc.trim() && movAmount ? "var(--accent)" : "var(--bg-surface)",
                          color: movDesc.trim() && movAmount ? "#fff" : "var(--text-secondary)",
                          border: "none",
                          borderRadius: "6px",
                          cursor: movDesc.trim() && movAmount ? "pointer" : "not-allowed",
                          fontWeight: 600,
                        }}
                      >
                        Agregar
                      </button>
                    </div>
                  </div>

                  {/* Movements list */}
                  {currentShift.movements.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <Text size="2" weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                        Movimientos del turno ({currentShift.movements.length})
                      </Text>
                      {currentShift.movements.map((mov) => (
                        <div
                          key={mov.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            backgroundColor: "var(--bg-surface-hover)",
                            borderRadius: "4px",
                            marginBottom: "4px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Badge
                              color={mov.type === "INCOME" ? "green" : mov.type === "EXPENSE" ? "red" : "blue"}
                              variant="soft"
                              size="1"
                            >
                              {mov.type === "INCOME" ? "Ingreso" : mov.type === "EXPENSE" ? "Egreso" : "Transferencia"}
                            </Badge>
                            <Text size="2">{mov.description}</Text>
                          </div>
                          <Text
                            size="2"
                            weight="bold"
                            color={mov.type === "INCOME" ? "green" : mov.type === "EXPENSE" ? "red" : "blue"}
                          >
                            {mov.type === "INCOME" ? "+" : "-"}${mov.amount.toLocaleString("es-AR")}
                          </Text>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Close shift */}
                  <Separator style={{ backgroundColor: "var(--border)", marginBottom: "16px" }} />
                  <div>
                    <Text size="2" weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                      Cerrar turno
                    </Text>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <TextField.Root
                        type="number"
                        placeholder="Monto final en caja"
                        value={finalAmount}
                        onChange={(e) => setFinalAmount(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCloseShift()}
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={handleCloseShift}
                        style={{
                          padding: "8px 24px",
                          backgroundColor: "var(--accent)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <LockClosedIcon width={14} height={14} />
                        Cerrar turno
                      </button>
                    </div>
                    {summary?.difference !== null && summary?.difference !== undefined && (
                      <Text size="1" color={summary.difference === 0 ? "green" : "red"} style={{ display: "block", marginTop: "8px" }}>
                        {summary.difference === 0
                          ? "Caja cuadrada"
                          : summary.difference > 0
                          ? `Sobrante: $${summary.difference.toLocaleString("es-AR")}`
                          : `Faltante: $${Math.abs(summary.difference).toLocaleString("es-AR")}`}
                      </Text>
                    )}
                  </div>
                </div>
              )}
            </Tabs.Content>

            <Tabs.Content value="history" style={{ padding: "16px 20px" }}>
              {shifts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <CalendarIcon width={32} height={32} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
                  <Text size="2" color="gray">No hay turnos cerrados</Text>
                </div>
              ) : (
                shifts.map((shift) => {
                  const expected =
                    shift.initialAmount + shift.totalSales + shift.totalIncome - shift.totalExpenses;
                  const diff = shift.finalAmount !== null ? shift.finalAmount - expected : null;
                  return (
                    <div
                      key={shift.id}
                      style={{
                        padding: "12px",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <Text size="2" weight="bold">
                          Turno #{shift.id.replace("shift-", "")}
                        </Text>
                        <Badge color={diff === 0 ? "green" : diff !== null && diff > 0 ? "blue" : "red"} variant="soft" size="1">
                          {diff === 0
                            ? "Cuadrada"
                            : diff !== null
                            ? diff > 0
                              ? `+$${diff.toLocaleString("es-AR")}`
                              : `-$${Math.abs(diff).toLocaleString("es-AR")}`
                            : "Sin arqueo"}
                        </Badge>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {new Date(shift.startTime * 1000).toLocaleString("es-AR")} —{" "}
                        {shift.endTime
                          ? new Date(shift.endTime * 1000).toLocaleString("es-AR")
                          : "En curso"}
                      </div>
                      <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "12px" }}>
                        <span>Inicio: ${shift.initialAmount.toLocaleString("es-AR")}</span>
                        <span style={{ color: "#30a46c" }}>Ventas: ${shift.totalSales.toLocaleString("es-AR")}</span>
                        <span>Movimientos: {shift.movements.length}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
}
