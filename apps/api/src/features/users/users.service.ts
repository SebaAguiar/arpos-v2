import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository, SafeUser } from './users.repository';
import { CreateUserInput } from './dto/create-user.schema';
import { UpdateUserInput } from './dto/update-user.schema';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly syncService: SyncService,
  ) {}

  async findAll(filters?: { role?: string; is_active?: boolean }): Promise<SafeUser[]> {
    return this.usersRepo.findAll(filters);
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(data: CreateUserInput): Promise<SafeUser> {
    const existing = await this.usersRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictException(`User with email ${data.email} already exists`);
    }
    const user = await this.usersRepo.create(data);

    await this.syncService.enqueueChange('create', 'user', user.id, {
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return user;
  }

  async update(id: string, data: UpdateUserInput): Promise<SafeUser> {
    await this.findOne(id);

    if (data.email) {
      const existing = await this.usersRepo.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Email ${data.email} is already taken`);
      }
    }

    const user = await this.usersRepo.update(id, data);

    await this.syncService.enqueueChange('update', 'user', user.id, {
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return user;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (user.role === 'admin') {
      throw new ConflictException('Cannot deactivate admin users');
    }
    await this.usersRepo.softDelete(id);

    await this.syncService.enqueueChange('delete', 'user', user.id, {
      email: user.email,
      name: user.name,
    });
  }
}
