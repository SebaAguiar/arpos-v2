import { Injectable, Inject } from '@kanjijs/core';
import { DATABASE_CLIENT } from '@kanjijs/store';
import type { Database } from '@kanjijs/store';
import { supportTickets } from '@/database/schema';
import type { CreateTicket, UpdateTicket } from './contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class SupportService {
  constructor(@Inject(DATABASE_CLIENT) private db: Database) {}

  async findAll() {
    const rows = await this.db.query.supportTickets
      .orderBy('created_at', 'desc');
    return rows.map((r) => ({
      id: r.id,
      clientId: r.client_id,
      subject: r.subject,
      description: r.description,
      status: r.status,
      priority: r.priority,
      resolvedAt: r.resolved_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async findById(id: string) {
    const row = await this.db.query.supportTickets.findById(id);
    if (!row) return null;
    return {
      id: row.id,
      clientId: row.client_id,
      subject: row.subject,
      description: row.description,
      status: row.status,
      priority: row.priority,
      resolvedAt: row.resolved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByClientId(clientId: string) {
    const rows = await this.db.query.supportTickets
      .where({ client_id: clientId })
      .orderBy('created_at', 'desc');
    return rows.map((r) => ({
      id: r.id,
      clientId: r.client_id,
      subject: r.subject,
      description: r.description,
      status: r.status,
      priority: r.priority,
      resolvedAt: r.resolved_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async create(input: CreateTicket) {
    const id = randomUUID();
    const rows = await this.db.query.supportTickets.insert({
      id,
      client_id: input.clientId,
      subject: input.subject,
      description: input.description ?? null,
      status: input.status,
      priority: input.priority,
      resolved_at: input.resolvedAt ?? null,
    });
    return rows[0];
  }

  async update(id: string, input: UpdateTicket) {
    const existing = await this.db.query.supportTickets.findById(id);
    if (!existing) return null;

    const data: Record<string, string | Date | null> = {};
    if (input.subject !== undefined) data.subject = input.subject;
    if (input.description !== undefined) data.description = input.description ?? null;
    if (input.status !== undefined) data.status = input.status;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.resolvedAt !== undefined) data.resolved_at = input.resolvedAt ?? null;

    const rows = await this.db.query.supportTickets
      .update(data)
      .where({ id });
    return rows[0];
  }

  async remove(id: string) {
    const existing = await this.db.query.supportTickets.findById(id);
    if (!existing) return null;
    await this.db.query.supportTickets.delete().where({ id });
    return existing;
  }
}
