import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { Public } from '../auth/guards/public.decorator';
import { ProductsService } from './products.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { CreateProductSchema, CreateProductInput } from './dto/create-product.schema';
import { UpdateProductSchema, UpdateProductInput } from './dto/update-product.schema';

@Public()
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  findAll() {
    const storeId = this.tenantContext.getStoreId();
    return this.productsService.findAll(storeId || undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@ZodBody(CreateProductSchema) input: CreateProductInput) {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();
    return this.productsService.create(input, companyId, storeId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @ZodBody(UpdateProductSchema) input: UpdateProductInput) {
    return this.productsService.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
