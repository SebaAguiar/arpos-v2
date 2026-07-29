import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncRepository } from './sync.repository';
import { CloudRelayService } from './cloud-relay.service';
import { SubscriptionGuard } from './guards/subscription.guard';

@Module({
  controllers: [SyncController],
  providers: [
    SyncService,
    SyncRepository,
    CloudRelayService,
    SubscriptionGuard,
  ],
  exports: [SyncService, CloudRelayService],
})
export class SyncModule {}
