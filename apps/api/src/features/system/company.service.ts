import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { UpdateCompanyInput } from './dto/update-company.schema';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async getCompany() {
    const companyId = this.tenantContext.getCompanyId();
    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async updateCompany(data: UpdateCompanyInput) {
    const companyId = this.tenantContext.getCompanyId();
    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...data,
        updated_at: Math.floor(Date.now() / 1000),
      },
    });
  }
}
