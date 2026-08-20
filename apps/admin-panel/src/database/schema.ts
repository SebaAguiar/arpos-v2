import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ─── ADMIN USERS ───

export const adminUsers = pgTable('admin_users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('admin'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── CLIENTS ───

export const clients = pgTable('clients', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull().default('persona'),
  source: varchar('source', { length: 50 }).notNull().default('saas_signup'),
  phone: varchar('phone', { length: 100 }),
  company: varchar('company', { length: 255 }),
  taxId: varchar('tax_id', { length: 100 }),
  country: varchar('country', { length: 10 }).default('AR'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── PRODUCTS ───

export const products = pgTable('products', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull().default('saas'),
  clientId: varchar('client_id', { length: 255 }).references(() => clients.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── PLANS ───

export const plans = pgTable('plans', {
  id: varchar('id', { length: 255 }).primaryKey(),
  productId: varchar('product_id', { length: 255 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  maxStoresDefault: integer('max_stores_default').notNull().default(1),
  priceDefaultCents: integer('price_default_cents').notNull().default(0),
  currency: varchar('currency', { length: 10 }).default('ARS'),
  features: jsonb('features').$type<Record<string, boolean>>().default({}),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('plans_product_id_slug_idx').on(t.productId, t.slug),
]);

// ─── SUBSCRIPTIONS ───

export const subscriptions = pgTable('subscriptions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  clientId: varchar('client_id', { length: 255 }).notNull().references(() => clients.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 255 }).notNull().references(() => products.id),
  planId: varchar('plan_id', { length: 255 }).notNull().references(() => plans.id),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  maxStoresOverride: integer('max_stores_override'),
  priceOverrideCents: integer('price_override_cents'),
  managedManually: boolean('managed_manually').notNull().default(false),
  internalNotes: text('internal_notes'),
  startDate: timestamp('start_date').defaultNow().notNull(),
  renewalDate: timestamp('renewal_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('subscriptions_client_id_idx').on(t.clientId),
  index('subscriptions_product_id_idx').on(t.productId),
  index('subscriptions_status_idx').on(t.status),
]);

// ─── INSTANCES (multi-local POS) ───

export const instances = pgTable('instances', {
  id: varchar('id', { length: 255 }).primaryKey(),
  subscriptionId: varchar('subscription_id', { length: 255 }).notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  localIdentifier: varchar('local_identifier', { length: 255 }).notNull(),
  lastSyncAt: timestamp('last_sync_at'),
  connectionStatus: varchar('connection_status', { length: 50 }).notNull().default('offline'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('instances_subscription_id_idx').on(t.subscriptionId),
  uniqueIndex('instances_local_identifier_idx').on(t.localIdentifier),
]);

// ─── PROJECTS (custom work) ───

export const projects = pgTable('projects', {
  id: varchar('id', { length: 255 }).primaryKey(),
  clientId: varchar('client_id', { length: 255 }).notNull().references(() => clients.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull().default('dev_custom'),
  status: varchar('status', { length: 50 }).notNull().default('backlog'),
  startDate: timestamp('start_date'),
  estimatedEndDate: timestamp('estimated_end_date'),
  budgetCents: integer('budget_cents'),
  repoUrl: varchar('repo_url', { length: 512 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('projects_client_id_idx').on(t.clientId),
  index('projects_status_idx').on(t.status),
]);

// ─── PAYMENTS ───

export const payments = pgTable('payments', {
  id: varchar('id', { length: 255 }).primaryKey(),
  clientId: varchar('client_id', { length: 255 }).notNull().references(() => clients.id, { onDelete: 'cascade' }),
  subscriptionId: varchar('subscription_id', { length: 255 }).references(() => subscriptions.id, { onDelete: 'set null' }),
  projectId: varchar('project_id', { length: 255 }).references(() => projects.id, { onDelete: 'set null' }),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('ARS'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  method: varchar('method', { length: 50 }),
  externalRef: varchar('external_ref', { length: 255 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('payments_client_id_idx').on(t.clientId),
  index('payments_subscription_id_idx').on(t.subscriptionId),
  index('payments_project_id_idx').on(t.projectId),
  index('payments_status_idx').on(t.status),
]);

// ─── SUPPORT TICKETS ───

export const supportTickets = pgTable('support_tickets', {
  id: varchar('id', { length: 255 }).primaryKey(),
  clientId: varchar('client_id', { length: 255 }).notNull().references(() => clients.id, { onDelete: 'cascade' }),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('open'),
  priority: varchar('priority', { length: 50 }).notNull().default('medium'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('support_tickets_client_id_idx').on(t.clientId),
  index('support_tickets_status_idx').on(t.status),
]);
