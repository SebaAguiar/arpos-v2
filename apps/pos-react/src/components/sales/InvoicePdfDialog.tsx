import { useEffect, useState } from "react";
import { Text, Button, ScrollArea } from "@radix-ui/themes";
import { Cross2Icon, ExternalLinkIcon, DownloadIcon } from "@radix-ui/react-icons";
import type { ApiInvoice } from "@/services/arca.service";
import { apiClient } from "@/services/api-client";

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
  const [pdfHtml, setPdfHtml] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [qrState, setQrState] = useState<{ invoiceId: string; data: string } | null>(null);

  useEffect(() => {
    if (open && invoice && invoice.status === "issued") {
      void apiClient
        .getText(`/invoices/${invoice.id}/qr`)
        .then((qr) => setQrState({ invoiceId: invoice.id, data: qr }))
        .catch(() => setQrState(null));
    }
  }, [open, invoice]);

  if (!open || !invoice) return null;

  const qrDataUrl = qrState?.invoiceId === invoice.id ? qrState.data : null;

  const typeLabel =
    invoice.type === "credit_note"
      ? "NOTA DE CREDITO"
      : invoice.type === "debit_note"
        ? "NOTA DE DEBITO"
        : "FACTURA";
  const title = `${typeLabel} ${invoice.document_type}`;

  const loadPdfHtml = async (): Promise<string> => {
    const html = await apiClient.getText(`/invoices/${invoice.id}/pdf`);
    if (!html) throw new Error("El servidor no devolvió el comprobante");
    return html;
  };

  const handleViewPdf = async () => {
    try {
      setPdfError(null);
      setPdfLoading(true);
      const html = await loadPdfHtml();
      setPdfHtml(html);
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : String(error));
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setPdfError(null);
      setPdfLoading(true);
      const html = await loadPdfHtml();

      const html2pdf = (await import("html2pdf.js")).default;
      const container = document.createElement("div");
      container.innerHTML = html;
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      const pos = String(invoice.point_of_sale ?? "").padStart(4, "0");
      const num = invoice.number ?? invoice.id.slice(-8);

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `comprobante-${pos}-${num}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        })
        .from(container)
        .save();

      document.body.removeChild(container);
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : String(error));
    } finally {
      setPdfLoading(false);
    }
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--color-panel-solid)",
          border: "1px solid var(--gray-a6)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: pdfHtml ? "720px" : "500px",
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
            <Text size="3" weight="bold">{pdfHtml ? "Vista del comprobante" : title}</Text>
            {invoice.number && (
              <Text size="1" color="gray" style={{ display: "block" }}>
                N° {String(invoice.point_of_sale ?? "").padStart(4, "0")}-{invoice.number}
              </Text>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {pdfHtml && (
              <Button
                size="1"
                variant="soft"
                onClick={() => {
                  setPdfHtml(null);
                  setPdfError(null);
                }}
              >
                Volver
              </Button>
            )}
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-11)", padding: "4px" }}
            >
              <Cross2Icon width={18} height={18} />
            </button>
          </div>
        </div>

        {pdfHtml ? (
          <iframe
            title="Comprobante fiscal"
            srcDoc={pdfHtml}
            style={{ flex: 1, width: "100%", minHeight: "480px", border: "none" }}
          />
        ) : (
          <>
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

          {/* CAE + QR */}
          {invoice.cae && (
            <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "rgba(45, 180, 100, 0.06)", border: "1px solid rgba(45, 180, 100, 0.15)", borderRadius: "8px" }}>
              <Text size="1" color="gray" style={{ textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px", display: "block" }}>
                Comprobante Autorizado
              </Text>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div style={{ display: "grid", gap: "4px" }}>
                  <Text size="2"><strong>CAE:</strong> {invoice.cae}</Text>
                  {invoice.cae_expiration && (
                    <Text size="2"><strong>Vto. CAE:</strong> {invoice.cae_expiration}</Text>
                  )}
                  <Text size="2"><strong>Punto de venta:</strong> {invoice.point_of_sale}</Text>
                </div>
                {invoice.qr_data && (
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR ARCA"
                        width={168}
                        height={168}
                        style={{ borderRadius: "4px", border: "1px solid var(--gray-a4)" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 168,
                          height: 168,
                          borderRadius: "4px",
                          border: "1px dashed var(--gray-a4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          color: "var(--gray-a8)",
                        }}
                      >
                        Cargando QR...
                      </div>
                    )}
                    <Text size="1" color="gray" style={{ display: "block", marginTop: "4px" }}>
                      QR de validación
                    </Text>
                  </div>
                )}
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

          {pdfError && (
            <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "8px" }}>
              <Text size="2" color="red">{pdfError}</Text>
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
                onClick={handleViewPdf}
                disabled={pdfLoading}
              >
                <ExternalLinkIcon width={14} height={14} style={{ marginRight: "4px" }} />
                {pdfLoading ? "Cargando..." : "Ver PDF"}
              </Button>
              <Button
                size="2"
                color="green"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
              >
                <DownloadIcon width={14} height={14} style={{ marginRight: "4px" }} />
                Descargar
              </Button>
            </>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
