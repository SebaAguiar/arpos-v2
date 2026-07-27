import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductInput } from './dto/create-product.schema';
import { UpdateProductInput } from './dto/update-product.schema';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly syncService: SyncService,
  ) {}

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
    const product = await this.productsRepo.create(data, companyId, storeId);

    await this.syncService.enqueueChange('create', 'product', product.id, {
      code: product.code,
      name: product.name,
      price_cents: product.price_cents,
      stock_quantity: product.stock_quantity,
    });

    return product;
  }

  async update(id: string, data: UpdateProductInput) {
    await this.findOne(id);
    const product = await this.productsRepo.update(id, data);

    await this.syncService.enqueueChange('update', 'product', product.id, {
      code: product.code,
      name: product.name,
      price_cents: product.price_cents,
      stock_quantity: product.stock_quantity,
    });

    return product;
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    await this.productsRepo.softDelete(id);

    await this.syncService.enqueueChange('delete', 'product', product.id, {
      code: product.code,
      name: product.name,
    });

    return undefined;
  }
}
