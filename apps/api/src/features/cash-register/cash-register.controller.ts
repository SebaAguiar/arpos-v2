import { Controller, Get, Post, Param } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { OpenCashRegisterSchema, OpenCashRegisterInput } from './dto/open-cash-register.schema';
import { CloseCashRegisterSchema, CloseCashRegisterInput } from './dto/close-cash-register.schema';
import { CreateCashMovementSchema, CreateCashMovementInput } from './dto/create-cash-movement.schema';

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

  @Get(':id/movements')
  getMovements(@Param('id') id: string) {
    return this.cashRegisterService.getMovements(id);
  }

  @Post()
  open(@ZodBody(OpenCashRegisterSchema) input: OpenCashRegisterInput) {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();
    return this.cashRegisterService.open(input, companyId, storeId);
  }

  @Post(':id/close')
  close(@Param('id') id: string, @ZodBody(CloseCashRegisterSchema) input: CloseCashRegisterInput) {
    return this.cashRegisterService.close(id, input.closing_amount);
  }

  @Post(':id/movements')
  createMovement(
    @Param('id') id: string,
    @ZodBody(CreateCashMovementSchema) input: CreateCashMovementInput,
  ) {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();
    return this.cashRegisterService.createMovement(id, input, companyId, storeId);
  }
}
