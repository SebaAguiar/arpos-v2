import { Controller, Get, Post, Body } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export class InitCompanyDto {
  companyName!: string;
  taxId!: string;
  adminEmail!: string;
  adminPassword!: string;
}

@Controller('setup')
export class SetupController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Get('status')
  async getSetupStatus() {
    const companyCount = await this.prisma.company.count();
    return {
      isInitialized: companyCount > 0,
    };
  }

  @Post('init-company')
  async initCompany(@Body() dto: InitCompanyDto) {
    const existingCompany = await this.prisma.company.count();
    if (existingCompany > 0) {
      throw new Error('Company already initialized');
    }

    const now = Date.now();

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
        password: dto.adminPassword,
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
