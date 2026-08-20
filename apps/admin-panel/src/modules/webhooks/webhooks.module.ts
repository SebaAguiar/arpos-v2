import { KanjijsModule } from '@kanjijs/core';
import { WebhookController } from './webhook.controller';

@KanjijsModule({
  controllers: [WebhookController],
  providers: [],
  exports: [],
})
export class WebhooksModule {}
