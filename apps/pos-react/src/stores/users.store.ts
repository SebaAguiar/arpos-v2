import { create } from "zustand";
import { UsersRepository } from "@/repositories/users.repository";
import type { User } from "@/lib/types";

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: (filters?: { role?: string; is_active?: boolean }) => Promise<void>;
  createUser: (input: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }) => Promise<User>;
  updateUser: (
    id: string,
    data: Partial<{
      email: string;
      password: string;
      name: string;
      role: string;
      is_active: boolean;
    }>,
  ) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async (filters) => {
    set({ loading: true, error: null });
    try {
      const users = await UsersRepository.getAll(filters);
      set({ users, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error loading users";
      set({ error: message, loading: false });
    }
  },

  createUser: async (input) => {
    const user = await UsersRepository.create(input);
    set({ users: [user, ...get().users] });
    return user;
  },

  updateUser: async (id, data) => {
    const updated = await UsersRepository.update(id, data);
    set({
      users: get().users.map((u) => (u.id === id ? updated : u)),
    });
    return updated;
  },

  deleteUser: async (id) => {
    await UsersRepository.remove(id);
    set({
      users: get().users.map((u) =>
        u.id === id ? { ...u, is_active: false } : u,
      ),
    });
  },
}));
