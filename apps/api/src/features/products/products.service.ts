import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductInput } from './dto/create-product.schema';
import { UpdateProductInput } from './dto/update-product.schema';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepo: ProductsRepository) {}

  async findAll(storeId?: string) {
    return this.productsRepo.findAll(storeId);
  }

  async findOne(id: string) {
    const product = await this.productsRepo.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async create(data: CreateProductInput, companyId: string, storeId?: string) {
    return this.productsRepo.create(data, companyId, storeId);
  }

  async update(id: string, data: UpdateProductInput) {
    await this.findOne(id);
    return this.productsRepo.update(id, data);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.productsRepo.softDelete(id);
  }
}
