import { useEffect, useState } from "react";
import { Text, Badge, Button, ScrollArea } from "@radix-ui/themes";
import {
  Cross2Icon,
  CheckCircledIcon,
  CrossCircledIcon,
  RocketIcon,
  ReloadIcon,
  FileTextIcon,
  EyeOpenIcon,
  MinusCircledIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
import { useArcaStore } from "@/stores/arca.store";
import type { ApiInvoice } from "@/services/arca.service";
import { formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { InvoicePdfDialog } from "./InvoicePdfDialog";
import { CreditNoteDialog } from "./CreditNoteDialog";
import { DebitNoteDialog } from "./DebitNoteDialog";

interface InvoiceListDialogProps {
  open: boolean;
  onClose: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  issued: {
    label: "Emitida",
    color: "#2db464",
    bg: "rgba(45, 180, 100, 0.08)",
    border: "rgba(45, 180, 100, 0.2)",
  },
  pending: {
    label: "Pendiente",
    color: "#e6a817",
    bg: "rgba(230, 168, 23, 0.08)",
    border: "rgba(230, 168, 23, 0.2)",
  },
  error: {
    label: "Error",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.2)",
  },
  cancelled: {
    label: "Anulada",
    color: "#6b7280",
    bg: "rgba(107, 114, 128, 0.08)",
    border: "rgba(107, 114, 128, 0.2)",
  },
};

function InvoiceRow({
  invoice,
  isEmitting,
  onEmit,
  onViewPdf,
  onCreditNote,
  onDebitNote,
}: {
  invoice: ApiInvoice;
  isEmitting: boolean;
  onEmit: (id: string) => void;
  onViewPdf: (invoice: ApiInvoice) => void;
  onCreditNote: (invoice: ApiInvoice) => void;
  onDebitNote: (invoice: ApiInvoice) => void;
}) {
  const statusCfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.pending;

  return (
    <div
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--gray-a3)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          backgroundColor: statusCfg.bg,
          border: `1px solid ${statusCfg.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {invoice.status === "issued" ? (
          <CheckCircledIcon width={18} height={18} style={{ color: statusCfg.color }} />
        ) : invoice.status === "error" ? (
          <CrossCircledIcon width={18} height={18} style={{ color: statusCfg.color }} />
        ) : (
          <FileTextIcon width={18} height={18} style={{ color: statusCfg.color }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Text size="2" weight="bold" style={{ fontFamily: "monospace" }}>
            {invoice.document_type}
          </Text>
          {invoice.number && (
            <Text size="2" color="gray" style={{ fontFamily: "monospace" }}>
              N° {invoice.number}
            </Text>
          )}
          <Badge
            size="1"
            style={{
              color: statusCfg.color,
              backgroundColor: statusCfg.bg,
              border: `1px solid ${statusCfg.border}`,
            }}
          >
            {statusCfg.label}
          </Badge>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
          <Text size="1" color="gray">
            {invoice.customer_name}
          </Text>
          {invoice.sale && (
            <Text size="1" color="gray">
              · Ticket #{invoice.sale.ticket_number}
            </Text>
          )}
          <Text size="1" color="gray">
            · {formatDate(invoice.created_at)}
          </Text>
        </div>
        {invoice.cae && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
            <Text size="1" color="gray" style={{ fontFamily: "monospace" }}>
              CAE: {invoice.cae}
            </Text>
            {invoice.cae_expiration && (
              <Text size="1" color="gray">
                Vence: {invoice.cae_expiration}
              </Text>
            )}
          </div>
        )}
        {invoice.error_message && (
          <Text size="1" color="red" style={{ marginTop: "2px", display: "block" }}>
            {invoice.error_message}
          </Text>
        )}
        {invoice.retry_count > 0 && (
          <Text size="1" color="gray" style={{ marginTop: "2px", display: "block" }}>
            Reintentos: {invoice.retry_count}
          </Text>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        <Text size="3" weight="bold" style={{ fontFamily: "monospace" }}>
          {formatCents(invoice.total_cents)}
        </Text>
        {invoice.status === "issued" && (
          <>
            <Button
              size="1"
              variant="soft"
              color="gray"
              onClick={() => onViewPdf(invoice)}
              title="Ver detalles"
            >
              <EyeOpenIcon width={12} height={12} />
            </Button>
            <Button
              size="1"
              variant="soft"
              color="blue"
              onClick={() => onCreditNote(invoice)}
              title="Nota de crédito"
            >
              <MinusCircledIcon width={12} height={12} />
            </Button>
            <Button
              size="1"
              variant="soft"
              color="orange"
              onClick={() => onDebitNote(invoice)}
              title="Nota de débito"
            >
              <PlusCircledIcon width={12} height={12} />
            </Button>
          </>
        )}
        {invoice.status === "pending" && (
          <Button
            size="1"
            color="green"
            variant="soft"
            disabled={isEmitting}
            onClick={() => onEmit(invoice.id)}
          >
            {isEmitting ? (
              <ReloadIcon width={12} height={12} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <RocketIcon width={12} height={12} />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export function InvoiceListDialog({ open, onClose }: InvoiceListDialogProps) {
  const {
    invoices,
    isLoadingInvoices,
    isEmitting,
    isBatchEmitting,
    config,
    error,
    fetchInvoices,
    emitInvoice,
    emitBatch,
    fetchConfig,
    clearError,
  } = useArcaStore();

  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Sub-dialogs
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfInvoice, setPdfInvoice] = useState<ApiInvoice | null>(null);
  const [creditNoteOpen, setCreditNoteOpen] = useState(false);
  const [creditNoteInvoice, setCreditNoteInvoice] = useState<ApiInvoice | null>(null);
  const [debitNoteOpen, setDebitNoteOpen] = useState(false);
  const [debitNoteInvoice, setDebitNoteInvoice] = useState<ApiInvoice | null>(null);

  useEffect(() => {
    if (open) {
      fetchConfig();
      fetchInvoices();
    }
  }, [open, fetchConfig, fetchInvoices]);

  const filtered =
    statusFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === statusFilter);

  const pendingCount = invoices.filter((i) => i.status === "pending").length;
  const issuedCount = invoices.filter((i) => i.status === "issued").length;
  const errorCount = invoices.filter((i) => i.status === "error").length;

  if (!open) return null;

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
          maxWidth: "700px",
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(139, 92, 246, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileTextIcon width={18} height={18} style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <Text size="3" weight="bold" style={{ display: "block" }}>
                Comprobantes Fiscales
              </Text>
              <Text size="1" color="gray" style={{ display: "block" }}>
                {invoices.length} total · {pendingCount} pendientes · {issuedCount} emitidos · {errorCount} con error
              </Text>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Filters + Batch action */}
        <div
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid var(--gray-a3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "6px" }}>
            {(["all", "pending", "issued", "error"] as const).map((f) => {
              const isActive = statusFilter === f;
              const labels: Record<string, string> = {
                all: "Todos",
                pending: "Pendientes",
                issued: "Emitidos",
                error: "Con error",
              };
              return (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: isActive ? "var(--accent)" : "var(--gray-a5)",
                    backgroundColor: isActive ? "rgba(139, 92, 246, 0.08)" : "transparent",
                    color: isActive ? "var(--accent)" : "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>

          {config && pendingCount > 0 && (
            <Button
              size="2"
              color="green"
              variant="soft"
              disabled={isBatchEmitting}
              onClick={async () => {
                await emitBatch();
              }}
            >
              {isBatchEmitting ? (
                <>
                  <ReloadIcon
                    width={14}
                    height={14}
                    style={{ animation: "spin 1s linear infinite", marginRight: "6px" }}
                  />
                  Emitiendo...
                </>
              ) : (
                <>
                  <RocketIcon width={14} height={14} style={{ marginRight: "6px" }} />
                  Emitir todas ({pendingCount})
                </>
              )}
            </Button>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: "10px 20px",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              borderBottom: "1px solid rgba(239, 68, 68, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CrossCircledIcon width={14} height={14} style={{ color: "#ef4444", flexShrink: 0 }} />
            <Text size="2" color="red" style={{ flex: 1 }}>
              {error}
            </Text>
            <button
              onClick={clearError}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#ef4444",
              }}
            >
              <Cross2Icon width={12} height={12} />
            </button>
          </div>
        )}

        {!config && (
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "rgba(230, 168, 23, 0.06)",
              borderBottom: "1px solid rgba(230, 168, 23, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Text size="2" style={{ color: "#e6a817" }}>
              No hay configuración de ARCA. Configurala en{" "}
              <strong>Configuración → Facturación</strong> antes de emitir comprobantes.
            </Text>
          </div>
        )}

        {/* List */}
        <ScrollArea style={{ flex: 1 }}>
          {isLoadingInvoices ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                color: "var(--text-muted)",
              }}
            >
              <ReloadIcon
                width={16}
                height={16}
                style={{ animation: "spin 1s linear infinite", marginRight: "8px" }}
              />
              Cargando comprobantes...
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                gap: "12px",
              }}
            >
              <FileTextIcon
                width={32}
                height={32}
                style={{ color: "var(--text-muted)" }}
              />
              <Text size="2" color="gray">
                {statusFilter === "all"
                  ? "No hay comprobantes registrados"
                  : `No hay comprobantes con estado "${STATUS_CONFIG[statusFilter]?.label ?? statusFilter}"`}
              </Text>
            </div>
          ) : (
            filtered.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                isEmitting={isEmitting === invoice.id}
                onEmit={emitInvoice}
                onViewPdf={(inv) => { setPdfInvoice(inv); setPdfDialogOpen(true); }}
                onCreditNote={(inv) => { setCreditNoteInvoice(inv); setCreditNoteOpen(true); }}
                onDebitNote={(inv) => { setDebitNoteInvoice(inv); setDebitNoteOpen(true); }}
              />
            ))
          )}
        </ScrollArea>
      </div>

      <InvoicePdfDialog
        open={pdfDialogOpen}
        invoice={pdfInvoice}
        onClose={() => { setPdfDialogOpen(false); setPdfInvoice(null); }}
      />
      <CreditNoteDialog
        open={creditNoteOpen}
        invoice={creditNoteInvoice}
        onClose={() => { setCreditNoteOpen(false); setCreditNoteInvoice(null); }}
        onCreated={() => { setCreditNoteOpen(false); setCreditNoteInvoice(null); fetchInvoices(); }}
      />
      <DebitNoteDialog
        open={debitNoteOpen}
        invoice={debitNoteInvoice}
        onClose={() => { setDebitNoteOpen(false); setDebitNoteInvoice(null); }}
        onCreated={() => { setDebitNoteOpen(false); setDebitNoteInvoice(null); fetchInvoices(); }}
      />
    </div>
  );
}
