import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';

@Module({
  controllers: [HealthController, SetupController],
  providers: [SetupService],
})
export class SystemModule {}
