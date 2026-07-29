import { Controller, Get, Post, Patch, Delete, Param, Query } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { CreateOrderSchema, CreateOrderInput } from './dto/create-order.schema';
import { UpdateOrderSchema, UpdateOrderInput } from './dto/update-order.schema';
import { ReceiveOrderSchema, ReceiveOrderInput } from './dto/receive-order.schema';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.purchasesService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }

  @Post()
  create(@ZodBody(CreateOrderSchema) input: CreateOrderInput) {
    return this.purchasesService.create(input);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @ZodBody(UpdateOrderSchema) input: UpdateOrderInput,
  ) {
    return this.purchasesService.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.purchasesService.remove(id);
  }

  @Post('receive')
  receive(@ZodBody(ReceiveOrderSchema) input: ReceiveOrderInput) {
    return this.purchasesService.receive(input);
  }
}
