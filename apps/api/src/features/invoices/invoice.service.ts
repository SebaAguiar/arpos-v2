import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InvoiceRepository } from './invoice.repository';
import { ArcaService, ArcaConfigData, EmitVoucherResult } from '../arca/arca.service';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ArcaConfig } from '@prisma/client';
import type { IVoucher } from '@arcasdk/core/lib/domain/types/voucher.types';

const DEFAULT_CF_TAX_ID = '0';
const DEFAULT_CF_ADDRESS = '';

export interface InvoiceFilters {
  status?: string;
  document_type?: string;
  from?: number;
  to?: number;
}

export interface CreateInvoiceFromSaleInput {
  saleId: string;
  arcaConfigId?: string;
}

export interface CreateCreditNoteInput {
  invoiceId: string;
  reason: string;
  amountCents?: number;
}

export interface CreateDebitNoteInput {
  invoiceId: string;
  reason: string;
  amountCents: number;
}

export interface EmitInvoiceResult {
  invoiceId: string;
  success: boolean;
  cae?: string;
  caeExpiration?: string;
  error?: string;
  isBusinessError?: boolean;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly invoiceRepo: InvoiceRepository,
    private readonly arcaService: ArcaService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findAll(filters?: InvoiceFilters) {
    return this.invoiceRepo.findAll(filters);
  }

