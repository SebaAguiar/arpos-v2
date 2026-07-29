import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import {
  SyncRepository,
  SyncStats,
  SyncEntity,
  SyncAction,
} from './sync.repository';
import { CloudRelayService, PullResult } from './cloud-relay.service';

export interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
}

const MAX_QUEUE_SIZE = 10_000;
const BATCH_SIZE = 100;

const SYNC_ENTITIES: SyncEntity[] = [
  'sale',
  'product',
  'inventory',
  'contact',
  'cash_register',
  'user',
  'store',
  'wallet_transaction',
];

const SYNC_ACTIONS: SyncAction[] = ['create', 'update', 'delete'];

@Injectable()
export class SyncService {
  private readonly logger = new Logger('SyncService');

  constructor(
    private readonly syncRepo: SyncRepository,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly cloudRelay: CloudRelayService,
  ) {}

  async enqueueChange(
    action: SyncAction,
    entity: SyncEntity,
    entityId: string,
    payload: Record<string, string | number | boolean | null>,
  ): Promise<void> {
    if (!SYNC_ACTIONS.includes(action)) {
      throw new Error(`Invalid sync action: ${action}`);
    }

    if (!SYNC_ENTITIES.includes(entity)) {
      throw new Error(`Invalid sync entity: ${entity}`);
    }

    const count = await this.syncRepo.countPending();
    if (count >= MAX_QUEUE_SIZE) {
      this.logger.warn(
        `Sync queue at capacity (${count}/${MAX_QUEUE_SIZE}). Processing oldest batch.`,
      );
      await this.processOldestBatch();
    }

    const serializedPayload = JSON.stringify(payload);

    await this.syncRepo.enqueue({
      action,
      entity,
      entityId,
      payload: serializedPayload,
    });

    this.logger.debug(
      `Enqueued ${action} on ${entity}:${entityId} (pending: ${count + 1})`,
    );

    await this.processPending();
  }

  async getStats(): Promise<SyncStats> {
    return this.syncRepo.getStats();
  }

  async getPending(limit: number = 100) {
    return this.syncRepo.findPending(limit);
  }

  async processPending(): Promise<ProcessResult> {
    await this.ensureTenantContext();

    const pending = (await this.syncRepo.findPending(BATCH_SIZE)) ?? [];

    if (pending.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    const cloudEnabled = this.cloudRelay.isCloudConfigured();
    let succeeded = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        if (cloudEnabled) {
          await this.cloudRelay.pushToCloud(item);
        }
        await this.syncRepo.markSynced(item.id);
        succeeded++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        await this.syncRepo.markError(item.id, message);
        this.logger.warn(
          `Sync failed for ${item.entity}:${item.entityId}: ${message}`,
        );
        failed++;
      }
    }

    this.logger.log(
      `Sync batch processed: ${succeeded} succeeded, ${failed} failed`,
    );

    return {
      processed: pending.length,
      succeeded,
      failed,
    };
  }

  async pullFromCloud(): Promise<PullResult> {
    await this.ensureTenantContext();
    const lastSync = await this.getLastSyncTimestamp();
    return this.cloudRelay.pullFromCloud(lastSync);
  }

  async getLastSyncTimestamp(): Promise<number | null> {
    const last = await this.prisma.syncQueue.findFirst({
      where: {
        companyId: this.tenantContext.getCompanyId(),
        storeId: this.tenantContext.getStoreId(),
        status: 'synced',
        synced_at: { not: null },
      },
      orderBy: { synced_at: 'desc' },
      select: { synced_at: true },
    });
    return last?.synced_at ?? null;
  }

  async cleanupSynced(olderThanDays: number = 30): Promise<number> {
    return this.syncRepo.deleteSynced(olderThanDays);
  }

  async cleanupPending(olderThanDays: number = 30): Promise<number> {
    return this.syncRepo.deletePending(olderThanDays);
  }

  private async processOldestBatch(): Promise<void> {
    const oldest = await this.syncRepo.findPending(10);

    for (const item of oldest) {
      try {
        if (this.cloudRelay.isCloudConfigured()) {
          await this.cloudRelay.pushToCloud(item);
        }
        await this.syncRepo.markSynced(item.id);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        await this.syncRepo.markError(item.id, message);
      }
    }
  }

  private async ensureTenantContext(): Promise<void> {
    if (this.tenantContext.getCompanyId()) {
      return;
    }

    const company = await this.prisma.company.findFirst();
    if (company) {
      this.tenantContext.setCompanyId(company.id);

      const store = await this.prisma.store.findFirst({
        where: { companyId: company.id },
      });
      if (store) {
        this.tenantContext.setStoreId(store.id);
      }
    }
  }
}
