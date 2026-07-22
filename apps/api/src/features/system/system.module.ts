import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SetupController } from './setup.controller';

@Module({
  controllers: [HealthController, SetupController],
})
export class SystemModule {}
