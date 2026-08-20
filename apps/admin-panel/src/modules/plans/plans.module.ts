import { KanjijsModule } from '@kanjijs/core';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@KanjijsModule({
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
