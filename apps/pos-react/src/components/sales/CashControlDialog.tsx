import { useState, useEffect, useMemo } from "react";
import { Text, TextField, Badge, Separator, Tabs, Select } from "@radix-ui/themes";
import {
  Cross1Icon,
  LockOpen1Icon,
  LockClosedIcon,
  PlusIcon,
  MinusIcon,
  CalendarIcon,
  CardStackIcon,
} from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";
import { useCashRegisterStore } from "@/stores/cash-register.store";

export function CashControlDialog() {
  const closeCashControl = useDialogStore((s) => s.closeCashControl);
  const currentShift = useCashRegisterStore((s) => s.currentShift);
  const shifts = useCashRegisterStore((s) => s.shifts);
  const loading = useCashRegisterStore((s) => s.loading);
  const openShift = useCashRegisterStore((s) => s.openShift);
  const closeShift = useCashRegisterStore((s) => s.closeShift);
  const addMovement = useCashRegisterStore((s) => s.addMovement);
  const error = useCashRegisterStore((s) => s.error);
  const clearError = useCashRegisterStore((s) => s.clearError);
  const fetchCurrentShift = useCashRegisterStore((s) => s.fetchCurrentShift);
  const fetchHistory = useCashRegisterStore((s) => s.fetchHistory);

  useEffect(() => {
    fetchCurrentShift();
    fetchHistory();
  }, [fetchCurrentShift, fetchHistory]);

  const [initialAmount, setInitialAmount] = useState("");
  const [finalAmount, setFinalAmount] = useState("");
  const [movAmount, setMovAmount] = useState("");
  const [movDesc, setMovDesc] = useState("");
  const [movType, setMovType] = useState<"INCOME" | "EXPENSE">("INCOME");

  const summary = useMemo(() => {
    if (!currentShift) return null;
    const expectedCash =
      currentShift.initialAmount + currentShift.totalSales + currentShift.totalIncome - currentShift.totalExpenses;
    return {
      ...currentShift,
      expectedCash,
      difference:
        currentShift.finalAmount !== null ? currentShift.finalAmount - expectedCash : null,
    };
  }, [currentShift]);

  const handleOpenShift = async () => {
    const amount = parseFloat(initialAmount);
    if (isNaN(amount) || amount < 0) return;
    await openShift(`Caja ${new Date().toLocaleDateString("es-AR")}`, amount);
    setInitialAmount("");
  };

  const handleCloseShift = async () => {
    const amount = parseFloat(finalAmount);
    if (isNaN(amount) || amount < 0) return;
    await closeShift(amount);
    setFinalAmount("");
    fetchHistory();
  };

  const handleAddMovement = async () => {
    const amount = parseFloat(movAmount);
    if (isNaN(amount) || amount <= 0 || !movDesc.trim()) return;
    await addMovement(movType, amount, movDesc.trim());
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
            style={{ backgroundColor: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
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
                  {error && (
                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#e54d2e15",
                        border: "1px solid #e54d2e30",
                        borderRadius: "6px",
                        marginBottom: "8px",
                        cursor: "pointer",
                      }}
                      onClick={clearError}
                    >
                      <Text size="2" color="red">{error}</Text>
                    </div>
                  )}
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
                      disabled={loading || !initialAmount}
                      style={{
                        padding: "8px 24px",
                        backgroundColor: "#30a46c",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: loading || !initialAmount ? "not-allowed" : "pointer",
                        opacity: loading || !initialAmount ? 0.6 : 1,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <LockOpen1Icon width={14} height={14} />
                      {loading ? "Abriendo..." : "Abrir turno"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Active shift */
                <div>
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

                  {/* Payment method breakdown */}
                  {currentShift.paymentSummary.length > 0 && (
                    <div style={{ padding: "12px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px", marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                        <CardStackIcon width={14} height={14} style={{ color: "var(--text-secondary)" }} />
                        <Text size="2" weight="bold">Ventas por método de pago</Text>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
                        {currentShift.paymentSummary.map((entry) => (
                          <div
                            key={entry.payment_method}
                            style={{
                              padding: "10px",
                              backgroundColor: "var(--bg-surface)",
                              borderRadius: "6px",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <Text size="1" color="gray" style={{ display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              {entry.payment_method}
                            </Text>
                            <Text size="3" weight="bold" style={{ display: "block", marginTop: "4px" }}>
                              ${(entry.total_cents / 100).toLocaleString("es-AR")}
                            </Text>
                            <Text size="1" color="gray" style={{ display: "block", marginTop: "2px" }}>
                              {entry.count} venta{entry.count !== 1 ? "s" : ""}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add movement */}
                  <div style={{ padding: "12px", backgroundColor: "var(--bg-surface-hover)", borderRadius: "8px", marginBottom: "16px" }}>
                    <Text size="2" weight="bold" style={{ display: "block", marginBottom: "8px" }}>
                      Registrar movimiento
                    </Text>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <Select.Root value={movType} onValueChange={(v) => setMovType(v as typeof movType)}>
                        <Select.Trigger style={{ width: "160px" }} />
                        <Select.Content position="popper">
                          <Select.Item value="INCOME">
                            <PlusIcon width={12} /> Ingreso
                          </Select.Item>
                          <Select.Item value="EXPENSE">
                            <MinusIcon width={12} /> Egreso
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
                        disabled={loading || !movDesc.trim() || !movAmount}
                        style={{
                          padding: "6px 14px",
                          backgroundColor: !loading && movDesc.trim() && movAmount ? "var(--accent)" : "var(--bg-surface)",
                          color: !loading && movDesc.trim() && movAmount ? "#fff" : "var(--text-secondary)",
                          border: "none",
                          borderRadius: "6px",
                          cursor: loading || !movDesc.trim() || !movAmount ? "not-allowed" : "pointer",
                          fontWeight: 600,
                        }}
                      >
                        {loading ? "..." : "Agregar"}
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
                              color={mov.type === "INCOME" ? "green" : "red"}
                              variant="soft"
                              size="1"
                            >
                              {mov.type === "INCOME" ? "Ingreso" : "Egreso"}
                            </Badge>
                            <Text size="2">{mov.description}</Text>
                          </div>
                          <Text
                            size="2"
                            weight="bold"
                            color={mov.type === "INCOME" ? "green" : "red"}
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
                        disabled={loading || !finalAmount}
                        style={{
                          padding: "8px 24px",
                          backgroundColor: "var(--accent)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: loading || !finalAmount ? "not-allowed" : "pointer",
                          opacity: loading || !finalAmount ? 0.6 : 1,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <LockClosedIcon width={14} height={14} />
                        {loading ? "Cerrando..." : "Cerrar turno"}
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
                          Turno #{shift.id.slice(0, 8)}
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
                        <span>Movimientos: {shift.movementCount}</span>
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
