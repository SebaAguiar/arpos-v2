import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { ZodQuery } from '../../core/validation/zod-query.decorator';
import { SyncPendingSchema, SyncPendingInput } from './dto/sync-status.schema';
import { CleanupSchema, CleanupInput } from './dto/sync-status.schema';
import { SubscriptionGuard } from './guards/subscription.guard';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('status')
  getStats() {
    return this.syncService.getStats();
  }

  @Get('pending')
  getPending(@ZodQuery(SyncPendingSchema) query: SyncPendingInput) {
    return this.syncService.getPending(query.limit);
  }

  @Post('process')
  @HttpCode(HttpStatus.OK)
  processPending() {
    return this.syncService.processPending();
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
