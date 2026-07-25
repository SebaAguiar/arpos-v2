import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository, SafeUser } from './users.repository';
import { CreateUserInput } from './dto/create-user.schema';
import { UpdateUserInput } from './dto/update-user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

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
    return this.usersRepo.create(data);
  }

  async update(id: string, data: UpdateUserInput): Promise<SafeUser> {
    await this.findOne(id);

    if (data.email) {
      const existing = await this.usersRepo.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Email ${data.email} is already taken`);
      }
    }

    return this.usersRepo.update(id, data);
  }

  async remove(id: string): Promise<SafeUser> {
    const user = await this.findOne(id);
    if (user.role === 'admin') {
      throw new ConflictException('Cannot deactivate admin users');
    }
    return this.usersRepo.softDelete(id);
  }
}
