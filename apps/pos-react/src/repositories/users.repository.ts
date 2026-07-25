import { UsersService, type ApiUser } from "../services/users.service";
import type { User } from "@/lib/types";

function mapUser(api: ApiUser): User {
  return {
    id: api.id,
    email: api.email,
    name: api.name,
    role: api.role as User["role"],
    is_active: api.is_active,
    created_at: api.created_at,
    updated_at: api.updated_at,
  };
}

export const UsersRepository = {
  async getAll(filters?: { role?: string; is_active?: boolean }): Promise<User[]> {
    const users = await UsersService.list(filters);
    return users.map(mapUser);
  },

  async getById(id: string): Promise<User> {
    const user = await UsersService.get(id);
    return mapUser(user);
  },

  async create(input: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<User> {
    const created = await UsersService.create(input);
    return mapUser(created);
  },

  async update(
    id: string,
    data: Partial<{
      email: string;
      password: string;
      name: string;
      role: string;
      is_active: boolean;
    }>,
  ): Promise<User> {
    const updated = await UsersService.update(id, data);
    return mapUser(updated);
  },

  async remove(id: string): Promise<void> {
    return UsersService.remove(id);
  },
};
