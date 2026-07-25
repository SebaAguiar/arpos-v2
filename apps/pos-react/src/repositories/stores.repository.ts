import { StoresService, type ApiStore } from "../services/stores.service";

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

function mapStore(api: ApiStore): Store {
  return {
    id: api.id,
    name: api.name,
    address: api.address ?? undefined,
    phone: api.phone ?? undefined,
    is_active: api.is_active,
    created_at: api.created_at,
    updated_at: api.updated_at,
  };
}

export const StoresRepository = {
  async getAll(): Promise<Store[]> {
    const stores = await StoresService.list();
    return stores.map(mapStore);
  },

  async getCount(): Promise<number> {
    return StoresService.count();
  },

  async getById(id: string): Promise<Store> {
    const store = await StoresService.get(id);
    return mapStore(store);
  },

  async create(input: {
    name: string;
    address?: string;
    phone?: string;
  }): Promise<Store> {
    const created = await StoresService.create(input);
    return mapStore(created);
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      address: string;
      phone: string;
      is_active: boolean;
    }>,
  ): Promise<Store> {
    const updated = await StoresService.update(id, data);
    return mapStore(updated);
  },

  async remove(id: string): Promise<void> {
    return StoresService.remove(id);
  },
};
