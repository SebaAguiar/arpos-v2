import { KanjijsModule } from '@kanjijs/core';
import { HealthController } from './health.controller';

@KanjijsModule({
  controllers: [HealthController],
  providers: [],
  exports: [],
})
export class HealthModule {}
