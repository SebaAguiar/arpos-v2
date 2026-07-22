import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

class OpenCashRegisterDto {
  name!: string;
  opening_amount!: number;
}

class CloseCashRegisterDto {
  closing_amount!: number;
}

@Controller('cash-registers')
export class CashRegisterController {
  constructor(
    private readonly cashRegisterService: CashRegisterService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  findAll() {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();
    return this.cashRegisterService.findAll(companyId, storeId);
  }

  @Get('current')
  findCurrent() {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();
    return this.cashRegisterService.findCurrent(companyId, storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashRegisterService.findOne(id);
  }

  @Post()
  open(@Body() dto: OpenCashRegisterDto) {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();
    return this.cashRegisterService.open(dto, companyId, storeId);
  }

  @Post(':id/close')
  close(@Param('id') id: string, @Body() dto: CloseCashRegisterDto) {
    return this.cashRegisterService.close(id, dto.closing_amount);
  }
}
