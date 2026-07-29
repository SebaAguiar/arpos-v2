import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { VariantsService } from './variants.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { CreateVariantSchema, CreateVariantInput } from './dto/create-variant.schema';
import { UpdateVariantSchema, UpdateVariantInput } from './dto/update-variant.schema';

@Controller('variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Get()
  findByProduct(@Query('productId') productId: string) {
    return this.variantsService.findByProduct(productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.variantsService.findOne(id);
  }

  @Post()
  create(@ZodBody(CreateVariantSchema) input: CreateVariantInput) {
    return this.variantsService.create(input);
  }

  @Patch(':id')
  update(@Param('id') id: string, @ZodBody(UpdateVariantSchema) input: UpdateVariantInput) {
    return this.variantsService.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.variantsService.remove(id);
  }
}
