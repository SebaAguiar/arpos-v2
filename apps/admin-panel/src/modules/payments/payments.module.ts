import { KanjijsModule } from '@kanjijs/core';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@KanjijsModule({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
