import { useState } from "react";
import { Text, TextField, Badge } from "@radix-ui/themes";
import {
  Cross1Icon,
  PersonIcon,
  CameraIcon,
  IdCardIcon,
  LaptopIcon,
  FileTextIcon,
} from "@radix-ui/react-icons";
import { useCartStore } from "@/stores/cart.store";
import { useDialogStore } from "@/stores/dialog.store";
import type { PaymentMethod, PaymentEntry } from "@/lib/types";

const PAYMENT_METHODS: { method: PaymentMethod; label: string; icon: typeof Cross1Icon; color: string }[] = [
  { method: "CASH", label: "Efectivo", icon: PersonIcon, color: "#30a46c" },
  { method: "DEBIT", label: "Débito", icon: IdCardIcon, color: "#3b82f6" },
  { method: "CREDIT", label: "Crédito", icon: LaptopIcon, color: "#8b5cf6" },
  { method: "QR", label: "QR", icon: CameraIcon, color: "#f59e0b" },
  { method: "WALLET", label: "Billetera", icon: FileTextIcon, color: "#ec4899" },
];

const QUICK_CASH = [1000, 2000, 5000, 10000];

interface PaymentDialogProps {
  creditSurcharge?: number;
}

export function PaymentDialog({ creditSurcharge = 0 }: PaymentDialogProps) {
  const items = useCartStore((s) => s.items);
  const taxRate = useCartStore((s) => s.taxRate);
  const discount = useCartStore((s) => s.discount);
  const discountType = useCartStore((s) => s.discountType);
  const closePayment = useDialogStore((s) => s.closePayment);
  const clearCart = useCartStore((s) => s.clearCart);

  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>("CASH");
  const [currentAmount, setCurrentAmount] = useState("");
  const [email, setEmail] = useState("");

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const taxAmount = subtotal * taxRate;
  const discountAmount =
    discountType === "percentage" ? subtotal * (discount / 100) : discount;
  const baseTotal = subtotal + taxAmount - discountAmount;

  const hasCredit = payments.some((p) => p.method === "CREDIT");
  const surchargeAmount = hasCredit ? baseTotal * (creditSurcharge / 100) : 0;
  const total = baseTotal + surchargeAmount;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, total - totalPaid);
  const change = Math.max(0, totalPaid - total);

  const addPayment = () => {
    const amount = parseFloat(currentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setPayments((prev) => [...prev, { method: activeMethod, amount }]);
    setCurrentAmount("");
  };

  const addQuickCash = (amount: number) => {
    const needed = remaining;
    const toAdd = Math.min(amount, needed);
    if (toAdd > 0) {
      setPayments((prev) => [...prev, { method: "CASH", amount: toAdd }]);
    }
  };

  const removePayment = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (totalPaid < total) return;
    // TODO: create sale via service
    clearCart();
    closePayment();
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
          backgroundColor: "#1a1a1a",
          borderRadius: "12px",
          border: "1px solid #2a2a2a",
          width: "520px",
          maxHeight: "90vh",
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
            borderBottom: "1px solid #2a2a2a",
          }}
        >
          <Text size="4" weight="bold">
            Cobrar
          </Text>
          <button
            onClick={closePayment}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              cursor: "pointer",
            }}
          >
            <Cross1Icon width={18} height={18} />
          </button>
        </div>

        <div style={{ padding: "20px", overflow: "auto", flex: 1 }}>
          {/* Total a pagar */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <Text size="2" color="gray">
              Total a pagar
            </Text>
            <Text
              size="8"
              weight="bold"
              color="orange"
              style={{ display: "block", marginTop: "4px" }}
            >
              ${total.toLocaleString("es-AR")}
            </Text>
          </div>

          {/* Payment methods */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
            {PAYMENT_METHODS.map(({ method, label, icon: Icon, color }) => (
              <button
                key={method}
                onClick={() => setActiveMethod(method)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  border: `1px solid ${activeMethod === method ? color : "#2a2a2a"}`,
                  borderRadius: "6px",
                  backgroundColor: activeMethod === method ? `${color}20` : "transparent",
                  color: activeMethod === method ? color : "#888",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: activeMethod === method ? 600 : 400,
                }}
              >
                <Icon width={14} height={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Amount input */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <TextField.Root
              type="number"
              placeholder="Monto"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPayment()}
              style={{ flex: 1 }}
            />
            <button
              onClick={addPayment}
              style={{
                padding: "8px 16px",
                backgroundColor: "#e54d2e",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Agregar
            </button>
          </div>

          {/* Quick cash buttons */}
          {activeMethod === "CASH" && (
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
              {QUICK_CASH.map((amount) => (
                <button
                  key={amount}
                  onClick={() => addQuickCash(amount)}
                  disabled={remaining <= 0}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    backgroundColor: "transparent",
                    color: remaining > 0 ? "#ededed" : "#555",
                    cursor: remaining > 0 ? "pointer" : "not-allowed",
                    fontSize: "12px",
                  }}
                >
                  ${amount.toLocaleString("es-AR")}
                </button>
              ))}
              {remaining > 0 && (
                <button
                  onClick={() => {
                    setPayments((prev) => [
                      ...prev,
                      { method: "CASH", amount: remaining },
                    ]);
                  }}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #30a46c",
                    borderRadius: "4px",
                    backgroundColor: "#30a46c20",
                    color: "#30a46c",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Exacto
                </button>
              )}
            </div>
          )}

          {/* Payments list */}
          {payments.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <Text size="2" color="gray" style={{ display: "block", marginBottom: "8px" }}>
                Pagos agregados:
              </Text>
              {payments.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    backgroundColor: "#252525",
                    borderRadius: "4px",
                    marginBottom: "4px",
                  }}
                >
                  <Badge color="blue" variant="soft" size="1">
                    {PAYMENT_METHODS.find((m) => m.method === p.method)?.label}
                  </Badge>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Text size="2">${p.amount.toLocaleString("es-AR")}</Text>
                    <button
                      onClick={() => removePayment(i)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#e54d2e",
                        cursor: "pointer",
                      }}
                    >
                      <Cross1Icon width={12} height={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Email receipt */}
          <div style={{ marginBottom: "16px" }}>
            <Text size="2" color="gray" style={{ display: "block", marginBottom: "4px" }}>
              Email para ticket (opcional)
            </Text>
            <TextField.Root
              type="email"
              placeholder="cliente@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #2a2a2a",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text size="3">Pagado</Text>
            <Text size="3" color="green">
              ${totalPaid.toLocaleString("es-AR")}
            </Text>
          </div>

          {surchargeAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text size="2" color="gray">
                Recargo crédito ({creditSurcharge}%)
              </Text>
              <Text size="2" color="gray">
                +${surchargeAmount.toLocaleString("es-AR")}
              </Text>
            </div>
          )}

          {remaining > 0 ? (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text size="3" weight="bold">
                Falta
              </Text>
              <Text size="3" weight="bold" color="red">
                ${remaining.toLocaleString("es-AR")}
              </Text>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text size="3" weight="bold">
                Vuelto
              </Text>
              <Text size="3" weight="bold" color="green">
                ${change.toLocaleString("es-AR")}
              </Text>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={totalPaid < total}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: totalPaid >= total ? "#30a46c" : "#2a2a2a",
              color: totalPaid >= total ? "#fff" : "#888",
              border: "none",
              borderRadius: "6px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: totalPaid >= total ? "pointer" : "not-allowed",
            }}
          >
            Confirmar venta
          </button>
        </div>
      </div>
    </div>
  );
}