  async findOne(id: string) {
    const invoice = await this.invoiceRepo.findById(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  async createFromSale(input: CreateInvoiceFromSaleInput) {
    const companyId = this.tenantContext.getCompanyId();

    const existingInvoice = await this.invoiceRepo.findBySaleId(input.saleId);
    if (existingInvoice) {
      throw new BadRequestException(`Invoice already exists for sale ${input.saleId}`);
    }

    const sale = await this.prisma.sale.findUnique({
      where: { id: input.saleId },
      include: {
        items: true,
        store: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${input.saleId} not found`);
    }

    if (sale.companyId !== companyId) {
      throw new NotFoundException(`Sale with ID ${input.saleId} not found`);
    }

    let contact: { name: string; tax_id: string | null; address: string | null; email: string | null } | null = null;
    if (sale.contact_id) {
      contact = await this.prisma.contact.findUnique({
        where: { id: sale.contact_id },
        select: { name: true, tax_id: true, address: true, email: true },
      });
    }

    const arcaConfig: ArcaConfig | null = input.arcaConfigId
      ? await this.prisma.arcaConfig.findFirst({
          where: { id: input.arcaConfigId, companyId, active: true },
        })
      : await this.prisma.arcaConfig.findFirst({
          where: { companyId, active: true },
        });

    if (!arcaConfig) {
      throw new BadRequestException(
        'No active ARCA configuration found. Please configure ARCA settings first.',
      );
    }

    const netAmountCents = Math.round(sale.total_cents / 1.21);
    const taxAmountCents = sale.total_cents - netAmountCents;

    return this.invoiceRepo.create({
      saleId: input.saleId,
      arcaConfigId: arcaConfig.id,
      type: 'invoice',
      document_type: this.getDocumentType(arcaConfig.responsabilidad_iva),
      point_of_sale: arcaConfig.point_of_sale,
      customer_name: contact?.name ?? 'Consumidor Final',
      customer_tax_id: contact?.tax_id ?? DEFAULT_CF_TAX_ID,
      customer_address: contact?.address ?? DEFAULT_CF_ADDRESS,
      customer_email: contact?.email ?? undefined,
      total_cents: sale.total_cents,
      net_amount_cents: netAmountCents,
      tax_amount_cents: taxAmountCents,
    });
  }

  async createCreditNote(input: CreateCreditNoteInput) {
    const originalInvoice = await this.invoiceRepo.findById(input.invoiceId);
    if (!originalInvoice) {
      throw new NotFoundException(`Original invoice ${input.invoiceId} not found`);
    }

    if (originalInvoice.status !== 'issued') {
      throw new BadRequestException('Can only create credit note against issued invoices');
    }

    if (originalInvoice.type === 'credit_note') {
      throw new BadRequestException('Cannot create credit note against a credit note');
    }

    const existingNC = await this.invoiceRepo.findCreditNotesForInvoice(input.invoiceId);
    if (existingNC.length > 0) {
      throw new BadRequestException('This invoice already has a credit note');
    }

    const amountCents = input.amountCents ?? originalInvoice.total_cents;
    if (amountCents <= 0 || amountCents > originalInvoice.total_cents) {
      throw new BadRequestException(
        `Amount must be between 1 and ${originalInvoice.total_cents} cents`,
      );
    }

    const arcaConfig = originalInvoice.arcaConfigId
      ? await this.prisma.arcaConfig.findUnique({
          where: { id: originalInvoice.arcaConfigId },
        })
      : null;

    if (!arcaConfig) {
      throw new BadRequestException('ARCA configuration not found for original invoice');
    }

    const ncDocType = this.getDocumentType(arcaConfig.responsabilidad_iva, 'credit_note');
    const netAmountCents = Math.round(amountCents / 1.21);
    const taxAmountCents = amountCents - netAmountCents;

    return this.invoiceRepo.create({
      saleId: originalInvoice.saleId,
      arcaConfigId: arcaConfig.id,
      type: 'credit_note',
      document_type: ncDocType,
      point_of_sale: arcaConfig.point_of_sale,
      customer_name: originalInvoice.customer_name,
      customer_tax_id: originalInvoice.customer_tax_id,
      customer_address: originalInvoice.customer_address ?? undefined,
      customer_email: originalInvoice.customer_email ?? undefined,
      total_cents: amountCents,
      net_amount_cents: netAmountCents,
      tax_amount_cents: taxAmountCents,
      reference_invoice_id: input.invoiceId,
      reference_type: 'credit_note',
      reason: input.reason,
    });
  }

  async createDebitNote(input: CreateDebitNoteInput) {
    const originalInvoice = await this.invoiceRepo.findById(input.invoiceId);
    if (!originalInvoice) {
      throw new NotFoundException(`Original invoice ${input.invoiceId} not found`);
    }

    if (originalInvoice.status !== 'issued') {
      throw new BadRequestException('Can only create debit note against issued invoices');
    }

    if (originalInvoice.type === 'debit_note') {
      throw new BadRequestException('Cannot create debit note against a debit note');
    }

    if (input.amountCents <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const arcaConfig = originalInvoice.arcaConfigId
      ? await this.prisma.arcaConfig.findUnique({
          where: { id: originalInvoice.arcaConfigId },
        })
      : null;

    if (!arcaConfig) {
      throw new BadRequestException('ARCA configuration not found for original invoice');
    }

    const ndDocType = this.getDocumentType(arcaConfig.responsabilidad_iva, 'debit_note');
    const netAmountCents = Math.round(input.amountCents / 1.21);
    const taxAmountCents = input.amountCents - netAmountCents;

    return this.invoiceRepo.create({
      saleId: originalInvoice.saleId,
      arcaConfigId: arcaConfig.id,
      type: 'debit_note',
      document_type: ndDocType,
      point_of_sale: arcaConfig.point_of_sale,
      customer_name: originalInvoice.customer_name,
      customer_tax_id: originalInvoice.customer_tax_id,
      customer_address: originalInvoice.customer_address ?? undefined,
      customer_email: originalInvoice.customer_email ?? undefined,
      total_cents: input.amountCents,
      net_amount_cents: netAmountCents,
      tax_amount_cents: taxAmountCents,
      reference_invoice_id: input.invoiceId,
      reference_type: 'debit_note',
      reason: input.reason,
    });
  }

  async emit(id: string): Promise<EmitInvoiceResult> {
    const invoice = await this.invoiceRepo.findById(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (invoice.status !== 'pending') {
      throw new BadRequestException(`Invoice ${id} is not pending (status: ${invoice.status})`);
    }

    if (!invoice.arcaConfigId) {
      throw new BadRequestException('Invoice has no ARCA configuration linked');
    }

    const arcaConfig = await this.prisma.arcaConfig.findUnique({
      where: { id: invoice.arcaConfigId },
    });

    if (!arcaConfig) {
      throw new BadRequestException('ARCA configuration not found');
    }

    const configData: ArcaConfigData = {
      cuit: arcaConfig.cuit,
      certificate: arcaConfig.certificate,
      privateKey: arcaConfig.privateKey,
      point_of_sale: arcaConfig.point_of_sale,
      environment: arcaConfig.environment,
    };

    const cbteTipo = this.getCbteTipo(arcaConfig.responsabilidad_iva, invoice.type);
    const nextNumber = await this.arcaService.getLastVoucherNumber(
      configData,
      arcaConfig.id,
      cbteTipo,
    );

    const number = nextNumber + 1;

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    const docTipo = this.getDocTipo(arcaConfig.responsabilidad_iva, invoice.customer_tax_id);

    const voucher: IVoucher = {
      CantReg: 1,
      PtoVta: invoice.point_of_sale ?? arcaConfig.point_of_sale,
      CbteTipo: cbteTipo,
      Concepto: 1,
      DocTipo: docTipo,
      DocNro: parseInt(invoice.customer_tax_id, 10) || 0,
      CbteDesde: number,
      CbteHasta: number,
      CbteFch: dateStr,
      ImpTotal: invoice.total_cents,
      ImpTotConc: 0,
      ImpNeto: invoice.net_amount_cents,
      ImpOpEx: 0,
      ImpIVA: invoice.tax_amount_cents,
      ImpTrib: 0,
      MonId: 'PES',
      MonCotiz: 1,
      CondicionIVAReceptorId: this.getCondicionIVAReceptorId(arcaConfig.responsabilidad_iva),
    };

    const result: EmitVoucherResult = await this.arcaService.emitVoucher(
      configData,
      arcaConfig.id,
      voucher,
    );

    if (result.success) {
      const qrData = this.buildQrData(
        arcaConfig.cuit,
        invoice.point_of_sale ?? arcaConfig.point_of_sale,
        cbteTipo,
        number,
        invoice.total_cents,
        invoice.customer_tax_id,
      );

      await this.invoiceRepo.updateStatus(id, {
        status: 'issued',
        cae: result.cae,
        cae_expiration: result.caeExpiration,
        number: String(number),
        qr_data: qrData,
        arca_response: JSON.stringify(result.rawResponse),
      });

      return {
        invoiceId: id,
        success: true,
        cae: result.cae,
        caeExpiration: result.caeExpiration,
      };
    } else {
      await this.invoiceRepo.updateStatus(id, {
        status: result.isBusinessError ? 'error' : 'pending',
        error_message: result.error,
        retry_count: invoice.retry_count + 1,
      });

      return {
        invoiceId: id,
        success: false,
        error: result.error,
        isBusinessError: result.isBusinessError,
      };
    }
  }

  async emitBatch(): Promise<{
    total: number;
    issued: number;
    failed: number;
    results: EmitInvoiceResult[];
  }> {
    const pendingInvoices = await this.invoiceRepo.findRetryable();

    if (pendingInvoices.length === 0) {
      return { total: 0, issued: 0, failed: 0, results: [] };
    }

    const results: EmitInvoiceResult[] = [];
    let issued = 0;
    let failed = 0;

    for (const invoice of pendingInvoices) {
      try {
        const result = await this.emit(invoice.id);
        results.push(result);
        if (result.success) {
          issued++;
        } else {
          failed++;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Batch emit failed for invoice ${invoice.id}: ${message}`);
        results.push({
          invoiceId: invoice.id,
          success: false,
          error: message,
        });
        failed++;
      }
    }

    return {
      total: pendingInvoices.length,
      issued,
      failed,
      results,
    };
  }

  async getStats() {
    return this.invoiceRepo.getStats();
  }

  async getDailyReport(from: number, to: number) {
    return this.invoiceRepo.getDailyReport(from, to);
  }

  async getMonthlyReport(year: number) {
    return this.invoiceRepo.getMonthlyReport(year);
  }

  generateFiscalPdfHtml(invoice: {
    document_type: string;
    number: string | null;
    point_of_sale: number | null;
    customer_name: string;
    customer_tax_id: string;
    customer_address: string | null;
    total_cents: number;
    net_amount_cents: number;
    tax_amount_cents: number;
    cae: string | null;
    cae_expiration: string | null;
    qr_data: string | null;
    issued_at: number | null;
    type: string;
    reason?: string | null;
  }): string {
    const total = (invoice.total_cents / 100).toFixed(2);
    const net = (invoice.net_amount_cents / 100).toFixed(2);
    const tax = (invoice.tax_amount_cents / 100).toFixed(2);
    const dateStr = invoice.issued_at
      ? new Date(invoice.issued_at * 1000).toLocaleDateString('es-AR')
      : new Date().toLocaleDateString('es-AR');

    const typeLabel = invoice.type === 'credit_note'
      ? 'NOTA DE CREDITO'
      : invoice.type === 'debit_note'
        ? 'NOTA DE DEBITO'
        : 'FACTURA';

    const title = `${typeLabel} ${invoice.document_type}`;

    const qrImg = invoice.qr_data
      ? `<img src="https://qr.afip.gob.ar/?qr=${invoice.qr_data}" alt="QR ARCA" style="width:120px;height:120px;" />`
      : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 16px; }
  .header-left h1 { font-size: 18px; margin-bottom: 4px; }
  .header-left p { font-size: 11px; color: #666; }
  .header-right { text-align: right; }
  .header-right .doc-type { font-size: 24px; font-weight: 700; }
  .header-right .comp-number { font-size: 14px; color: #666; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 6px; font-weight: 600; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; }
  .info-row { display: flex; justify-content: space-between; padding: 3px 0; }
  .info-label { color: #666; }
  .info-value { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #f5f5f5; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #ddd; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; }
  .totals { margin-top: 16px; display: flex; justify-content: flex-end; }
  .totals-table { width: 300px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals-row.total { font-weight: 700; font-size: 14px; border-top: 2px solid #1a1a1a; padding-top: 8px; margin-top: 4px; }
  .cae-box { margin-top: 20px; padding: 12px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; }
  .qr-section { margin-top: 16px; display: flex; align-items: center; gap: 16px; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; }
  .reason { margin-top: 8px; padding: 8px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; font-size: 11px; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Arcom POS</h1>
      <p>Documento No Válido como Factura</p>
    </div>
    <div class="header-right">
      <div class="doc-type">${title}</div>
      ${invoice.number ? `<div class="comp-number">N° ${String(invoice.point_of_sale ?? '').padStart(4, '0')}-${invoice.number}</div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="info-grid">
      <div>
        <div class="section-title">Fecha de Emisión</div>
        <div class="info-value">${dateStr}</div>
      </div>
      <div>
        <div class="section-title">Condición de Venta</div>
        <div class="info-value">Contado</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Receptor</div>
    <div class="info-grid">
      <div>
        <div class="info-row"><span class="info-label">Nombre:</span> <span class="info-value">${invoice.customer_name}</span></div>
        <div class="info-row"><span class="info-label">CUIT/DNI:</span> <span class="info-value">${invoice.customer_tax_id}</span></div>
      </div>
      <div>
        ${invoice.customer_address ? `<div class="info-row"><span class="info-label">Domicilio:</span> <span class="info-value">${invoice.customer_address}</span></div>` : ''}
      </div>
    </div>
  </div>

  ${invoice.reason ? `<div class="reason"><strong>Motivo:</strong> ${invoice.reason}</div>` : ''}

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${typeLabel} ${invoice.document_type} ${invoice.number ? `N° ${invoice.number}` : ''}</td>
        <td style="text-align:right">$${total}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="totals-row"><span>Neto:</span> <span>$${net}</span></div>
      <div class="totals-row"><span>IVA (21%):</span> <span>$${tax}</span></div>
      <div class="totals-row total"><span>TOTAL:</span> <span>$${total}</span></div>
    </div>
  </div>

  ${invoice.cae ? `
  <div class="cae-box">
    <div class="section-title">Datos del Comprobante Autorizado</div>
    <div class="info-grid">
      <div>
        <div class="info-row"><span class="info-label">CAE:</span> <span class="info-value">${invoice.cae}</span></div>
        <div class="info-row"><span class="info-label">Vto. CAE:</span> <span class="info-value">${invoice.cae_expiration ?? '-'}</span></div>
      </div>
      <div>
        <div class="info-row"><span class="info-label">Punto de Venta:</span> <span class="info-value">${invoice.point_of_sale ?? '-'}</span></div>
      </div>
    </div>
  </div>
  ` : ''}

  ${qrImg ? `
  <div class="qr-section">
    ${qrImg}
    <div>
      <div class="section-title">QR Code Validación</div>
      <div style="font-size:10px;color:#666;">Escanee para validar en ARCA</div>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    Comprobante generado por Arcom POS — Valide su comprobante en <a href="https://auth.afip.gob.ar/contribuyente_/loginSso.htm">ARCA</a>
  </div>
</body>
</html>`;
  }

  private buildQrData(
    cuit: number,
    pointOfSale: number,
    cbteTipo: number,
    cbteNumber: number,
    totalCents: number,
    docNro: string,
  ): string {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const total = (totalCents / 100).toFixed(2);

    const data = [
      `ver:1`,
      `fecha:${dateStr}`,
      `cuit:${cuit}`,
      `ptoVta:${String(pointOfSale).padStart(4, '0')}`,
      `tipoCmp:${String(cbteTipo).padStart(3, '0')}`,
      `nroCmp:${String(cbteNumber).padStart(8, '0')}`,
      `importe:${total}`,
      `moneda:PES`,
      `ctz:1`,
      `tipoDocRec:${docNro.length === 11 ? 80 : 99}`,
      `nroDocRec:${docNro}`,
    ];

    return Buffer.from(data.join('&')).toString('base64');
  }

  private getDocumentType(responsabilidadIVA: string, invoiceType: string = 'invoice'): string {
    if (invoiceType === 'credit_note') {
      switch (responsabilidadIVA) {
        case 'RI': return 'NC-A';
        case 'RM': return 'NC-A';
        default: return 'NC-B';
      }
    }
    if (invoiceType === 'debit_note') {
      switch (responsabilidadIVA) {
        case 'RI': return 'ND-A';
        case 'RM': return 'ND-A';
        default: return 'ND-B';
      }
    }
    switch (responsabilidadIVA) {
      case 'RI':
      case 'RM':
        return 'A';
      case 'CF':
        return 'B';
      default:
        return 'B';
    }
  }

  private getCbteTipo(responsabilidadIVA: string, invoiceType: string = 'invoice'): number {
    if (invoiceType === 'credit_note') {
      switch (responsabilidadIVA) {
        case 'RI': return 3;
        case 'RM': return 3;
        default: return 8;
      }
    }
    if (invoiceType === 'debit_note') {
      switch (responsabilidadIVA) {
        case 'RI': return 2;
        case 'RM': return 2;
        default: return 7;
      }
    }
    switch (responsabilidadIVA) {
      case 'RI':
      case 'RM':
        return 1;
      case 'CF':
        return 6;
      default:
        return 6;
    }
  }

  private getDocTipo(responsabilidadIVA: string, taxId: string): number {
    if (responsabilidadIVA === 'CF') {
      return 99;
    }
    if (taxId.length === 11) {
      return 80;
    }
    return 99;
  }

  private getCondicionIVAReceptorId(responsabilidadIVA: string): number {
    switch (responsabilidadIVA) {
      case 'RI':
        return 1;
      case 'CF':
        return 5;
      default:
        return 5;
    }
  }
}
