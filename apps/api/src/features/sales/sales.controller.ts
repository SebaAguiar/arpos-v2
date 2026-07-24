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
import { Public } from '../auth/guards/public.decorator';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Public()
  @Get()
  findAll(@ZodQuery(SaleFiltersSchema) filters: SaleFiltersInput) {
    return this.salesService.findAll(filters);
  }

  @Public()
  @Get('stats')
  getStats(@ZodQuery(SaleFiltersSchema) filters: SaleFiltersInput) {
    return this.salesService.getStats(filters.from, filters.to);
  }

  @Public()
  @Get('by-payment-method')
  getByPaymentMethod(@ZodQuery(SaleFiltersSchema) filters: SaleFiltersInput) {
    return this.salesService.getSalesByPaymentMethod(filters.from, filters.to);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@ZodBody(CreateSaleSchema) input: CreateSaleInput) {
    return this.salesService.create(input);
  }
}
