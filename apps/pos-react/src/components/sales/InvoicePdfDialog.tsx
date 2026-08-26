import { Text, Button, ScrollArea } from "@radix-ui/themes";
import { Cross2Icon, ExternalLinkIcon, DownloadIcon } from "@radix-ui/react-icons";
import type { ApiInvoice } from "@/services/arca.service";

interface InvoicePdfDialogProps {
  open: boolean;
  invoice: ApiInvoice | null;
  onClose: () => void;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InvoicePdfDialog({ open, invoice, onClose }: InvoicePdfDialogProps) {
  if (!open || !invoice) return null;

  const typeLabel =
    invoice.type === "credit_note"
      ? "NOTA DE CREDITO"
      : invoice.type === "debit_note"
        ? "NOTA DE DEBITO"
        : "FACTURA";
  const title = `${typeLabel} ${invoice.document_type}`;

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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--color-panel-solid)",
          border: "1px solid var(--gray-a6)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--gray-a3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--gray-a2)",
          }}
        >
          <div>
            <Text size="3" weight="bold">{title}</Text>
            {invoice.number && (
              <Text size="1" color="gray" style={{ display: "block" }}>
                N° {String(invoice.point_of_sale ?? "").padStart(4, "0")}-{invoice.number}
              </Text>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-11)", padding: "4px" }}
          >
            <Cross2Icon width={18} height={18} />
          </button>
        </div>

        <ScrollArea style={{ flex: 1, padding: "20px" }}>
          {/* Cliente */}
          <div style={{ marginBottom: "16px" }}>
            <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px", display: "block" }}>
              Cliente
            </Text>
            <div style={{ display: "grid", gap: "4px" }}>
              <Text size="2"><strong>Nombre:</strong> {invoice.customer_name}</Text>
              <Text size="2"><strong>CUIT/DNI:</strong> {invoice.customer_tax_id}</Text>
              {invoice.customer_address && (
                <Text size="2"><strong>Domicilio:</strong> {invoice.customer_address}</Text>
              )}
              {invoice.customer_email && (
                <Text size="2"><strong>Email:</strong> {invoice.customer_email}</Text>
              )}
            </div>
          </div>

          {/* Montos */}
          <div style={{ marginBottom: "16px" }}>
            <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px", display: "block" }}>
              Montos
            </Text>
            <div style={{ display: "grid", gap: "4px" }}>
              <Text size="2"><strong>Neto:</strong> {formatCents(invoice.net_amount_cents)}</Text>
              <Text size="2"><strong>IVA (21%):</strong> {formatCents(invoice.tax_amount_cents)}</Text>
              <div style={{ borderTop: "1px solid var(--gray-a4)", paddingTop: "4px", marginTop: "2px" }}>
                <Text size="3" weight="bold"><strong>Total:</strong> {formatCents(invoice.total_cents)}</Text>
              </div>
            </div>
          </div>

          {/* CAE */}
          {invoice.cae && (
            <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "rgba(45, 180, 100, 0.06)", border: "1px solid rgba(45, 180, 100, 0.15)", borderRadius: "8px" }}>
              <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px", display: "block" }}>
                Comprobante Autorizado
              </Text>
              <div style={{ display: "grid", gap: "4px" }}>
                <Text size="2"><strong>CAE:</strong> {invoice.cae}</Text>
                {invoice.cae_expiration && (
                  <Text size="2"><strong>Vto. CAE:</strong> {invoice.cae_expiration}</Text>
                )}
                <Text size="2"><strong>Punto de venta:</strong> {invoice.point_of_sale}</Text>
              </div>
            </div>
          )}

          {/* Fechas */}
          <div style={{ marginBottom: "16px" }}>
            <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px", display: "block" }}>
              Fechas
            </Text>
            <div style={{ display: "grid", gap: "4px" }}>
              <Text size="2"><strong>Creado:</strong> {formatDate(invoice.created_at)}</Text>
              {invoice.issued_at && (
                <Text size="2"><strong>Emitido:</strong> {formatDate(invoice.issued_at)}</Text>
              )}
            </div>
          </div>

          {invoice.error_message && (
            <div style={{ padding: "12px", backgroundColor: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "8px" }}>
              <Text size="2" color="red">{invoice.error_message}</Text>
            </div>
          )}
        </ScrollArea>

        {/* Footer actions */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--gray-a3)", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <Button size="2" variant="soft" onClick={onClose}>
            Cerrar
          </Button>
          {invoice.status === "issued" && (
            <>
              <Button
                size="2"
                variant="soft"
                color="green"
                onClick={() => {
                  const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
                  window.open(`${baseUrl}/invoices/${invoice.id}/pdf`, "_blank");
                }}
              >
                <ExternalLinkIcon width={14} height={14} style={{ marginRight: "4px" }} />
                Ver PDF
              </Button>
              <Button
                size="2"
                color="green"
                onClick={() => {
                  const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
                  window.open(`${baseUrl}/invoices/${invoice.id}/pdf`, "_blank");
                }}
              >
                <DownloadIcon width={14} height={14} style={{ marginRight: "4px" }} />
                Descargar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
