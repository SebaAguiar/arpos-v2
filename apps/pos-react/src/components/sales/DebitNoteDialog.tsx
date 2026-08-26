import { useState } from "react";
import { Text, TextField, Button } from "@radix-ui/themes";
import { Cross2Icon, ReloadIcon } from "@radix-ui/react-icons";
import { useArcaStore } from "@/stores/arca.store";
import type { ApiInvoice } from "@/services/arca.service";

interface DebitNoteDialogProps {
  open: boolean;
  invoice: ApiInvoice | null;
  onClose: () => void;
  onCreated: (invoice: ApiInvoice) => void;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

export function DebitNoteDialog({ open, invoice, onClose, onCreated }: DebitNoteDialogProps) {
  const [reason, setReason] = useState("");
  const [amountCents, setAmountCents] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDebitNote = useArcaStore((s) => s.createDebitNote);

  if (!open || !invoice) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("El motivo es obligatorio");
      return;
    }

    if (!amountCents || isNaN(parseFloat(amountCents)) || parseFloat(amountCents) <= 0) {
      setError("El monto es obligatorio y debe ser mayor a 0");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const amount = Math.round(parseFloat(amountCents) * 100);
      const nd = await createDebitNote({
        invoiceId: invoice.id,
        reason: reason.trim(),
        amountCents: amount,
      });
      onCreated(nd);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear nota de débito";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setAmountCents("");
    setError(null);
    onClose();
  };

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
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: "var(--color-panel-solid)",
          border: "1px solid var(--gray-a6)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: "440px",
          padding: "20px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <Text size="3" weight="bold">Nota de Débito</Text>
          <button
            onClick={handleClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-11)", padding: "4px" }}
          >
            <Cross2Icon width={18} height={18} />
          </button>
        </div>

        {/* Referencia */}
        <div style={{ padding: "10px", backgroundColor: "var(--gray-a2)", borderRadius: "8px", marginBottom: "16px" }}>
          <Text size="2" color="gray">Factura original:</Text>
          <Text size="2" weight="bold" style={{ display: "block" }}>
            {invoice.document_type} N° {invoice.number} — {formatCents(invoice.total_cents)}
          </Text>
          <Text size="2" color="gray" style={{ display: "block" }}>
            Cliente: {invoice.customer_name}
          </Text>
        </div>

        {/* Motivo */}
        <div style={{ marginBottom: "12px" }}>
          <Text size="2" weight="medium" style={{ display: "block", marginBottom: "6px" }}>
            Motivo de la nota de débito *
          </Text>
          <TextField.Root
            placeholder="Ej: Ajuste de precio, Intereses por mora..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Monto */}
        <div style={{ marginBottom: "16px" }}>
          <Text size="2" weight="medium" style={{ display: "block", marginBottom: "6px" }}>
            Monto (en pesos) *
          </Text>
          <TextField.Root
            placeholder="Ej: 1500.00"
            value={amountCents}
            onChange={(e) => setAmountCents(e.target.value)}
            type="number"
            step="0.01"
            min="0.01"
          />
          <Text size="1" color="gray" style={{ display: "block", marginTop: "4px" }}>
            El monto es obligatorio. La nota de débito incrementa el total a pagar.
          </Text>
        </div>

        {error && (
          <div style={{ padding: "8px 12px", backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "6px", marginBottom: "12px" }}>
            <Text size="2" color="red">{error}</Text>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <Button size="2" variant="soft" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button size="2" color="orange" onClick={handleSubmit} disabled={isSubmitting || !reason.trim() || !amountCents}>
            {isSubmitting ? (
              <><ReloadIcon width={12} height={12} style={{ marginRight: "4px", animation: "spin 1s linear infinite" }} /> Creando...</>
            ) : (
              "Crear Nota de Débito"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
