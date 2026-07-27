import { Module } from '@nestjs/common';
import { VariantsService } from './variants.service';
import { VariantsController } from './variants.controller';
import { VariantsRepository } from './variants.repository';

@Module({
  controllers: [VariantsController],
  providers: [VariantsService, VariantsRepository],
  exports: [VariantsService],
})
export class VariantsModule {}
