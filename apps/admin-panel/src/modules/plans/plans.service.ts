import { Injectable, Inject } from '@kanjijs/core';
import { DATABASE_CLIENT } from '@kanjijs/store';
import type { Database, DatabaseValue } from '@kanjijs/store';
import { plans } from '@/database/schema';
import type { CreatePlan, UpdatePlan } from './contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class PlansService {
  constructor(@Inject(DATABASE_CLIENT) private db: Database) {}

  async findAll() {
    const rows = await this.db.query.plans
      .orderBy('sort_order', 'asc');
    return rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      name: r.name,
      slug: r.slug,
      maxStoresDefault: r.max_stores_default,
      priceDefaultCents: r.price_default_cents,
      currency: r.currency,
      features: r.features,
      sortOrder: r.sort_order,
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async findById(id: string) {
    const row = await this.db.query.plans.findById(id);
    if (!row) return null;
    return {
      id: row.id,
      productId: row.product_id,
      name: row.name,
      slug: row.slug,
      maxStoresDefault: row.max_stores_default,
      priceDefaultCents: row.price_default_cents,
      currency: row.currency,
      features: row.features,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByProductId(productId: string) {
    const rows = await this.db.query.plans
      .where({ product_id: productId })
      .orderBy('sort_order', 'asc');
    return rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      name: r.name,
      slug: r.slug,
      maxStoresDefault: r.max_stores_default,
      priceDefaultCents: r.price_default_cents,
      currency: r.currency,
      features: r.features,
      sortOrder: r.sort_order,
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async create(input: CreatePlan) {
    const id = randomUUID();
    const rows = await this.db.query.plans.insert({
      id,
      product_id: input.productId,
      name: input.name,
      slug: input.slug,
      max_stores_default: input.maxStoresDefault,
      price_default_cents: input.priceDefaultCents,
      currency: input.currency,
      features: JSON.stringify(input.features) as unknown as DatabaseValue,
      sort_order: input.sortOrder,
      is_active: input.isActive,
    });
    return rows[0];
  }

  async update(id: string, input: UpdatePlan) {
    const existing = await this.db.query.plans.findById(id);
    if (!existing) return null;

    const data: Record<string, DatabaseValue> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.maxStoresDefault !== undefined) data.max_stores_default = input.maxStoresDefault;
    if (input.priceDefaultCents !== undefined) data.price_default_cents = input.priceDefaultCents;
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.features !== undefined) data.features = JSON.stringify(input.features) as unknown as DatabaseValue;
    if (input.sortOrder !== undefined) data.sort_order = input.sortOrder;
    if (input.isActive !== undefined) data.is_active = input.isActive;

    const rows = await this.db.query.plans
      .update(data)
      .where({ id });
    return rows[0];
  }

  async remove(id: string) {
    const existing = await this.db.query.plans.findById(id);
    if (!existing) return null;
    await this.db.query.plans.delete().where({ id });
    return existing;
  }
}
