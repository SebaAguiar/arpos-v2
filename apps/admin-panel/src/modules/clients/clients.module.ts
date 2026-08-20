import { KanjijsModule } from '@kanjijs/core';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@KanjijsModule({
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
