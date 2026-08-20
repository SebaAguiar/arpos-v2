import { Injectable, Inject } from '@kanjijs/core';
import { DATABASE_CLIENT } from '@kanjijs/store';
import type { Database } from '@kanjijs/store';
import { products } from '@/database/schema';
import type { CreateProduct, UpdateProduct } from './contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class ProductsService {
  constructor(@Inject(DATABASE_CLIENT) private db: Database) {}

  async findAll() {
    const rows = await this.db.query.products
      .orderBy('created_at', 'desc');
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      clientId: r.client_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async findById(id: string) {
    const row = await this.db.query.products.findById(id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      clientId: row.client_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(input: CreateProduct) {
    const id = randomUUID();
    const rows = await this.db.query.products.insert({
      id,
      name: input.name,
      type: input.type,
      client_id: input.clientId ?? null,
    });
    return rows[0];
  }

  async update(id: string, input: UpdateProduct) {
    const existing = await this.db.query.products.findById(id);
    if (!existing) return null;

    const data: Record<string, string | null> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.type !== undefined) data.type = input.type;
    if (input.clientId !== undefined) data.client_id = input.clientId ?? null;

    const rows = await this.db.query.products
      .update(data)
      .where({ id });
    return rows[0];
  }

  async remove(id: string) {
    const existing = await this.db.query.products.findById(id);
    if (!existing) return null;
    await this.db.query.products.delete().where({ id });
    return existing;
  }
}
