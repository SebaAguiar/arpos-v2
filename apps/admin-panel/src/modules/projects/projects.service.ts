import { Injectable, Inject } from '@kanjijs/core';
import { DATABASE_CLIENT } from '@kanjijs/store';
import type { Database } from '@kanjijs/store';
import { projects } from '@/database/schema';
import type { CreateProject, UpdateProject } from './contracts';
import { randomUUID } from 'crypto';

@Injectable()
export class ProjectsService {
  constructor(@Inject(DATABASE_CLIENT) private db: Database) {}

  async findAll() {
    const rows = await this.db.query.projects
      .orderBy('created_at', 'desc');
    return rows.map((r) => ({
      id: r.id,
      clientId: r.client_id,
      name: r.name,
      type: r.type,
      status: r.status,
      startDate: r.start_date,
      estimatedEndDate: r.estimated_end_date,
      budgetCents: r.budget_cents,
      repoUrl: r.repo_url,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async findById(id: string) {
    const row = await this.db.query.projects.findById(id);
    if (!row) return null;
    return {
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      type: row.type,
      status: row.status,
      startDate: row.start_date,
      estimatedEndDate: row.estimated_end_date,
      budgetCents: row.budget_cents,
      repoUrl: row.repo_url,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByClientId(clientId: string) {
    const rows = await this.db.query.projects
      .where({ client_id: clientId })
      .orderBy('created_at', 'desc');
    return rows.map((r) => ({
      id: r.id,
      clientId: r.client_id,
      name: r.name,
      type: r.type,
      status: r.status,
      startDate: r.start_date,
      estimatedEndDate: r.estimated_end_date,
      budgetCents: r.budget_cents,
      repoUrl: r.repo_url,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async create(input: CreateProject) {
    const id = randomUUID();
    const rows = await this.db.query.projects.insert({
      id,
      client_id: input.clientId,
      name: input.name,
      type: input.type,
      status: input.status,
      start_date: input.startDate ?? null,
      estimated_end_date: input.estimatedEndDate ?? null,
      budget_cents: input.budgetCents ?? null,
      repo_url: input.repoUrl ?? null,
      notes: input.notes ?? null,
    });
    return rows[0];
  }

  async update(id: string, input: UpdateProject) {
    const existing = await this.db.query.projects.findById(id);
    if (!existing) return null;

    const data: Record<string, string | number | Date | null> = {};
    if (input.clientId !== undefined) data.client_id = input.clientId;
    if (input.name !== undefined) data.name = input.name;
    if (input.type !== undefined) data.type = input.type;
    if (input.status !== undefined) data.status = input.status;
    if (input.startDate !== undefined) data.start_date = input.startDate ?? null;
    if (input.estimatedEndDate !== undefined) data.estimated_end_date = input.estimatedEndDate ?? null;
    if (input.budgetCents !== undefined) data.budget_cents = input.budgetCents ?? null;
    if (input.repoUrl !== undefined) data.repo_url = input.repoUrl ?? null;
    if (input.notes !== undefined) data.notes = input.notes ?? null;

    const rows = await this.db.query.projects
      .update(data)
      .where({ id });
    return rows[0];
  }

  async remove(id: string) {
    const existing = await this.db.query.projects.findById(id);
    if (!existing) return null;
    await this.db.query.projects.delete().where({ id });
    return existing;
  }
}
