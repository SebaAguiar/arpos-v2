import { Controller, Get, Post } from '@nestjs/common';
import { SetupService } from './setup.service';
import { Public } from '../auth/guards/public.decorator';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { InitCompanySchema, InitCompanyInput } from './dto/init-company.schema';

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Public()
  @Get('status')
  async getSetupStatus() {
    return this.setupService.getSetupStatus();
  }

  @Public()
  @Post('init-company')
  async initCompany(@ZodBody(InitCompanySchema) dto: InitCompanyInput) {
    return this.setupService.initCompany(dto);
  }
}
