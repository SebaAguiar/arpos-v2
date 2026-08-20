import { Injectable, Inject } from '@kanjijs/core';
import { DATABASE_CLIENT } from '@kanjijs/store';
import type { Database } from '@kanjijs/store';
import { eq } from 'drizzle-orm';
import { clients } from '@/database/schema';
import type { CreateClient, UpdateClient } from './contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class ClientsService {
  constructor(@Inject(DATABASE_CLIENT) private db: Database) {}

  async findAll() {
    const rows = await this.db.query.clients
      .orderBy('created_at', 'desc');
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      type: r.type,
      source: r.source,
      phone: r.phone,
      company: r.company,
      taxId: r.tax_id,
      country: r.country,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async findById(id: string) {
    const row = await this.db.query.clients.findById(id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      type: row.type,
      source: row.source,
      phone: row.phone,
      company: row.company,
      taxId: row.tax_id,
      country: row.country,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(input: CreateClient) {
    const id = randomUUID();
    const rows = await this.db.query.clients.insert({
      id,
      name: input.name,
      email: input.email,
      type: input.type,
      source: input.source,
      phone: input.phone ?? null,
      company: input.company ?? null,
      tax_id: input.taxId ?? null,
      country: input.country,
      notes: input.notes ?? null,
    });
    return rows[0];
  }

  async update(id: string, input: UpdateClient) {
    const existing = await this.db.query.clients.findById(id);
    if (!existing) return null;

    const data: Record<string, string | null> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.email !== undefined) data.email = input.email;
    if (input.type !== undefined) data.type = input.type;
    if (input.source !== undefined) data.source = input.source;
    if (input.phone !== undefined) data.phone = input.phone ?? null;
    if (input.company !== undefined) data.company = input.company ?? null;
    if (input.taxId !== undefined) data.tax_id = input.taxId ?? null;
    if (input.country !== undefined) data.country = input.country;
    if (input.notes !== undefined) data.notes = input.notes ?? null;

    const rows = await this.db.query.clients
      .update(data)
      .where({ id });
    return rows[0];
  }

  async remove(id: string) {
    const existing = await this.db.query.clients.findById(id);
    if (!existing) return null;
    await this.db.query.clients.delete().where({ id });
    return existing;
  }
}
