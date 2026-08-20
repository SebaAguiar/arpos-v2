import { Injectable, Inject } from '@kanjijs/core';
import { DATABASE_CLIENT } from '@kanjijs/store';
import type { Database } from '@kanjijs/store';
import { payments } from '@/database/schema';
import type { CreatePayment, UpdatePayment } from './contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(@Inject(DATABASE_CLIENT) private db: Database) {}

  async findAll() {
    const rows = await this.db.query.payments
      .orderBy('created_at', 'desc');
    return rows.map((r) => ({
      id: r.id,
      clientId: r.client_id,
      subscriptionId: r.subscription_id,
      projectId: r.project_id,
      amountCents: r.amount_cents,
      currency: r.currency,
      status: r.status,
      method: r.method,
      externalRef: r.external_ref,
      paidAt: r.paid_at,
      createdAt: r.created_at,
    }));
  }

  async findById(id: string) {
    const row = await this.db.query.payments.findById(id);
    if (!row) return null;
    return {
      id: row.id,
      clientId: row.client_id,
      subscriptionId: row.subscription_id,
      projectId: row.project_id,
      amountCents: row.amount_cents,
      currency: row.currency,
      status: row.status,
      method: row.method,
      externalRef: row.external_ref,
      paidAt: row.paid_at,
      createdAt: row.created_at,
    };
  }

  async findByClientId(clientId: string) {
    const rows = await this.db.query.payments
      .where({ client_id: clientId })
      .orderBy('created_at', 'desc');
    return rows.map((r) => ({
      id: r.id,
      clientId: r.client_id,
      subscriptionId: r.subscription_id,
      projectId: r.project_id,
      amountCents: r.amount_cents,
      currency: r.currency,
      status: r.status,
      method: r.method,
      externalRef: r.external_ref,
      paidAt: r.paid_at,
      createdAt: r.created_at,
    }));
  }

  async create(input: CreatePayment) {
    const id = randomUUID();
    const rows = await this.db.query.payments.insert({
      id,
      client_id: input.clientId,
      subscription_id: input.subscriptionId ?? null,
      project_id: input.projectId ?? null,
      amount_cents: input.amountCents,
      currency: input.currency,
      status: input.status,
      method: input.method ?? null,
      external_ref: input.externalRef ?? null,
      paid_at: input.paidAt ?? null,
    });
    return rows[0];
  }

  async update(id: string, input: UpdatePayment) {
    const existing = await this.db.query.payments.findById(id);
    if (!existing) return null;

    const data: Record<string, string | number | Date | null> = {};
    if (input.subscriptionId !== undefined) data.subscription_id = input.subscriptionId ?? null;
    if (input.projectId !== undefined) data.project_id = input.projectId ?? null;
    if (input.amountCents !== undefined) data.amount_cents = input.amountCents;
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.status !== undefined) data.status = input.status;
    if (input.method !== undefined) data.method = input.method ?? null;
    if (input.externalRef !== undefined) data.external_ref = input.externalRef ?? null;
    if (input.paidAt !== undefined) data.paid_at = input.paidAt ?? null;

    const rows = await this.db.query.payments
      .update(data)
      .where({ id });
    return rows[0];
  }

  async remove(id: string) {
    const existing = await this.db.query.payments.findById(id);
    if (!existing) return null;
    await this.db.query.payments.delete().where({ id });
    return existing;
  }
}
