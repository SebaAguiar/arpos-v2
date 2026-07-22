import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  findAll() {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();
    return this.productsService.findAll(companyId, storeId || undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      code: string;
      name: string;
      description?: string;
      price_cents: number;
      cost_cents?: number;
      stock_quantity?: number;
      sku?: string;
      category_id?: string;
      storeId: string;
    },
  ) {
    const companyId = this.tenantContext.getCompanyId();
    return this.productsService.create(body, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      description: string;
      price_cents: number;
      cost_cents: number;
      sku: string;
      category_id: string;
      is_active: boolean;
    }>,
  ) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
