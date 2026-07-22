import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SalesService, CreateSaleInput, SaleFilters } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  async findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    const filters: SaleFilters = {};

    if (from) {
      filters.from = parseInt(from, 10);
    }
    if (to) {
      filters.to = parseInt(to, 10);
    }
    if (status) {
      filters.status = status;
    }

    return this.salesService.findAll(
      Object.keys(filters).length > 0 ? filters : undefined,
    );
  }

  @Get('stats')
  async getStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromNum = from ? parseInt(from, 10) : undefined;
    const toNum = to ? parseInt(to, 10) : undefined;

    return this.salesService.getStats(fromNum, toNum);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() input: CreateSaleInput) {
    return this.salesService.create(input);
  }
}
