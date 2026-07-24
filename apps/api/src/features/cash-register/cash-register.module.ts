import { Module } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { CashRegisterController } from './cash-register.controller';
import { CashRegisterRepository } from './cash-register.repository';

@Module({
  controllers: [CashRegisterController],
  providers: [CashRegisterService, CashRegisterRepository],
})
export class CashRegisterModule {}
