import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

export interface InitCompanyInput {
  companyName: string;
  taxId: string;
  adminEmail: string;
  adminPassword: string;
}

@Injectable()
export class SetupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getSetupStatus() {
    const companyCount = await this.prisma.company.count();
    return { isInitialized: companyCount > 0 };
  }

  async initCompany(dto: InitCompanyInput) {
    const existingCompany = await this.prisma.company.count();
    if (existingCompany > 0) {
      throw new ConflictException('Company already initialized');
    }

    const now = Math.floor(Date.now() / 1000);
    const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);

    const { company, store, adminUser } = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          taxId: dto.taxId,
          created_at: now,
          updated_at: now,
        },
      });

      const store = await tx.store.create({
        data: {
          companyId: company.id,
          name: 'Sucursal Principal',
          created_at: now,
          updated_at: now,
        },
      });

      const adminUser = await tx.user.create({
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

      return { company, store, adminUser };
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
