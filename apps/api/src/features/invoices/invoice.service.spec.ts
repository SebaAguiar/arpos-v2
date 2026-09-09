import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import type { ArcaConfig, Invoice } from '@prisma/client';

type DeepPartial<T> = { [P in keyof T]?: T[P] };

function buildInvoice(overrides: DeepPartial<Invoice> = {}): Invoice {
  return {
    id: 'inv-1',
    companyId: 'company-1',
    saleId: 'sale-1',
    arcaConfigId: 'arca-1',
    type: 'invoice',
    document_type: 'A',
    number: null,
    point_of_sale: 1,
    status: 'pending',
    customer_name: 'ACME SA',
    customer_tax_id: '20111111112',
    customer_address: 'Calle Falsa 123',
    customer_email: 'facturacion@acme.test',
    total_cents: 12100,
    net_amount_cents: 10000,
    tax_amount_cents: 2100,
    cae: null,
    cae_expiration: null,
    qr_data: null,
    arca_response: null,
    error_message: null,
    retry_count: 0,
    issued_at: null,
    created_at: 1750000000,
    reference_invoice_id: null,
    reference_type: null,
    reason: null,
    ...overrides,
  } as Invoice;
}

const arcaConfig = {
  id: 'arca-1',
  companyId: 'company-1',
  cuit: 30112223334,
  certificate: 'CERT',
  privateKey: 'KEY',
  point_of_sale: 1,
  environment: 'homologacion',
  responsabilidad_iva: 'RI',
  active: true,
} as unknown as ArcaConfig;

