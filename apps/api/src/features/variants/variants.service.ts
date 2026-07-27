import { Injectable } from '@nestjs/common';
import { VariantsRepository } from './variants.repository';
import { CreateVariantInput } from './dto/create-variant.schema';
import { UpdateVariantInput } from './dto/update-variant.schema';

@Injectable()
export class VariantsService {
  constructor(private readonly variantsRepo: VariantsRepository) {}

  async findByProduct(productId: string) {
    return this.variantsRepo.findByProduct(productId);
  }

  async findOne(id: string) {
    return this.variantsRepo.findById(id);
  }

  async create(data: CreateVariantInput) {
    return this.variantsRepo.create(data);
  }

  async update(id: string, data: UpdateVariantInput) {
    return this.variantsRepo.update(id, data);
  }

  async remove(id: string) {
    return this.variantsRepo.remove(id);
  }

  async countByProduct(productId: string) {
    return this.variantsRepo.countByProduct(productId);
  }
}
