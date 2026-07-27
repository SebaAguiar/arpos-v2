import { create } from "zustand";
import { UsersRepository } from "@/repositories/users.repository";
import { getCached, setCache } from "@/lib/cache";
import type { User } from "@/lib/types";

const CACHE_KEY = "users";

interface UsersState {
  users: User[];
  loading: boolean;
  isStale: boolean;
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
  isStale: false,
  error: null,

  fetchUsers: async (filters) => {
    set({ loading: true, error: null });
    try {
      const users = await UsersRepository.getAll(filters);
      setCache(CACHE_KEY, users);
      set({ users, loading: false, isStale: false });
    } catch {
      const cached = getCached<User[]>(CACHE_KEY);
      set({
        users: cached ?? [],
        loading: false,
        isStale: cached !== null,
      });
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
