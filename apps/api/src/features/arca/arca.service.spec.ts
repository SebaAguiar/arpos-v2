import { ArcaService, type ArcaConfigData } from './arca.service';
import type { IVoucher } from '@arcasdk/core/lib/domain/types/voucher.types';

const mockEbService = {
  getLastVoucher: jest.fn(),
  createVoucher: jest.fn(),
  getSalesPoints: jest.fn(),
  getVoucherTypes: jest.fn(),
  getServerStatus: jest.fn(),
};

const mockArcaInstance = {
  electronicBillingService: mockEbService,
};

jest.mock('@arcasdk/core', () => ({
  Arca: jest.fn(() => mockArcaInstance),
}));

import { Arca } from '@arcasdk/core';

const mockedArcaConstructor = Arca as unknown as jest.Mock;

describe('ArcaService', () => {
  let service: ArcaService;

  const config: ArcaConfigData = {
    cuit: 20111111112,
    certificate: 'BASE64_CERT',
    privateKey: 'BASE64_KEY',
    point_of_sale: 1,
    environment: 'homologacion',
  };

  const configId = 'arca-1';

  const voucher: IVoucher = {
    CantReg: 1,
    PtoVta: 1,
    CbteTipo: 6,
    Concepto: 1,
    DocTipo: 99,
    DocNro: 0,
    CbteDesde: 45,
    CbteHasta: 45,
    CbteFch: '20260905',
    ImpTotal: 12100,
    ImpTotConc: 0,
    ImpNeto: 10000,
    ImpOpEx: 0,
    ImpIVA: 2100,
    ImpTrib: 0,
    MonId: 'PES',
    MonCotiz: 1,
    CondicionIVAReceptorId: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ArcaService();
  });

  describe('client creation', () => {
    it('builds a homologacion client context (production=false)', async () => {
      mockEbService.getLastVoucher.mockResolvedValue({ cbteNro: 12 });

      await service.getLastVoucherNumber(config, configId, 6);

      expect(mockedArcaConstructor).toHaveBeenCalledWith({
        cuit: 20111111112,
        cert: 'BASE64_CERT',
        key: 'BASE64_KEY',
        production: false,
      });
    });

    it('builds a produccion client context (production=true)', async () => {
      mockEbService.getLastVoucher.mockResolvedValue({ cbteNro: 12 });

      await service.getLastVoucherNumber(
        { ...config, environment: 'produccion' },
        configId,
        6,
      );

      expect(mockedArcaConstructor).toHaveBeenCalledWith(
        expect.objectContaining({ production: true }),
      );
    });

    it('reuses the client for the same configId', async () => {
      mockEbService.getLastVoucher.mockResolvedValue({ cbteNro: 12 });

      await service.getLastVoucherNumber(config, configId, 6);
      await service.getLastVoucherNumber(config, configId, 6);

      expect(mockedArcaConstructor).toHaveBeenCalledTimes(1);
    });

    it('creates a fresh client after invalidateClient', async () => {
      mockEbService.getLastVoucher.mockResolvedValue({ cbteNro: 12 });

      await service.getLastVoucherNumber(config, configId, 6);
      service.invalidateClient(configId);
      await service.getLastVoucherNumber(config, configId, 6);

      expect(mockedArcaConstructor).toHaveBeenCalledTimes(2);
    });
  });

  describe('getLastVoucherNumber', () => {
    it('returns the last voucher number when ARCA has no errors', async () => {
      mockEbService.getLastVoucher.mockResolvedValue({ cbteNro: 44 });

      await expect(
        service.getLastVoucherNumber(config, configId, 6),
      ).resolves.toBe(44);
      expect(mockEbService.getLastVoucher).toHaveBeenCalledWith(1, 6);
    });

    it('maps ARCA errors into a descriptive exception', async () => {
      mockEbService.getLastVoucher.mockResolvedValue({
        cbteNro: 0,
        errors: { err: [{ code: 10049, msg: 'Metodo no habilitado' }] },
      });

      await expect(
        service.getLastVoucherNumber(config, configId, 6),
      ).rejects.toThrow('ARCA getLastVoucher error: 10049: Metodo no habilitado');
    });
  });

  describe('emitVoucher', () => {
    it('returns cae and caeExpiration on a successful emission', async () => {
      mockEbService.createVoucher.mockResolvedValue({
        response: {
          FeCabResp: { Resultado: 'A' },
          FeDetResp: { FECAEDetResponse: [{ Resultado: 'A', CAE: '12345678901234' }] },
        },
        cae: '12345678901234',
        caeFchVto: '20260920',
      });

      const result = await service.emitVoucher(config, configId, voucher);

      expect(result.success).toBe(true);
      expect(result.cae).toBe('12345678901234');
      expect(result.caeExpiration).toBe('20260920');
      expect(result.isBusinessError).toBeUndefined();
      expect(mockEbService.createVoucher).toHaveBeenCalledWith(voucher);
    });

    it('still succeeds when ARCA returns observations (non-fatal)', async () => {
      mockEbService.createVoucher.mockResolvedValue({
        response: {
          FeCabResp: { Resultado: 'P' },
          FeDetResp: {
            FECAEDetResponse: [
              {
                Resultado: 'P',
                CAE: '12345678901234',
                Observaciones: { Obs: [{ Code: 42, Msg: 'IU' }] },
              },
            ],
          },
        },
        cae: '12345678901234',
        caeFchVto: '20260920',
      });

      const result = await service.emitVoucher(config, configId, voucher);

      expect(result.success).toBe(true);
      expect(result.cae).toBe('12345678901234');
    });

    it('returns a business error for ARCA validation errors (isBusinessError=true)', async () => {
      mockEbService.createVoucher.mockResolvedValue({
        response: {
          Errors: { Err: [{ Code: 10014, Msg: 'Verifique fecha de comprobante' }] },
        },
        cae: '',
        caeFchVto: '',
      });

      const result = await service.emitVoucher(config, configId, voucher);

      expect(result.success).toBe(false);
      expect(result.isBusinessError).toBe(true);
      expect(result.error).toContain('10014: Verifique fecha de comprobante');
      expect(result.rawResponse).toBeDefined();
    });

    it('maps a thrown SDK error to a network/timeout failure (isBusinessError=false)', async () => {
      mockEbService.createVoucher.mockRejectedValue(new Error('connect ETIMEDOUT'));

      const result = await service.emitVoucher(config, configId, voucher);

      expect(result.success).toBe(false);
      expect(result.isBusinessError).toBe(false);
      expect(result.error).toBe('connect ETIMEDOUT');
    });

    it('never lets a timeout masquerade as a CAE (golden fiscal rule)', async () => {
      mockEbService.createVoucher.mockRejectedValue(new Error('socket hang up'));

      const result = await service.emitVoucher(config, configId, voucher);

      expect(result.cae).toBeUndefined();
      expect(result.success).toBe(false);
    });
  });

  describe('metadata lookups', () => {
    it('forwards getSalesPoints to the underlying service', async () => {
      const expected = { resultGet: { ptoVenta: [{ nro: 1 }] } };
      mockEbService.getSalesPoints.mockResolvedValue(expected);

      await expect(service.getSalesPoints(config, configId)).resolves.toEqual(
        expected,
      );
    });

    it('forwards getVoucherTypes to the underlying service', async () => {
      const expected = { resultGet: { cbteTipo: [{ id: 6 }] } };
      mockEbService.getVoucherTypes.mockResolvedValue(expected);

      await expect(service.getVoucherTypes(config, configId)).resolves.toEqual(
        expected,
      );
    });

    it('forwards getServerStatus to the underlying service', async () => {
      const expected = { serverStatus: 'running' };
      mockEbService.getServerStatus.mockResolvedValue(expected);

      await expect(service.getServerStatus(config, configId)).resolves.toEqual(
        expected,
      );
    });
  });
});