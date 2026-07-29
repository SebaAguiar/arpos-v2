import {
  Controller,
  Get,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import {
  CreditWalletSchema,
  DebitWalletSchema,
  CreditWalletInput,
  DebitWalletInput,
} from './dto/create-transaction.schema';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':contactId')
  getBalance(@Param('contactId') contactId: string) {
    return this.walletService.getBalance(contactId);
  }

  @Get(':contactId/transactions')
  getTransactions(
    @Param('contactId') contactId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.walletService.getTransactions(
      contactId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post(':contactId/credit')
  credit(
    @Param('contactId') contactId: string,
    @ZodBody(CreditWalletSchema) input: CreditWalletInput,
  ) {
    return this.walletService.credit(contactId, input);
  }

  @Post(':contactId/debit')
  debit(
    @Param('contactId') contactId: string,
    @ZodBody(DebitWalletSchema) input: DebitWalletInput,
  ) {
    return this.walletService.debit(contactId, input);
  }
}
