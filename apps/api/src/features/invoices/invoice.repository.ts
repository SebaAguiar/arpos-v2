import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { Invoice, Prisma } from '@prisma/client';

@Injectable()
export class InvoiceRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private getCompanyId(): string {
    return this.tenantContext.getCompanyId();
  }

  async findAll(filters?: {
    status?: string;
    document_type?: string;
    from?: number;
    to?: number;
    reference_invoice_id?: string;
  }): Promise<Invoice[]> {
    const where: Prisma.InvoiceWhereInput = {
      companyId: this.getCompanyId(),
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.document_type) {
      where.document_type = filters.document_type;
    }

    if (filters?.from || filters?.to) {
      where.created_at = {};
      if (filters.from) where.created_at.gte = filters.from;
      if (filters.to) where.created_at.lte = filters.to;
    }

    if (filters?.reference_invoice_id) {
      where.reference_invoice_id = filters.reference_invoice_id;
    }

    return this.prisma.invoice
      .findMany({
        where,
        include: {
          sale: {
            select: {
              id: true,
              ticket_number: true,
              total_cents: true,
              payment_method: true,
              created_at: true,
            },
          },
          arcaConfig: {
            select: {
              id: true,
              cuit: true,
              point_of_sale: true,
              environment: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      })
      .then((rows) =>
        rows.map((row) =>
          row.arcaConfig
            ? { ...row, arcaConfig: { ...row.arcaConfig, cuit: Number(row.arcaConfig.cuit) } }
            : row,
        ),
      );
  }

  async findById(id: string): Promise<Invoice | null> {
    return this.prisma.invoice
      .findFirst({
        where: { id, companyId: this.getCompanyId() },
        include: {
          sale: {
            include: {
              items: true,
              user: { select: { id: true, name: true } },
            },
          },
          arcaConfig: {
            select: {
              id: true,
              cuit: true,
              point_of_sale: true,
              environment: true,
              responsabilidad_iva: true,
            },
          },
        },
      })
      .then((row) =>
        row && row.arcaConfig
          ? { ...row, arcaConfig: { ...row.arcaConfig, cuit: Number(row.arcaConfig.cuit) } }
          : row,
      );
  }

  async findBySaleId(saleId: string): Promise<Invoice | null> {
    return this.prisma.invoice.findFirst({
      where: { saleId, companyId: this.getCompanyId() },
    });
  }

  async findPending(): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: {
        companyId: this.getCompanyId(),
        status: 'pending',
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findRetryable(maxRetries: number = 5): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: {
        companyId: this.getCompanyId(),
        status: 'pending',
        retry_count: { lt: maxRetries },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findCreditNotesForInvoice(invoiceId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: {
        companyId: this.getCompanyId(),
        reference_invoice_id: invoiceId,
        reference_type: 'credit_note',
        status: 'issued',
      },
    });
  }

  async create(data: {
    saleId?: string;
    arcaConfigId?: string;
    type: string;
    document_type: string;
    point_of_sale?: number;
    customer_name: string;
    customer_tax_id: string;
    customer_address?: string;
    customer_email?: string;
    total_cents: number;
    net_amount_cents: number;
    tax_amount_cents: number;
    reference_invoice_id?: string;
    reference_type?: string;
    reason?: string;
  }): Promise<Invoice> {
    const companyId = this.getCompanyId();
    const now = Math.floor(Date.now() / 1000);

    return this.prisma.invoice.create({
      data: {
        companyId,
        saleId: data.saleId,
        arcaConfigId: data.arcaConfigId,
        type: data.type,
        document_type: data.document_type,
        point_of_sale: data.point_of_sale,
        status: 'pending',
        customer_name: data.customer_name,
        customer_tax_id: data.customer_tax_id,
        customer_address: data.customer_address,
        customer_email: data.customer_email,
        total_cents: data.total_cents,
        net_amount_cents: data.net_amount_cents,
        tax_amount_cents: data.tax_amount_cents,
        reference_invoice_id: data.reference_invoice_id,
        reference_type: data.reference_type,
        reason: data.reason,
        created_at: now,
      },
    });
  }

  async findGlobalDaily(from: number, to: number): Promise<Invoice | null> {
    return this.prisma.invoice.findFirst({
      where: {
        companyId: this.getCompanyId(),
        type: 'global',
        created_at: { gte: from, lte: to },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateStatus(
    id: string,
    data: {
      status: string;
      cae?: string;
      cae_expiration?: string;
      number?: string;
      qr_data?: string;
      arca_response?: string;
      error_message?: string | null;
      retry_count?: number;
      issued_at?: number;
    },
  ): Promise<Invoice> {
    const now = Math.floor(Date.now() / 1000);

    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === 'issued' ? { issued_at: now } : {}),
      },
    });
  }

  async getNextNumber(
    companyId: string,
    documentType: string,
    pointOfSale: number,
  ): Promise<number> {
    const last = await this.prisma.invoice.findFirst({
      where: {
        companyId,
        document_type: documentType,
        point_of_sale: pointOfSale,
        status: 'issued',
      },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    if (!last?.number) return 1;
    return parseInt(last.number, 10) + 1;
  }

  async count(): Promise<number> {
    return this.prisma.invoice.count({
      where: { companyId: this.getCompanyId() },
    });
  }

  async getStats(): Promise<{
    total: number;
    issued: number;
    pending: number;
    error: number;
    totalIssuedCents: number;
    totalTaxCents: number;
  }> {
    const companyId = this.getCompanyId();

    const [total, issued, pending, error, aggregate] = await Promise.all([
      this.prisma.invoice.count({ where: { companyId } }),
      this.prisma.invoice.count({ where: { companyId, status: 'issued' } }),
      this.prisma.invoice.count({ where: { companyId, status: 'pending' } }),
      this.prisma.invoice.count({ where: { companyId, status: 'error' } }),
      this.prisma.invoice.aggregate({
        where: { companyId, status: 'issued' },
        _sum: { total_cents: true, tax_amount_cents: true },
      }),
    ]);

    return {
      total,
      issued,
      pending,
      error,
      totalIssuedCents: aggregate._sum.total_cents ?? 0,
      totalTaxCents: aggregate._sum.tax_amount_cents ?? 0,
    };
  }

  async getDailyReport(from: number, to: number): Promise<
    Array<{
      date: string;
      count: number;
      totalCents: number;
      taxCents: number;
    }>
  > {
    const companyId = this.getCompanyId();

    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        status: 'issued',
        issued_at: { gte: from, lte: to },
      },
      select: { issued_at: true, total_cents: true, tax_amount_cents: true },
      orderBy: { issued_at: 'asc' },
    });

    const byDate = new Map<string, { count: number; totalCents: number; taxCents: number }>();

    for (const inv of invoices) {
      if (!inv.issued_at) continue;
      const date = new Date(inv.issued_at * 1000).toISOString().split('T')[0]!;
      const existing = byDate.get(date) ?? { count: 0, totalCents: 0, taxCents: 0 };
      existing.count++;
      existing.totalCents += inv.total_cents;
      existing.taxCents += inv.tax_amount_cents;
      byDate.set(date, existing);
    }

    return Array.from(byDate.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getMonthlyReport(year: number): Promise<
    Array<{
      month: string;
      count: number;
      totalCents: number;
      taxCents: number;
    }>
  > {
    const companyId = this.getCompanyId();
    const startOfYear = Math.floor(new Date(year, 0, 1).getTime() / 1000);
    const endOfYear = Math.floor(new Date(year, 11, 31, 23, 59, 59).getTime() / 1000);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        status: 'issued',
        issued_at: { gte: startOfYear, lte: endOfYear },
      },
      select: { issued_at: true, total_cents: true, tax_amount_cents: true },
      orderBy: { issued_at: 'asc' },
    });

    const byMonth = new Map<string, { count: number; totalCents: number; taxCents: number }>();

    for (const inv of invoices) {
      if (!inv.issued_at) continue;
      const d = new Date(inv.issued_at * 1000);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = byMonth.get(month) ?? { count: 0, totalCents: 0, taxCents: 0 };
      existing.count++;
      existing.totalCents += inv.total_cents;
      existing.taxCents += inv.tax_amount_cents;
      byMonth.set(month, existing);
    }

    return Array.from(byMonth.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}
