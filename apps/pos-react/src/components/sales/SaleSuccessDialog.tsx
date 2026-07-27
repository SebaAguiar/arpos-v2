import { useEffect, useCallback } from "react";
import { Text } from "@radix-ui/themes";
import { CheckCircledIcon, FileTextIcon, Share1Icon, Cross2Icon, SymbolIcon } from "@radix-ui/react-icons";
import type { Sale, StoreConfig } from "@/lib/types";

interface SaleSuccessDialogProps {
  open: boolean;
  sale: Sale | null;
  change: number;
  email?: string;
  store?: StoreConfig | null;
  onClose: (action: "close" | "print" | "download" | "whatsapp") => void;
}

export function SaleSuccessDialog({
  open,
  sale,
  change,
  email,
  onClose,
}: SaleSuccessDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose("close");
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open || !sale) return null;

  const ticketNum = sale.ticketNumber || 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
      onClick={() => onClose("close")}
    >
      <div
        style={{
          backgroundColor: "var(--color-panel-solid)",
          border: "1px solid var(--gray-a6)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: "420px",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--gray-a3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--gray-a2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "rgba(45, 180, 100, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircledIcon width={22} height={22} style={{ color: "#2db464" }} />
            </div>
            <div>
              <Text
                size="1"
                color="gray"
                style={{ display: "block", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}
              >
                Ticket #{ticketNum}
              </Text>
              <Text size="4" weight="bold" style={{ display: "block" }}>
                Venta Procesada
              </Text>
            </div>
          </div>
          <button
            onClick={() => onClose("close")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--gray-11)",
              padding: "4px",
            }}
          >
            <Cross2Icon width={18} height={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          {change > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "24px",
                backgroundColor: "var(--gray-a2)",
                borderRadius: "12px",
                border: "1px solid var(--gray-a4)",
              }}
            >
              <Text
                size="1"
                color="gray"
                style={{ display: "block", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "8px" }}
              >
                Vuelto a entregar
              </Text>
              <Text size="8" weight="bold" style={{ color: "#2db464", fontFamily: "monospace" }}>
                ${change.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </Text>
              <Text size="1" color="gray" style={{ marginTop: "8px", fontFamily: "monospace" }}>
                CONFIRME LA ENTREGA DE EFECTIVO
              </Text>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "24px 0",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "var(--gray-a2)",
                  border: "1px solid var(--gray-a4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircledIcon width={32} height={32} style={{ color: "rgba(45, 180, 100, 0.5)" }} />
              </div>
              <Text size="2" color="gray" style={{ textAlign: "center", maxWidth: "260px", lineHeight: 1.5 }}>
                El cobro se ha registrado correctamente y el inventario ha sido actualizado.
              </Text>
            </div>
          )}

          {email && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                marginTop: "16px",
                backgroundColor: "var(--gray-a2)",
                borderRadius: "12px",
                border: "1px solid var(--gray-a4)",
              }}
            >
              <div style={{ fontSize: "18px" }}>✉</div>
              <div style={{ overflow: "hidden" }}>
                <Text size="1" color="gray" style={{ display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Recibo enviado por Email
                </Text>
                <Text size="2" weight="bold" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {email}
                </Text>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid var(--gray-a3)",
            backgroundColor: "var(--gray-a2)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Primary: Nueva Venta */}
          <button
            onClick={() => onClose("close")}
            style={{
              width: "100%",
              height: "44px",
              backgroundColor: "rgba(45, 180, 100, 0.1)",
              border: "1px solid rgba(45, 180, 100, 0.25)",
              borderRadius: "12px",
              color: "#2db464",
              fontWeight: 700,
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <CheckCircledIcon width={18} height={18} />
            Nueva Venta (Esc)
          </button>

          {/* Secondary actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "4px" }}>
            <button
              onClick={() => onClose("download")}
              style={{
                height: "40px",
                backgroundColor: "var(--color-panel-solid)",
                border: "1px solid var(--gray-a5)",
                borderRadius: "12px",
                color: "#8b5cf6",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <FileTextIcon width={15} height={15} />
              PDF
            </button>

            <button
              onClick={() => onClose("print")}
              style={{
                height: "40px",
                backgroundColor: "var(--color-panel-solid)",
                border: "1px solid var(--gray-a5)",
                borderRadius: "12px",
                color: "#3b82f6",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <SymbolIcon width={15} height={15} />
              Imprimir
            </button>

            <button
              onClick={() => onClose("whatsapp")}
              style={{
                height: "40px",
                backgroundColor: "var(--color-panel-solid)",
                border: "1px solid var(--gray-a5)",
                borderRadius: "12px",
                color: "#25D366",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Share1Icon width={15} height={15} />
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