describe('InvoiceService', () => {
  let service: InvoiceService;
  let mockInvoiceRepo: Record<string, jest.Mock>;
  let mockArcaService: Record<string, jest.Mock>;
  let mockPrisma: Record<string, Record<string, jest.Mock>>;
  let mockTenant: { getCompanyId: jest.Mock };

  beforeEach(() => {
    mockInvoiceRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySaleId: jest.fn(),
      findGlobalDaily: jest.fn(),
      findCreditNotesForInvoice: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      findRetryable: jest.fn(),
      getStats: jest.fn(),
      getDailyReport: jest.fn(),
      getMonthlyReport: jest.fn(),
    };
    mockArcaService = {
      getLastVoucherNumber: jest.fn(),
      emitVoucher: jest.fn(),
    };
    mockPrisma = {
      sale: { findUnique: jest.fn(), findMany: jest.fn() },
      contact: { findUnique: jest.fn() },
      arcaConfig: { findUnique: jest.fn(), findFirst: jest.fn() },
    };
    mockTenant = { getCompanyId: jest.fn().mockReturnValue('company-1') };

    service = new InvoiceService(
      mockInvoiceRepo as never,
      mockArcaService as never,
      mockPrisma as never,
      mockTenant as never,
    );
  });

  describe('findOne', () => {
    it('returns the invoice when it exists', async () => {
      const invoice = buildInvoice();
      mockInvoiceRepo.findById.mockResolvedValue(invoice);

      await expect(service.findOne('inv-1')).resolves.toEqual(invoice);
    });

    it('throws NotFoundException when missing', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(null);

      await expect(service.findOne('inv-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('createFromSale', () => {
    it('rejects a sale that already has an invoice', async () => {
      mockInvoiceRepo.findBySaleId.mockResolvedValue(buildInvoice());

      await expect(
        service.createFromSale({ saleId: 'sale-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when the sale does not exist', async () => {
      mockInvoiceRepo.findBySaleId.mockResolvedValue(null);
      mockPrisma.sale.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromSale({ saleId: 'sale-1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('hides sales that belong to another company', async () => {
      mockInvoiceRepo.findBySaleId.mockResolvedValue(null);
      mockPrisma.sale.findUnique.mockResolvedValue({
        id: 'sale-1',
        companyId: 'company-2',
        total_cents: 12100,
      });

      await expect(
        service.createFromSale({ saleId: 'sale-1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when there is no active ARCA configuration', async () => {
      mockInvoiceRepo.findBySaleId.mockResolvedValue(null);
      mockPrisma.sale.findUnique.mockResolvedValue({
        id: 'sale-1',
        companyId: 'company-1',
        total_cents: 12100,
      });
      mockPrisma.arcaConfig.findFirst.mockResolvedValue(null);

      await expect(
        service.createFromSale({ saleId: 'sale-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('builds a type-A invoice with net/tax split for an RI config', async () => {
      mockInvoiceRepo.findBySaleId.mockResolvedValue(null);
      mockPrisma.sale.findUnique.mockResolvedValue({
        id: 'sale-1',
        companyId: 'company-1',
        total_cents: 12100,
        contact_id: 'contact-1',
      });
      mockPrisma.contact.findUnique.mockResolvedValue({
        name: 'ACME SA',
        tax_id: '20111111112',
        address: 'Av Siempre 1',
        email: 'fact@acme.test',
      });
      mockPrisma.arcaConfig.findFirst.mockResolvedValue(arcaConfig);
      mockInvoiceRepo.create.mockResolvedValue(buildInvoice());

      await service.createFromSale({ saleId: 'sale-1' });

      expect(mockInvoiceRepo.create).toHaveBeenCalledWith({
        saleId: 'sale-1',
        arcaConfigId: 'arca-1',
        type: 'invoice',
        document_type: 'A',
        point_of_sale: 1,
        customer_name: 'ACME SA',
        customer_tax_id: '20111111112',
        customer_address: 'Av Siempre 1',
        customer_email: 'fact@acme.test',
        total_cents: 12100,
        net_amount_cents: 10000,
        tax_amount_cents: 2100,
      });
    });

    it('defaults to Consumidor Final when the sale has no contact', async () => {
      mockInvoiceRepo.findBySaleId.mockResolvedValue(null);
      mockPrisma.sale.findUnique.mockResolvedValue({
        id: 'sale-1',
        companyId: 'company-1',
        total_cents: 12100,
        contact_id: null,
      });
      mockPrisma.arcaConfig.findFirst.mockResolvedValue(arcaConfig);

      await service.createFromSale({ saleId: 'sale-1' });

      expect(mockInvoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_name: 'Consumidor Final',
          customer_tax_id: '0',
          customer_address: '',
        }),
      );
    });

    it('uses type B for a Consumidor Final fiscal config', async () => {
      mockInvoiceRepo.findBySaleId.mockResolvedValue(null);
      mockPrisma.sale.findUnique.mockResolvedValue({
        id: 'sale-1',
        companyId: 'company-1',
        total_cents: 5000,
        contact_id: null,
      });
      mockPrisma.arcaConfig.findFirst.mockResolvedValue({
        ...arcaConfig,
        responsabilidad_iva: 'CF',
      });

      await service.createFromSale({ saleId: 'sale-1' });

      expect(mockInvoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ document_type: 'B' }),
      );
    });
  });

  describe('createGlobalDaily', () => {
    it('rejects when there is no active ARCA configuration', async () => {
      mockPrisma.arcaConfig.findFirst.mockResolvedValue(null);

      await expect(service.createGlobalDaily({})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects when a global invoice already exists for the period', async () => {
      mockPrisma.arcaConfig.findFirst.mockResolvedValue(arcaConfig);
      mockInvoiceRepo.findGlobalDaily.mockResolvedValue(buildInvoice());

      await expect(service.createGlobalDaily({})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects when there are no unbilled sales in the period', async () => {
      mockPrisma.arcaConfig.findFirst.mockResolvedValue(arcaConfig);
      mockInvoiceRepo.findGlobalDaily.mockResolvedValue(null);
      mockPrisma.sale.findMany.mockResolvedValue([]);

      await expect(service.createGlobalDaily({})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('creates a single global invoice that sums the unbilled sales', async () => {
      mockPrisma.arcaConfig.findFirst.mockResolvedValue({
        ...arcaConfig,
        responsabilidad_iva: 'CF',
      });
      mockInvoiceRepo.findGlobalDaily.mockResolvedValue(null);
      mockPrisma.sale.findMany.mockResolvedValue([
        { total_cents: 12100 },
        { total_cents: 6050 },
      ]);
      mockInvoiceRepo.create.mockResolvedValue(buildInvoice({ type: 'global' }));

      await service.createGlobalDaily({});

      expect(mockInvoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'global',
          document_type: 'B',
          customer_name: 'Consumidor Final',
          customer_tax_id: '0',
          total_cents: 18150,
          net_amount_cents: 15000,
          tax_amount_cents: 3150,
        }),
      );
    });

    it('passes explicit from/to when provided', async () => {
      mockPrisma.arcaConfig.findFirst.mockResolvedValue(arcaConfig);
      mockInvoiceRepo.findGlobalDaily.mockResolvedValue(null);
      mockPrisma.sale.findMany.mockResolvedValue([{ total_cents: 1000 }]);

      await service.createGlobalDaily({ from: 100, to: 200 });

      expect(mockInvoiceRepo.findGlobalDaily).toHaveBeenCalledWith(100, 200);
      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: { gte: 100, lte: 200 },
            invoice: { is: null },
          }),
        }),
      );
    });
  });

  describe('createCreditNote', () => {
    beforeEach(() => {
      mockPrisma.arcaConfig.findUnique.mockResolvedValue(arcaConfig);
      mockInvoiceRepo.findCreditNotesForInvoice.mockResolvedValue([]);
      mockInvoiceRepo.create.mockResolvedValue(buildInvoice());
    });

    it('rejects when the original invoice is not issued', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice({ status: 'pending' }));

      await expect(
        service.createCreditNote({ invoiceId: 'inv-1', reason: 'dev' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects creating a credit note on top of another credit note', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(
        buildInvoice({ status: 'issued', type: 'credit_note' }),
      );

      await expect(
        service.createCreditNote({ invoiceId: 'inv-1', reason: 'dev' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when a credit note already exists for the invoice', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice({ status: 'issued' }));
      mockInvoiceRepo.findCreditNotesForInvoice.mockResolvedValue([
        buildInvoice({ id: 'nc-1' }),
      ]);

      await expect(
        service.createCreditNote({ invoiceId: 'inv-1', reason: 'dev' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects amounts outside the original total', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice({ status: 'issued' }));

      await expect(
        service.createCreditNote({
          invoiceId: 'inv-1',
          reason: 'dev',
          amountCents: 12101,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates an NC-A referencing the original invoice for RI', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice({ status: 'issued' }));

      await service.createCreditNote({
        invoiceId: 'inv-1',
        reason: 'devolucion',
        amountCents: 12100,
      });

      expect(mockInvoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'credit_note',
          document_type: 'NC-A',
          saleId: 'sale-1',
          arcaConfigId: 'arca-1',
          point_of_sale: 1,
          reference_invoice_id: 'inv-1',
          reference_type: 'credit_note',
          reason: 'devolucion',
          total_cents: 12100,
          net_amount_cents: 10000,
          tax_amount_cents: 2100,
        }),
      );
    });

    it('defaults to the full original total when no amount is given', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice({ status: 'issued' }));

      await service.createCreditNote({ invoiceId: 'inv-1', reason: 'dev' });

      expect(mockInvoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ total_cents: 12100 }),
      );
    });

    it('creates an NC-B for a Consumidor Final config', async () => {
      mockPrisma.arcaConfig.findUnique.mockResolvedValue({
        ...arcaConfig,
        responsabilidad_iva: 'CF',
      });
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice({ status: 'issued' }));

      await service.createCreditNote({ invoiceId: 'inv-1', reason: 'dev' });

      expect(mockInvoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ document_type: 'NC-B' }),
      );
    });
  });

  describe('createDebitNote', () => {
    beforeEach(() => {
      mockPrisma.arcaConfig.findUnique.mockResolvedValue(arcaConfig);
      mockInvoiceRepo.create.mockResolvedValue(buildInvoice());
    });

    it('rejects when the original invoice is not issued', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice({ status: 'pending' }));

      await expect(
        service.createDebitNote({
          invoiceId: 'inv-1',
          reason: 'interes',
          amountCents: 100,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects creating a debit note on top of a debit note', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(
        buildInvoice({ status: 'issued', type: 'debit_note' }),
      );

      await expect(
        service.createDebitNote({
          invoiceId: 'inv-1',
          reason: 'interes',
          amountCents: 100,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects non-positive amounts', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice({ status: 'issued' }));

      await expect(
        service.createDebitNote({
          invoiceId: 'inv-1',
          reason: 'interes',
          amountCents: 0,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates an ND-A for RI and an ND-B for CF', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice({ status: 'issued' }));

      await service.createDebitNote({
        invoiceId: 'inv-1',
        reason: 'interes',
        amountCents: 1210,
      });

      expect(mockInvoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'debit_note',
          document_type: 'ND-A',
          reference_type: 'debit_note',
          reason: 'interes',
        }),
      );

      mockPrisma.arcaConfig.findUnique.mockResolvedValue({
        ...arcaConfig,
        responsabilidad_iva: 'CF',
      });
      await service.createDebitNote({
        invoiceId: 'inv-1',
        reason: 'recargo',
        amountCents: 1210,
      });

      expect(mockInvoiceRepo.create).toHaveBeenLastCalledWith(
        expect.objectContaining({ document_type: 'ND-B' }),
      );
    });
  });

  describe('emit', () => {
    beforeEach(() => {
      mockPrisma.arcaConfig.findUnique.mockResolvedValue(arcaConfig);
      mockArcaService.getLastVoucherNumber.mockResolvedValue(44);
    });

    it('rejects invoices that are not pending', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice({ status: 'issued' }));

      await expect(service.emit('inv-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('uses the ARCA server number + 1, never a local counter', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice());
      mockArcaService.emitVoucher.mockResolvedValue({
        success: true,
        cae: '12345678901234',
        caeExpiration: '20260920',
        rawResponse: { Resultado: 'A' },
      });

      await service.emit('inv-1');

      expect(mockArcaService.getLastVoucherNumber).toHaveBeenCalledWith(
        {
          cuit: 30112223334,
          certificate: 'CERT',
          privateKey: 'KEY',
          point_of_sale: 1,
          environment: 'homologacion',
        },
        'arca-1',
        1,
      );

      const voucher = mockArcaService.emitVoucher.mock.calls[0]![2] as Record<
        string,
        number | string | Array<Record<string, number>>
      >;
      expect(voucher).toMatchObject({
        CbteTipo: 1,
        PtoVta: 1,
        DocTipo: 80,
        DocNro: 20111111112,
        CbteDesde: 45,
        CbteHasta: 45,
        ImpTotal: 12100,
        ImpNeto: 10000,
        ImpIVA: 2100,
        CondicionIVAReceptorId: 1,
        MonId: 'PES',
        MonCotiz: 1,
      });
      expect(voucher.Iva).toEqual([
        { Id: 5, BaseImp: 10000, Importe: 2100 },
      ]);

      expect(mockInvoiceRepo.updateStatus).toHaveBeenCalledWith(
        'inv-1',
        expect.objectContaining({
          status: 'issued',
          cae: '12345678901234',
          cae_expiration: '20260920',
          number: '45',
          qr_data: expect.any(String),
          error_message: null,
        }),
      );
    });

    it('clears a previous error_message when the retry succeeds', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(
        buildInvoice({ error_message: 'ARCA rechazó el comprobante: Verifique importe' }),
      );
      mockArcaService.emitVoucher.mockResolvedValue({
        success: true,
        cae: '12345678901234',
        caeExpiration: '20260920',
        rawResponse: { Resultado: 'A' },
      });

      await service.emit('inv-1');

      expect(mockInvoiceRepo.updateStatus).toHaveBeenCalledWith(
        'inv-1',
        expect.objectContaining({ status: 'issued', error_message: null }),
      );
    });

    it('marks a business error as non-retryable and bumps retry_count', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice());
      mockArcaService.emitVoucher.mockResolvedValue({
        success: false,
        error: '10014: Verifique importe',
        isBusinessError: true,
      });

      const result = await service.emit('inv-1');

      expect(result).toEqual({
        invoiceId: 'inv-1',
        success: false,
        error: 'ARCA rechazó el comprobante: Verifique importe',
        isBusinessError: true,
      });
      expect(mockInvoiceRepo.updateStatus).toHaveBeenCalledWith(
        'inv-1',
        expect.objectContaining({
          status: 'error',
          retry_count: 1,
          error_message: 'ARCA rechazó el comprobante: Verifique importe',
          arca_response: JSON.stringify({ error: '10014: Verifique importe' }),
        }),
      );
    });

    it('keeps a network failure pending for the retry worker', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice());
      mockArcaService.emitVoucher.mockResolvedValue({
        success: false,
        error: 'connect ETIMEDOUT',
        isBusinessError: false,
      });

      const result = await service.emit('inv-1');

      expect(result.success).toBe(false);
      expect(result.isBusinessError).toBe(false);
      expect(result.error).toBe(
        'No se pudo conectar con ARCA. Verificá la conexión a internet e intentá de nuevo.',
      );
      expect(mockInvoiceRepo.updateStatus).toHaveBeenCalledWith(
        'inv-1',
        expect.objectContaining({
          status: 'pending',
          retry_count: 1,
          error_message:
            'No se pudo conectar con ARCA. Verificá la conexión a internet e intentá de nuevo.',
          arca_response: JSON.stringify({ error: 'connect ETIMEDOUT' }),
        }),
      );
    });

    it('builds the ARCA QR payload as a URL-safe base64 JSON with codAut', async () => {
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice());
      mockArcaService.emitVoucher.mockResolvedValue({
        success: true,
        cae: '12345678901234',
        caeExpiration: '20260920',
        rawResponse: {},
      });

      await service.emit('inv-1');

      const update = mockInvoiceRepo.updateStatus.mock.calls[0]![1] as {
        qr_data?: string;
      };
      const decoded = Buffer.from(update.qr_data ?? '', 'base64').toString('utf8');
      const payload = JSON.parse(decoded) as {
        ver: number;
        cuit: number;
        ptoVta: number;
        tipoCmp: number;
        nroCmp: number;
        importe: number;
        moneda: string;
        ctz: number;
        tipoDocRec: number;
        nroDocRec: number;
        tipoCodAut: string;
        codAut: number;
      };
      expect(payload.ver).toBe(1);
      expect(payload.cuit).toBe(30112223334);
      expect(payload.ptoVta).toBe(1);
      expect(payload.tipoCmp).toBe(1);
      expect(payload.nroCmp).toBe(45);
      expect(payload.importe).toBe(12100);
      expect(payload.moneda).toBe('PES');
      expect(payload.ctz).toBe(1);
      expect(payload.tipoDocRec).toBe(80);
      expect(payload.tipoCodAut).toBe('E');
      expect(payload.codAut).toBe(12345678901234);
    });
  });

  describe('emitBatch', () => {
    it('short-circuits when there is nothing retryable', async () => {
      mockInvoiceRepo.findRetryable.mockResolvedValue([]);

      await expect(service.emitBatch()).resolves.toEqual({
        total: 0,
        issued: 0,
        failed: 0,
        results: [],
      });
    });

    it('counts issued/failed and keeps emitting after a failure', async () => {
      mockInvoiceRepo.findRetryable.mockResolvedValue([
        buildInvoice({ id: 'inv-a' }),
        buildInvoice({ id: 'inv-b' }),
      ]);
      mockInvoiceRepo.findById.mockImplementation((id: string) =>
        Promise.resolve(buildInvoice({ id })),
      );
      mockPrisma.arcaConfig.findUnique.mockResolvedValue(arcaConfig);
      mockArcaService.getLastVoucherNumber.mockResolvedValue(5);
      mockArcaService.emitVoucher
        .mockResolvedValueOnce({
          success: true,
          cae: '12345678901234',
          caeExpiration: '20260920',
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'timeout',
          isBusinessError: false,
        });

      const result = await service.emitBatch();

      expect(result.total).toBe(2);
      expect(result.issued).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results[0]?.success).toBe(true);
      expect(result.results[1]).toEqual({
        invoiceId: 'inv-b',
        success: false,
        error: 'No se pudo conectar con ARCA. Verificá la conexión a internet e intentá de nuevo.',
        isBusinessError: false,
      });
    });

    it('swallows unexpected errors into a failed result', async () => {
      mockInvoiceRepo.findRetryable.mockResolvedValue([buildInvoice({ id: 'inv-a' })]);
      mockInvoiceRepo.findById.mockResolvedValue(buildInvoice({ id: 'inv-a' }));
      mockPrisma.arcaConfig.findUnique.mockResolvedValue(arcaConfig);
      mockArcaService.getLastVoucherNumber.mockRejectedValue(new Error('boom'));

      const result = await service.emitBatch();

      expect(result.issued).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results[0]).toEqual({
        invoiceId: 'inv-a',
        success: false,
        error: 'Ocurrió un error al comunicarse con ARCA. Intentá nuevamente en unos minutos.',
        isBusinessError: false,
      });
    });
  });

  describe('generateFiscalPdfHtml', () => {
    const issued = buildInvoice({
      status: 'issued',
      number: '45',
      cae: '12345678901234',
      cae_expiration: '20260920',
      qr_data: 'dGVzdA==',
      issued_at: 1750000000,
    });

    it('renders the fiscal header, totals, CAE and QR block', async () => {
      const html = await service.generateFiscalPdfHtml({
        document_type: issued.document_type,
        number: issued.number,
        point_of_sale: issued.point_of_sale,
        customer_name: issued.customer_name,
        customer_tax_id: issued.customer_tax_id,
        customer_address: issued.customer_address,
        total_cents: issued.total_cents,
        net_amount_cents: issued.net_amount_cents,
        tax_amount_cents: issued.tax_amount_cents,
        cae: issued.cae,
        cae_expiration: issued.cae_expiration,
        qr_data: 'dGVzdA==',
        issued_at: issued.issued_at,
        type: issued.type,
      });

      expect(html).toContain('FACTURA A');
      expect(html).toContain('N° 0001-45');
      expect(html).toContain('CAE:');
      expect(html).toContain('12345678901234');
      expect(html).toContain('data:image/png;base64,');
      expect(html).toContain('121.00');
      expect(html).toContain('100.00');
      expect(html).toContain('Documento No Válido como Factura');
    });

    it('marks credit notes with their reason and skips the QR block', async () => {
      const html = await service.generateFiscalPdfHtml({
        document_type: 'NC-A',
        number: null,
        point_of_sale: 1,
        customer_name: issued.customer_name,
        customer_tax_id: issued.customer_tax_id,
        customer_address: null,
        total_cents: 12100,
        net_amount_cents: 10000,
        tax_amount_cents: 2100,
        cae: null,
        cae_expiration: null,
        qr_data: null,
        issued_at: null,
        type: 'credit_note',
        reason: 'Devolución por mercadería defectuosa',
      });

      expect(html).toContain('NOTA DE CREDITO');
      expect(html).toContain('Devolución por mercadería defectuosa');
      expect(html).not.toContain('data:image/png;base64,');
    });
  });
});