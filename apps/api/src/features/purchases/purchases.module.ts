import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { PurchasesRepository } from './purchases.repository';

@Module({
  controllers: [PurchasesController],
  providers: [PurchasesService, PurchasesRepository],
})
export class PurchasesModule {}
