import { KanjijsModule } from '@kanjijs/core';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@KanjijsModule({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
