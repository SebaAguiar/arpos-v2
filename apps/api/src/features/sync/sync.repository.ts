import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { SyncQueue } from '@prisma/client';

export type SyncAction = 'create' | 'update' | 'delete';
export type SyncEntity = 'sale' | 'product' | 'inventory' | 'contact' | 'cash_register' | 'user' | 'store';
export type SyncStatus = 'pending' | 'synced' | 'error';

export interface SyncQueueItem {
  action: SyncAction;
  entity: SyncEntity;
  entityId: string;
  payload: string;
}

export interface SyncStats {
  pending: number;
  synced: number;
  error: number;
  lastSyncedAt: number | null;
}

export interface SyncQueueEntry extends Omit<SyncQueue, 'payload'> {
  payload: string;
}

@Injectable()
export class SyncRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private getCompanyId(): string {
    return this.tenantContext.getCompanyId();
  }

  private getStoreId(): string {
    return this.tenantContext.getStoreId();
  }

  async enqueue(item: SyncQueueItem): Promise<SyncQueue> {
    const now = Math.floor(Date.now() / 1000);

    return this.prisma.syncQueue.create({
      data: {
        companyId: this.getCompanyId(),
        storeId: this.getStoreId(),
        action: item.action,
        entity: item.entity,
        entityId: item.entityId,
        payload: item.payload,
        status: 'pending',
        created_at: now,
      },
    });
  }

  async findPending(limit: number = 100): Promise<SyncQueue[]> {
    return this.prisma.syncQueue.findMany({
      where: {
        companyId: this.getCompanyId(),
        storeId: this.getStoreId(),
        status: 'pending',
      },
      orderBy: { created_at: 'asc' },
      take: limit,
    });
  }

  async markSynced(id: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    await this.prisma.syncQueue.update({
      where: { id },
      data: {
        status: 'synced',
        synced_at: now,
        error_message: null,
      },
    });
  }

  async markError(id: string, errorMessage: string): Promise<void> {
    await this.prisma.syncQueue.update({
      where: { id },
      data: {
        status: 'error',
        error_message: errorMessage,
      },
    });
  }

  async countPending(): Promise<number> {
    return this.prisma.syncQueue.count({
      where: {
        companyId: this.getCompanyId(),
        storeId: this.getStoreId(),
        status: 'pending',
      },
    });
  }

  async deleteSynced(olderThanDays: number = 30): Promise<number> {
    const cutoff = Math.floor(Date.now() / 1000) - olderThanDays * 86400;

    const { count } = await this.prisma.syncQueue.deleteMany({
      where: {
        companyId: this.getCompanyId(),
        storeId: this.getStoreId(),
        status: 'synced',
        synced_at: { lt: cutoff },
      },
    });

    return count;
  }

  async deletePending(olderThanDays: number = 30): Promise<number> {
    const cutoff = Math.floor(Date.now() / 1000) - olderThanDays * 86400;

    const { count } = await this.prisma.syncQueue.deleteMany({
      where: {
        companyId: this.getCompanyId(),
        storeId: this.getStoreId(),
        status: 'pending',
        created_at: { lt: cutoff },
      },
    });

    return count;
  }

  async getStats(): Promise<SyncStats> {
    const companyId = this.getCompanyId();
    const storeId = this.getStoreId();
    const tenantWhere = { companyId, storeId };

    const [pending, synced, error, lastSynced] = await Promise.all([
      this.prisma.syncQueue.count({
        where: { ...tenantWhere, status: 'pending' },
      }),
      this.prisma.syncQueue.count({
        where: { ...tenantWhere, status: 'synced' },
      }),
      this.prisma.syncQueue.count({
        where: { ...tenantWhere, status: 'error' },
      }),
      this.prisma.syncQueue.findFirst({
        where: { ...tenantWhere, status: 'synced' },
        orderBy: { synced_at: 'desc' },
        select: { synced_at: true },
      }),
    ]);

    return {
      pending,
      synced,
      error,
      lastSyncedAt: lastSynced?.synced_at ?? null,
    };
  }
}
