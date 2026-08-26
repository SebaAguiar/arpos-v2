import { Injectable, Logger } from '@nestjs/common';
import { Arca, type Context } from '@arcasdk/core';
import type { IVoucher } from '@arcasdk/core/lib/domain/types/voucher.types';
import type { CreateVoucherResultDto, LastVoucherResultDto } from '@arcasdk/core';

export interface ArcaConfigData {
  cuit: number;
  certificate: string;
  privateKey: string;
  point_of_sale: number;
  environment: string;
}

export interface EmitVoucherResult {
  success: boolean;
  cae?: string;
  caeExpiration?: string;
  rawResponse?: unknown;
  error?: string;
  isBusinessError?: boolean;
}

@Injectable()
export class ArcaService {
  private readonly logger = new Logger(ArcaService.name);
  private readonly clients = new Map<string, Arca>();

  private createClient(config: ArcaConfigData): Arca {
    const context: Context = {
      cuit: config.cuit,
      cert: config.certificate,
      key: config.privateKey,
      production: config.environment === 'produccion',
    };
    return new Arca(context);
  }

  private getClient(configId: string, config: ArcaConfigData): Arca {
    let client = this.clients.get(configId);
    if (!client) {
      client = this.createClient(config);
      this.clients.set(configId, client);
    }
    return client;
  }

  invalidateClient(configId: string): void {
    this.clients.delete(configId);
  }

  async getLastVoucherNumber(
    config: ArcaConfigData,
    configId: string,
    type: number,
  ): Promise<number> {
    const client = this.getClient(configId, config);
    const result: LastVoucherResultDto = await client.electronicBillingService.getLastVoucher(
      config.point_of_sale,
      type,
    );

    if (result.errors?.err?.length) {
      const errMsg = result.errors.err.map((e) => `${e.code}: ${e.msg}`).join('; ');
      throw new Error(`ARCA getLastVoucher error: ${errMsg}`);
    }

    return result.cbteNro;
  }

  async emitVoucher(
    config: ArcaConfigData,
    configId: string,
    voucher: IVoucher,
  ): Promise<EmitVoucherResult> {
    const client = this.getClient(configId, config);

    try {
      this.logger.log(
        `Emitting voucher type=${voucher.CbteTipo} ptoVta=${voucher.PtoVta} doc=${voucher.DocNro} total=${voucher.ImpTotal}`,
      );

      const result: CreateVoucherResultDto =
        await client.electronicBillingService.createVoucher(voucher);

      const response = result.response;
      const errors = response.Errors?.Err;
      const observations = response.FeDetResp?.FECAEDetResponse?.[0]?.Observaciones?.Obs;

      if (errors?.length) {
        const errMsg = errors.map((e) => `${e.Code}: ${e.Msg}`).join('; ');
        this.logger.error(`ARCA business error: ${errMsg}`);
        return {
          success: false,
          error: errMsg,
          isBusinessError: true,
          rawResponse: response,
        };
      }

      if (observations?.length) {
        const obsMsg = observations.map((o) => `${o.Code}: ${o.Msg}`).join('; ');
        this.logger.warn(`ARCA observations: ${obsMsg}`);
      }

      return {
        success: true,
        cae: result.cae,
        caeExpiration: result.caeFchVto,
        rawResponse: response,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown ARCA error';
      this.logger.error(`ARCA network/timeout error: ${message}`);
      return {
        success: false,
        error: message,
        isBusinessError: false,
      };
    }
  }

  async getSalesPoints(config: ArcaConfigData, configId: string) {
    const client = this.getClient(configId, config);
    return client.electronicBillingService.getSalesPoints();
  }

  async getVoucherTypes(config: ArcaConfigData, configId: string) {
    const client = this.getClient(configId, config);
    return client.electronicBillingService.getVoucherTypes();
  }

  async getServerStatus(config: ArcaConfigData, configId: string) {
    const client = this.getClient(configId, config);
    return client.electronicBillingService.getServerStatus();
  }
}
