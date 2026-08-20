import { KanjijsModule } from '@kanjijs/core';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@KanjijsModule({
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
