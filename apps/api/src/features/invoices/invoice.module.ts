import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { InvoiceRepository } from './invoice.repository';
import { InvoiceWorkerService } from './invoice-worker.service';
import { ArcaModule } from '../arca/arca.module';

@Module({
  imports: [ArcaModule, ScheduleModule.forRoot()],
  controllers: [InvoiceController],
  providers: [InvoiceService, InvoiceRepository, InvoiceWorkerService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
