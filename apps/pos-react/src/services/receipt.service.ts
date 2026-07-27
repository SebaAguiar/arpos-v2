import type { Sale, StoreConfig } from "@/lib/types";

export type PaperSize = "default" | "a4" | "a5" | "80mm" | "58mm";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  DEBIT: "Débito",
  CREDIT: "Crédito",
  QR: "QR",
  WALLET: "Billetera",
  TRANSFER: "Transferencia",
  POINTS: "Puntos",
  MIXED: "Mixto",
};

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("es-AR");
}

function getPaperCss(paperSize: PaperSize): { page: string; body: string } {
  switch (paperSize) {
    case "80mm":
      return { page: "size: 80mm auto; margin: 0;", body: "width: 76mm; padding: 2mm;" };
    case "58mm":
      return { page: "size: 58mm auto; margin: 0;", body: "width: 54mm; padding: 2mm; font-size: 12px;" };
    case "a4":
      return { page: "size: A4; margin: 20mm;", body: "max-width: 800px; margin: 0 auto; box-sizing: border-box;" };
    case "a5":
      return { page: "size: A5; margin: 15mm;", body: "max-width: 500px; margin: 0 auto; box-sizing: border-box;" };
    default:
      return { page: "margin: 0.5cm;", body: "max-width: 100%;" };
  }
}

export function generateReceiptHtml(
  sale: Sale,
  store?: StoreConfig | null,
  paperSize: PaperSize = "default"
): string {
  const storeName = store?.name || "ArPOS Store";
  const storeAddress = store?.address || "";
  const storePhone = store?.phone || "";
  const storeEmail = store?.email || "";
  const receiptHeader = store?.receiptHeader || "";
  const receiptFooter = store?.receiptFooter || "¡Gracias por su compra!";
  const ticketNum = sale.ticketNumber || 0;
  const date = formatDate(sale.createdAt);

  const subtotal = sale.items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );

  const itemsRows = sale.items
    .map(
      (item) => `
      <tr class="item-row">
        <td style="width: 10%; text-align: center;">${item.quantity}</td>
        <td style="width: 50%; text-align: left;">${item.productName}${item.variantLabel ? ` (${item.variantLabel})` : ""}</td>
        <td style="width: 20%; text-align: right;">${formatCurrency(item.unitPrice)}</td>
        <td style="width: 20%; text-align: right;">${formatCurrency(item.subtotal)}</td>
      </tr>`
    )
    .join("");

  const paymentsRows = sale.paymentMethods
    .map(
      (p) => `
      <tr>
        <td style="text-align: left; color: #666;">${PAYMENT_LABELS[p.method] || p.method}</td>
        <td style="text-align: right;">${formatCurrency(p.amount)}</td>
      </tr>`
    )
    .join("");

  const { page: pageCss, body: bodyCss } = getPaperCss(paperSize);

  return `<!DOCTYPE html>
<html>
<head>
  <title>Ticket #${ticketNum}</title>
  <style>
    @page { ${pageCss} }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 14px;
      color: #333;
      margin: 0;
      padding: 0;
      ${bodyCss}
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }
    .store-name {
      font-size: 24px;
      font-weight: bold;
      color: #000;
      margin-bottom: 5px;
    }
    .meta {
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #666;
      background: #f9f9f9;
      padding: 10px;
      border-radius: 4px;
    }
    .meta-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      text-align: left;
      border-bottom: 2px solid #333;
      padding: 8px 0;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 12px;
    }
    .item-row td {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .totals {
      margin-left: auto;
      width: 50%;
      border-top: 2px solid #333;
      padding-top: 10px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 14px;
    }
    .grand-total {
      font-size: 18px;
      font-weight: bold;
      color: #000;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #ccc;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
      color: #888;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">${storeName}</div>
    ${storeAddress ? `<div>${storeAddress}</div>` : ""}
    ${storePhone || storeEmail ? `<div>${storePhone ? `Tel: ${storePhone}` : ""}${storePhone && storeEmail ? " • " : ""}${storeEmail || ""}</div>` : ""}
    ${receiptHeader ? `<div style="margin-top: 10px; font-style: italic; white-space: pre-line; font-size: 13px; color: #555;">${receiptHeader}</div>` : ""}
  </div>

  <div class="meta">
    <div class="meta-col">
      <div><strong>Ticket:</strong> #${ticketNum}</div>
      <div><strong>Fecha:</strong> ${date}</div>
    </div>
    <div class="meta-col" style="text-align: right;">
      <div><strong>Cajero:</strong> ${sale.user?.name || "—"}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 10%; text-align: center;">Cant</th>
        <th style="width: 50%;">Descripción</th>
        <th style="width: 20%; text-align: right;">Unitario</th>
        <th style="width: 20%; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    <div class="totals-row grand-total">
      <span>TOTAL A PAGAR</span>
      <span>${formatCurrency(sale.total)}</span>
    </div>

    <div style="margin-top: 15px; font-size: 12px; color: #666;">
      <strong>Métodos de Pago:</strong>
      <table style="margin-top: 5px; margin-bottom: 0;">
        ${paymentsRows}
      </table>
    </div>
  </div>

  <div class="footer">
    <div style="white-space: pre-line; font-size: 12px; font-weight: 500;">${receiptFooter}</div>
    <div style="margin-top: 5px;">Documento no válido como factura fiscal</div>
  </div>
</body>
</html>`;
}

export function printReceipt(
  sale: Sale,
  store?: StoreConfig | null,
  paperSize: PaperSize = "default"
): void {
  const html = generateReceiptHtml(sale, store, paperSize);
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
}

export async function downloadReceiptPdf(
  sale: Sale,
  store?: StoreConfig | null,
  paperSize: PaperSize = "default"
): Promise<void> {
  const html = generateReceiptHtml(sale, store, paperSize);
  const ticketNum = sale.ticketNumber || sale.id.slice(0, 8);

  const html2pdf = (await import("html2pdf.js")).default;
  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  document.body.appendChild(container);

  await html2pdf()
    .set({
      margin: [8, 8, 8, 8],
      filename: `ticket-${ticketNum}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a5", orientation: "portrait" as const },
    })
    .from(container.firstChild as HTMLElement)
    .save();

  document.body.removeChild(container);
}

export function shareViaWhatsApp(
  sale: Sale,
  store?: StoreConfig | null
): void {
  const storeName = store?.name || "ArPOS Store";
  const ticketNum = sale.ticketNumber || 0;
  const date = new Date(sale.createdAt).toLocaleDateString("es-AR");
  const total = formatCurrency(sale.total);

  let msg = `*${storeName}*\n`;
  msg += `Ticket: ${ticketNum} - ${date}\n`;
  msg += `*TOTAL: ${total}*\n\n`;
  msg += `¡Gracias por su compra!`;

  const encodedMessage = encodeURIComponent(msg);
  window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
}
