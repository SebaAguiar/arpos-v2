import { Controller, Get, Patch } from '@nestjs/common';
import { CompanyService } from './company.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { updateCompanySchema, UpdateCompanyInput } from './dto/update-company.schema';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  async getCompany() {
    return this.companyService.getCompany();
  }

  @Patch()
  async updateCompany(@ZodBody(updateCompanySchema) input: UpdateCompanyInput) {
    return this.companyService.updateCompany(input);
  }
}
