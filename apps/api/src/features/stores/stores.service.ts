import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { StoresRepository } from './stores.repository';
import { CreateStoreInput } from './dto/create-store.schema';
import { UpdateStoreInput } from './dto/update-store.schema';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class StoresService {
  constructor(
    private readonly storesRepo: StoresRepository,
    private readonly syncService: SyncService,
  ) {}

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
    const store = await this.storesRepo.create(data);

    await this.syncService.enqueueChange('create', 'store', store.id, {
      name: store.name,
      address: store.address,
      phone: store.phone,
    });

    return store;
  }

  async update(id: string, data: UpdateStoreInput) {
    await this.findOne(id);
    const store = await this.storesRepo.update(id, data);

    await this.syncService.enqueueChange('update', 'store', store.id, {
      name: store.name,
      address: store.address,
      phone: store.phone,
    });

    return store;
  }

  async remove(id: string) {
    const store = await this.findOne(id);
    const count = await this.storesRepo.count();
    if (count <= 1) {
      throw new ConflictException('Cannot deactivate the only store');
    }

    await this.storesRepo.softDelete(id);

    await this.syncService.enqueueChange('delete', 'store', store.id, {
      name: store.name,
    });

    return undefined;
  }
}
