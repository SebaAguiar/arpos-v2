import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SalesRepository } from './sales.repository';
import { SyncModule } from '../sync/sync.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [SyncModule, WalletModule],
  controllers: [SalesController],
  providers: [SalesService, SalesRepository],
  exports: [SalesService],
})
export class SalesModule {}
