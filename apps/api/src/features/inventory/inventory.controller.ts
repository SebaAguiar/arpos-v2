import { Controller, Get, Post, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { CreateMovementSchema, CreateMovementInput } from './dto/create-movement.schema';
import { ListMovementsSchema, ListMovementsInput } from './dto/list-movements.schema';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  listStock() {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();
    return this.inventoryService.listStock(companyId, storeId);
  }

  @Get('report')
  getReport() {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();
    return this.inventoryService.getReport(companyId, storeId);
  }

  @Get('movements')
  listMovements(@Query(ListMovementsSchema) query: ListMovementsInput) {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();
    return this.inventoryService.listMovements(companyId, storeId, query);
  }

  @Post('movements')
  createMovement(@ZodBody(CreateMovementSchema) input: CreateMovementInput) {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();
    return this.inventoryService.createMovement(input, companyId, storeId);
  }
}
