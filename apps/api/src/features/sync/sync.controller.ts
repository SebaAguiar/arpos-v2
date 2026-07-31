import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { CloudRelayService } from './cloud-relay.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { ZodQuery } from '../../core/validation/zod-query.decorator';
import {
  SyncPendingSchema,
  SyncPendingInput,
  CleanupSchema,
  CleanupInput,
  SyncConfigSchema,
  SyncConfigInput,
} from './dto/sync-status.schema';
import { SubscriptionGuard } from './guards/subscription.guard';

@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly cloudRelay: CloudRelayService,
  ) {}

  @Get('status')
  getStats() {
    return this.syncService.getStats();
  }

  @Get('pending')
  getPending(@ZodQuery(SyncPendingSchema) query: SyncPendingInput) {
    return this.syncService.getPending(query.limit);
  }

  @Get('config')
  getConfig() {
    return this.cloudRelay.getConfigInfo();
  }

  @Post('config')
  @HttpCode(HttpStatus.OK)
  async saveConfig(@ZodBody(SyncConfigSchema) input: SyncConfigInput) {
    if (input.cloud_url && input.cloud_jwt) {
      await this.cloudRelay.saveCloudConfig(input.cloud_url, input.cloud_jwt);
    }
    if (input.subscription) {
      await this.cloudRelay.saveSubscription(input.subscription);
    }
    return this.cloudRelay.getConfigInfo();
  }

  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnect() {
    await this.cloudRelay.clearCloudConfig();
    return { ok: true };
  }

  @Post('process')
  @HttpCode(HttpStatus.OK)
  processPending() {
    return this.syncService.processPending();
  }

  @UseGuards(SubscriptionGuard)
  @Post('reconnect')
  @HttpCode(HttpStatus.OK)
  async reconnect() {
    this.cloudRelay.connectWebSocket();
    return this.syncService.pullFromCloud();
  }

  @UseGuards(SubscriptionGuard)
  @Post('pull')
  @HttpCode(HttpStatus.OK)
  pullFromCloud() {
    return this.syncService.pullFromCloud();
  }

  @Post('cleanup/synced')
  @HttpCode(HttpStatus.OK)
  cleanupSynced(@ZodBody(CleanupSchema) input: CleanupInput) {
    return this.syncService
      .cleanupSynced(input.older_than_days)
      .then((deleted) => ({ deleted }));
  }

  @Post('cleanup/pending')
  @HttpCode(HttpStatus.OK)
  cleanupPending(@ZodBody(CleanupSchema) input: CleanupInput) {
    return this.syncService
      .cleanupPending(input.older_than_days)
      .then((deleted) => ({ deleted }));
  }
}
