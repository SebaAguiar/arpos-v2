import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { StoresRepository } from './stores.repository';
import { CreateStoreInput } from './dto/create-store.schema';
import { UpdateStoreInput } from './dto/update-store.schema';

@Injectable()
export class StoresService {
  constructor(private readonly storesRepo: StoresRepository) {}

  async findAll() {
    return this.storesRepo.findAll();
  }

  async count(): Promise<number> {
    return this.storesRepo.count();
  }

  async findOne(id: string) {
    const store = await this.storesRepo.findById(id);
    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }
    return store;
  }

  async create(data: CreateStoreInput) {
    const count = await this.storesRepo.count();
    if (count >= 1) {
      throw new ConflictException(
        'Local mode allows only 1 store. Upgrade to multi-store plan for more.',
      );
    }
    return this.storesRepo.create(data);
  }

  async update(id: string, data: UpdateStoreInput) {
    await this.findOne(id);
    return this.storesRepo.update(id, data);
  }

  async remove(id: string) {
    await this.findOne(id);
    const count = await this.storesRepo.count();
    if (count <= 1) {
      throw new ConflictException('Cannot deactivate the only store');
    }
    return this.storesRepo.softDelete(id);
  }
}
