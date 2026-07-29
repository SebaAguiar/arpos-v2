import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { ZodQuery } from '../../core/validation/zod-query.decorator';
import { CreateSaleSchema, CreateSaleInput } from './dto/create-sale.schema';
import { SaleFiltersSchema, SaleFiltersInput } from './dto/sale-filters.schema';
import { TopProductsSchema, TopProductsInput } from './dto/top-products.schema';
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll(@ZodQuery(SaleFiltersSchema) filters: SaleFiltersInput) {
    return this.salesService.findAll(filters);
  }

  @Get('stats')
  getStats(@ZodQuery(SaleFiltersSchema) filters: SaleFiltersInput) {
    return this.salesService.getStats(filters.from, filters.to);
  }

  @Get('by-payment-method')
  getByPaymentMethod(@ZodQuery(SaleFiltersSchema) filters: SaleFiltersInput) {
    return this.salesService.getSalesByPaymentMethod(filters.from, filters.to);
  }

  @Get('top-products')
  getTopProducts(@ZodQuery(TopProductsSchema) query: TopProductsInput) {
    return this.salesService.getTopProducts(query.from, query.to, query.limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@ZodBody(CreateSaleSchema) input: CreateSaleInput) {
    return this.salesService.create(input);
  }
}
