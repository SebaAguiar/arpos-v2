import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

@Module({
  controllers: [HealthController, SetupController, CompanyController],
  providers: [SetupService, CompanyService],
})
export class SystemModule {}
