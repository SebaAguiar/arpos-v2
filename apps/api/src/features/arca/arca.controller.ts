import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ArcaService, ArcaConfigData } from './arca.service';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { z } from 'zod';

const ArcaQuerySchema = z.object({
  arcaConfigId: z.string().optional(),
});

const SaveArcaConfigSchema = z.object({
  cuit: z.number().int().min(10000000000).max(99999999999),
  certificate: z.string().min(1, 'Certificate is required'),
  privateKey: z.string().min(1, 'Private key is required'),
  point_of_sale: z.number().int().positive().default(1),
  environment: z.enum(['homologacion', 'produccion']).default('homologacion'),
  responsabilidad_iva: z
    .enum(['RI', 'RM', 'CF', 'RN', 'EX', 'MT', 'SM', 'MI'])
    .default('CF'),
});

type SaveArcaConfigInput = z.infer<typeof SaveArcaConfigSchema>;
type ConfigRow = {
  id: string;
  cuit: bigint;
  point_of_sale: number;
  environment: string;
  responsabilidad_iva: string;
  active: boolean;
  created_at: number;
  updated_at: number;
};

function serializeConfig(row: ConfigRow) {
  return { ...row, cuit: Number(row.cuit) };
}

@Controller('arca')
export class ArcaController {
  constructor(
    private readonly arcaService: ArcaService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('config')
  @HttpCode(HttpStatus.OK)
  async getConfig() {
    const companyId = this.tenantContext.getCompanyId();
    const config = await this.prisma.arcaConfig.findFirst({
      where: { companyId, active: true },
      select: {
        id: true,
        cuit: true,
        point_of_sale: true,
        environment: true,
        responsabilidad_iva: true,
        active: true,
        created_at: true,
        updated_at: true,
      },
    });
    return config ? serializeConfig(config) : null;
  }

  @Post('config')
  @HttpCode(HttpStatus.OK)
  async saveConfig(@ZodBody(SaveArcaConfigSchema) input: SaveArcaConfigInput) {
    const companyId = this.tenantContext.getCompanyId();
    const now = Math.floor(Date.now() / 1000);

    const existing = await this.prisma.arcaConfig.findFirst({
      where: { companyId, active: true },
    });

    if (existing) {
      const updated = await this.prisma.arcaConfig.update({
        where: { id: existing.id },
        data: {
          cuit: input.cuit,
          certificate: input.certificate,
          privateKey: input.privateKey,
          point_of_sale: input.point_of_sale,
          environment: input.environment,
          responsabilidad_iva: input.responsabilidad_iva,
          updated_at: now,
        },
        select: {
          id: true,
          cuit: true,
          point_of_sale: true,
          environment: true,
          responsabilidad_iva: true,
          active: true,
          created_at: true,
          updated_at: true,
        },
      });

      this.arcaService.invalidateClient(existing.id);
      return serializeConfig(updated);
    }

    const created = await this.prisma.arcaConfig.create({
      data: {
        companyId,
        cuit: input.cuit,
        certificate: input.certificate,
        privateKey: input.privateKey,
        point_of_sale: input.point_of_sale,
        environment: input.environment,
        responsabilidad_iva: input.responsabilidad_iva,
        active: true,
        created_at: now,
        updated_at: now,
      },
      select: {
        id: true,
        cuit: true,
        point_of_sale: true,
        environment: true,
        responsabilidad_iva: true,
        active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return serializeConfig(created);
  }

  @Delete('config')
  @HttpCode(HttpStatus.OK)
  async deleteConfig() {
    const companyId = this.tenantContext.getCompanyId();
    const config = await this.prisma.arcaConfig.findFirst({
      where: { companyId, active: true },
    });

    if (!config) {
      throw new BadRequestException('No active ARCA configuration found');
    }

    this.arcaService.invalidateClient(config.id);

    await this.prisma.arcaConfig.update({
      where: { id: config.id },
      data: { active: false, updated_at: Math.floor(Date.now() / 1000) },
    });

    return { success: true };
  }

  @Get('server-status')
  @HttpCode(HttpStatus.OK)
  async getServerStatus(@Query(ArcaQuerySchema) query: { arcaConfigId?: string }) {
    const config = await this.resolveConfig(query.arcaConfigId);
    return this.arcaService.getServerStatus(config.data, config.id);
  }

  @Get('sales-points')
  @HttpCode(HttpStatus.OK)
  async getSalesPoints(@Query(ArcaQuerySchema) query: { arcaConfigId?: string }) {
    const config = await this.resolveConfig(query.arcaConfigId);
    return this.arcaService.getSalesPoints(config.data, config.id);
  }

  @Get('voucher-types')
  @HttpCode(HttpStatus.OK)
  async getVoucherTypes(@Query(ArcaQuerySchema) query: { arcaConfigId?: string }) {
    const config = await this.resolveConfig(query.arcaConfigId);
    return this.arcaService.getVoucherTypes(config.data, config.id);
  }

  private async resolveConfig(arcaConfigId?: string) {
    const companyId = this.tenantContext.getCompanyId();

    let arcaConfig;
    if (arcaConfigId) {
      arcaConfig = await this.prisma.arcaConfig.findFirst({
        where: { id: arcaConfigId, companyId, active: true },
      });
    } else {
      arcaConfig = await this.prisma.arcaConfig.findFirst({
        where: { companyId, active: true },
      });
    }

    if (!arcaConfig) {
      throw new BadRequestException('No active ARCA configuration found');
    }

    return {
      id: arcaConfig.id,
      data: {
        cuit: Number(arcaConfig.cuit),
        certificate: arcaConfig.certificate,
        privateKey: arcaConfig.privateKey,
        point_of_sale: arcaConfig.point_of_sale,
        environment: arcaConfig.environment,
      } satisfies ArcaConfigData,
    };
  }
}
