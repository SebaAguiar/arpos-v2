import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { CreateSaleSchema, CreateSaleInput } from './dto/create-sale.schema';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  async findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    return this.salesService.findAll({
      from: from ? parseInt(from, 10) : undefined,
      to: to ? parseInt(to, 10) : undefined,
      status,
    });
  }

  @Get('stats')
  async getStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.salesService.getStats(
      from ? parseInt(from, 10) : undefined,
      to ? parseInt(to, 10) : undefined,
    );
  }

  @Get('by-payment-method')
  async getByPaymentMethod(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.salesService.getSalesByPaymentMethod(
      from ? parseInt(from, 10) : undefined,
      to ? parseInt(to, 10) : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@ZodBody(CreateSaleSchema) input: CreateSaleInput) {
    return this.salesService.create(input);
  }
}
