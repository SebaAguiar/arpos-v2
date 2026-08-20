import { Injectable, Inject } from '@kanjijs/core';
import { DATABASE_CLIENT } from '@kanjijs/store';
import type { Database } from '@kanjijs/store';
import { subscriptions } from '@/database/schema';
import type { CreateSubscription, UpdateSubscription } from './contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class SubscriptionsService {
  constructor(@Inject(DATABASE_CLIENT) private db: Database) {}

  async findAll() {
    const rows = await this.db.query.subscriptions
      .orderBy('created_at', 'desc');
    return rows.map((r) => ({
      id: r.id,
      clientId: r.client_id,
      productId: r.product_id,
      planId: r.plan_id,
      status: r.status,
      maxStoresOverride: r.max_stores_override,
      priceOverrideCents: r.price_override_cents,
      managedManually: r.managed_manually,
      internalNotes: r.internal_notes,
      startDate: r.start_date,
      renewalDate: r.renewal_date,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async findById(id: string) {
    const row = await this.db.query.subscriptions.findById(id);
    if (!row) return null;
    return {
      id: row.id,
      clientId: row.client_id,
      productId: row.product_id,
      planId: row.plan_id,
      status: row.status,
      maxStoresOverride: row.max_stores_override,
      priceOverrideCents: row.price_override_cents,
      managedManually: row.managed_manually,
      internalNotes: row.internal_notes,
      startDate: row.start_date,
      renewalDate: row.renewal_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByClientId(clientId: string) {
    const rows = await this.db.query.subscriptions
      .where({ client_id: clientId })
      .orderBy('created_at', 'desc');
    return rows.map((r) => ({
      id: r.id,
      clientId: r.client_id,
      productId: r.product_id,
      planId: r.plan_id,
      status: r.status,
      maxStoresOverride: r.max_stores_override,
      priceOverrideCents: r.price_override_cents,
      managedManually: r.managed_manually,
      internalNotes: r.internal_notes,
      startDate: r.start_date,
      renewalDate: r.renewal_date,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async create(input: CreateSubscription) {
    const id = randomUUID();
    const rows = await this.db.query.subscriptions.insert({
      id,
      client_id: input.clientId,
      product_id: input.productId,
      plan_id: input.planId,
      status: input.status,
      max_stores_override: input.maxStoresOverride ?? null,
      price_override_cents: input.priceOverrideCents ?? null,
      managed_manually: input.managedManually,
      internal_notes: input.internalNotes ?? null,
      start_date: input.startDate ?? new Date(),
      renewal_date: input.renewalDate ?? null,
    });
    return rows[0];
  }

  async update(id: string, input: UpdateSubscription) {
    const existing = await this.db.query.subscriptions.findById(id);
    if (!existing) return null;

    const data: Record<string, string | number | boolean | Date | null> = {};
    if (input.clientId !== undefined) data.client_id = input.clientId;
    if (input.productId !== undefined) data.product_id = input.productId;
    if (input.planId !== undefined) data.plan_id = input.planId;
    if (input.status !== undefined) data.status = input.status;
    if (input.maxStoresOverride !== undefined) data.max_stores_override = input.maxStoresOverride ?? null;
    if (input.priceOverrideCents !== undefined) data.price_override_cents = input.priceOverrideCents ?? null;
    if (input.managedManually !== undefined) data.managed_manually = input.managedManually;
    if (input.internalNotes !== undefined) data.internal_notes = input.internalNotes ?? null;
    if (input.startDate !== undefined) data.start_date = input.startDate;
    if (input.renewalDate !== undefined) data.renewal_date = input.renewalDate ?? null;

    const rows = await this.db.query.subscriptions
      .update(data)
      .where({ id });
    return rows[0];
  }

  async remove(id: string) {
    const existing = await this.db.query.subscriptions.findById(id);
    if (!existing) return null;
    await this.db.query.subscriptions.delete().where({ id });
    return existing;
  }
}
