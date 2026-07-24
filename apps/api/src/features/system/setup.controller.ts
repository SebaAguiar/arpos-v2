import { Controller, Get, Post } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/guards/public.decorator';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { InitCompanySchema, InitCompanyInput } from './dto/init-company.schema';
import * as bcrypt from 'bcryptjs';

@Controller('setup')
export class SetupController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('status')
  async getSetupStatus() {
    const companyCount = await this.prisma.company.count();
    return { isInitialized: companyCount > 0 };
  }

  @Public()
  @Post('init-company')
  async initCompany(@ZodBody(InitCompanySchema) dto: InitCompanyInput) {
    const existingCompany = await this.prisma.company.count();
    if (existingCompany > 0) {
      return { message: 'Company already initialized', statusCode: 409 };
    }

    const now = Math.floor(Date.now() / 1000);
    const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        taxId: dto.taxId,
        created_at: now,
        updated_at: now,
      },
    });

    const store = await this.prisma.store.create({
      data: {
        companyId: company.id,
        name: 'Sucursal Principal',
        created_at: now,
        updated_at: now,
      },
    });

    const adminUser = await this.prisma.user.create({
      data: {
        companyId: company.id,
        email: dto.adminEmail,
        password: hashedPassword,
        name: 'Administrador',
        role: 'admin',
        created_at: now,
        updated_at: now,
      },
    });

    this.configService.set('LOCAL_COMPANY_ID', company.id);
    this.configService.set('LOCAL_STORE_ID', store.id);

    return {
      companyId: company.id,
      storeId: store.id,
      userId: adminUser.id,
      message: 'Company initialized successfully',
    };
  }
}
