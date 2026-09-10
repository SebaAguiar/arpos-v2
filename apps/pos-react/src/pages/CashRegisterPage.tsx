import { useEffect } from "react";
import { Text, Badge } from "@radix-ui/themes";
import { CalendarIcon } from "@radix-ui/react-icons";
import { useCashRegisterStore } from "@/stores/cash-register.store";
import { calcExpectedBalance } from "@/lib/cash-register";
import { ListEmptyState } from "@/components/ui/ListEmptyState";

export function CashRegisterPage() {
  const shifts = useCashRegisterStore((s) => s.shifts);
  const fetchHistory = useCashRegisterStore((s) => s.fetchHistory);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="page" style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <CalendarIcon width={20} height={20} />
        <Text size="5" weight="bold">Historial de Caja</Text>
        <Badge color="gray" variant="soft" size="1">{shifts.length} turnos</Badge>
      </div>

      {shifts.length === 0 ? (
        <ListEmptyState
          title="No hay turnos cerrados"
          message="Los turnos cerrados aparecerán aquí"
          icon={CalendarIcon}
        />
      ) : (
        shifts.map((shift) => {
          const expected = calcExpectedBalance(
            shift.initialAmount,
            shift.totalSales,
            shift.totalIncome,
            shift.totalExpenses,
          );
          const diff = shift.finalAmount !== null ? shift.finalAmount - expected : null;
          return (
            <div
              key={shift.id}
              style={{
                padding: "14px 16px",
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
    </div>
  );
}
