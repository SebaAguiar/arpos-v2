import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvoiceService } from './invoice.service';
import { InvoiceRepository } from './invoice.repository';

@Injectable()
export class InvoiceWorkerService {
  private readonly logger = new Logger(InvoiceWorkerService.name);
  private isRunning = false;

  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoiceRepo: InvoiceRepository,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCronRetry() {
    if (this.isRunning) {
      this.logger.debug('Worker already running, skipping this cycle');
      return;
    }

    this.isRunning = true;
    try {
      const pending = await this.invoiceRepo.findRetryable(5);

      if (pending.length === 0) {
        this.logger.debug('No retryable invoices found');
        return;
      }

      this.logger.log(`Worker: processing ${pending.length} pending invoices`);

      let issued = 0;
      let failed = 0;

      for (const invoice of pending) {
        const delayMs = this.calculateBackoff(invoice.retry_count);

        if (invoice.retry_count > 0) {
          const lastAttempt = invoice.created_at + (invoice.retry_count * 60);
          const now = Math.floor(Date.now() / 1000);
          if (now - lastAttempt * 1000 < delayMs) {
            this.logger.debug(
              `Skipping invoice ${invoice.id}: backoff delay not elapsed (retry ${invoice.retry_count})`,
            );
            continue;
          }
        }

        try {
          const result = await this.invoiceService.emit(invoice.id);
          if (result.success) {
            issued++;
            this.logger.log(`Worker: invoice ${invoice.id} emitted successfully`);
          } else {
            failed++;
            this.logger.warn(
              `Worker: invoice ${invoice.id} emit failed: ${result.error}`,
            );
          }
        } catch (error) {
          failed++;
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Worker: invoice ${invoice.id} error: ${message}`);
        }
      }

      this.logger.log(`Worker cycle complete: ${issued} issued, ${failed} failed`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Worker cycle failed: ${message}`);
    } finally {
      this.isRunning = false;
    }
  }

  async retryFailed(): Promise<{
    total: number;
    issued: number;
    failed: number;
  }> {
    if (this.isRunning) {
      throw new Error('Worker is already running, please wait');
    }

    this.isRunning = true;
    try {
      const pending = await this.invoiceRepo.findRetryable(5);

      if (pending.length === 0) {
        return { total: 0, issued: 0, failed: 0 };
      }

      let issued = 0;
      let failed = 0;

      for (const invoice of pending) {
        try {
          const result = await this.invoiceService.emit(invoice.id);
          if (result.success) {
            issued++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      return { total: pending.length, issued, failed };
    } finally {
      this.isRunning = false;
    }
  }

  private calculateBackoff(retryCount: number): number {
    const baseMs = 60_000;
    const maxMs = 900_000;
    return Math.min(baseMs * Math.pow(2, retryCount), maxMs);
  }
}
