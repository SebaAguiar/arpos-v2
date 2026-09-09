import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  Header,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceWorkerService } from './invoice-worker.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { ZodQuery } from '../../core/validation/zod-query.decorator';
import { CreateInvoiceSchema } from './dto/create-invoice.schema';
import { CreateGlobalDailySchema } from './dto/create-global-daily.schema';
import { CreateCreditNoteSchema } from './dto/create-credit-note.schema';
import { CreateDebitNoteSchema } from './dto/create-debit-note.schema';
import { InvoiceFiltersSchema } from './dto/invoice-filters.schema';
import { DailyReportSchema } from './dto/daily-report.schema';
import { MonthlyReportSchema } from './dto/monthly-report.schema';

@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoiceWorker: InvoiceWorkerService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @ZodQuery(InvoiceFiltersSchema)
    query: {
      status?: string;
      document_type?: string;
      from?: string;
      to?: string;
    },
  ) {
    return this.invoiceService.findAll({
      status: query.status,
      document_type: query.document_type,
      from: query.from ? parseInt(query.from, 10) : undefined,
      to: query.to ? parseInt(query.to, 10) : undefined,
    });
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats() {
    return this.invoiceService.getStats();
  }

  @Get('reports/daily')
  @HttpCode(HttpStatus.OK)
  async getDailyReport(
    @ZodQuery(DailyReportSchema)
    query: { from: string; to: string },
  ) {
    return this.invoiceService.getDailyReport(
      parseInt(query.from, 10),
      parseInt(query.to, 10),
    );
  }

  @Get('reports/monthly')
  @HttpCode(HttpStatus.OK)
  async getMonthlyReport(
    @ZodQuery(MonthlyReportSchema)
    query: { year: string },
  ) {
    return this.invoiceService.getMonthlyReport(parseInt(query.year, 10));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  @Get(':id/pdf')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/html')
  async getPdf(@Param('id') id: string) {
    const invoice = await this.invoiceService.findOne(id);
    return this.invoiceService.generateFiscalPdfHtml(invoice);
  }

  @Get(':id/qr')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/plain')
  async getQr(@Param('id') id: string) {
    const invoice = await this.invoiceService.findOne(id);
    const qr = await this.invoiceService.getQrDataUrl(invoice);
    if (!qr) {
      throw new NotFoundException('QR not available for this invoice');
    }
    return qr;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@ZodBody(CreateInvoiceSchema) body: { saleId: string; arcaConfigId?: string }) {
    return this.invoiceService.createFromSale(body);
  }

  @Post('global-daily')
  @HttpCode(HttpStatus.CREATED)
  async createGlobalDaily(
    @ZodBody(CreateGlobalDailySchema)
    body: { from?: number; to?: number; arcaConfigId?: string },
  ) {
    return this.invoiceService.createGlobalDaily(body);
  }

  @Post('credit-note')
  @HttpCode(HttpStatus.CREATED)
  async createCreditNote(
    @ZodBody(CreateCreditNoteSchema)
    body: { invoiceId: string; reason: string; amountCents?: number },
  ) {
    return this.invoiceService.createCreditNote(body);
  }

  @Post('debit-note')
  @HttpCode(HttpStatus.CREATED)
  async createDebitNote(
    @ZodBody(CreateDebitNoteSchema)
    body: { invoiceId: string; reason: string; amountCents: number },
  ) {
    return this.invoiceService.createDebitNote(body);
  }

  @Post(':id/emit')
  @HttpCode(HttpStatus.OK)
  async emit(@Param('id') id: string) {
    return this.invoiceService.emit(id);
  }

  @Post('emit-batch')
  @HttpCode(HttpStatus.OK)
  async emitBatch() {
    return this.invoiceService.emitBatch();
  }

  @Post('retry-failed')
  @HttpCode(HttpStatus.OK)
  async retryFailed() {
    return this.invoiceWorker.retryFailed();
  }
}
