import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { createStoreSchema, CreateStoreInput } from './dto/create-store.schema';
import { updateStoreSchema, UpdateStoreInput } from './dto/update-store.schema';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  @Get('count')
  count() {
    return this.storesService.count();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Post()
  create(@ZodBody(createStoreSchema) input: CreateStoreInput) {
    return this.storesService.create(input);
  }

  @Patch(':id')
  update(@Param('id') id: string, @ZodBody(updateStoreSchema) input: UpdateStoreInput) {
    return this.storesService.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}
