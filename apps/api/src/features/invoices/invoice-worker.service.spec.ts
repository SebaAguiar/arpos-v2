import { InvoiceWorkerService } from './invoice-worker.service';

describe('InvoiceWorkerService', () => {
  let worker: InvoiceWorkerService;
  let mockInvoiceService: Record<string, jest.Mock>;
  let mockInvoiceRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockInvoiceService = { emit: jest.fn() };
    mockInvoiceRepo = { findRetryable: jest.fn() };
    worker = new InvoiceWorkerService(
      mockInvoiceService as never,
      mockInvoiceRepo as never,
    );
  });

  function setRunning(flag: boolean) {
    (worker as unknown as { isRunning: boolean }).isRunning = flag;
  }

  function backoff(retryCount: number): number {
    return (worker as unknown as {
      calculateBackoff: (r: number) => number;
    }).calculateBackoff(retryCount);
  }

  describe('calculateBackoff', () => {
    it('doubles from 60s and caps at 900s', () => {
      expect(backoff(0)).toBe(60_000);
      expect(backoff(1)).toBe(120_000);
      expect(backoff(4)).toBe(900_000);
      expect(backoff(10)).toBe(900_000);
    });
  });

  describe('handleCronRetry', () => {
    it('skips the cycle when the worker is already running', async () => {
      setRunning(true);
      mockInvoiceRepo.findRetryable.mockResolvedValue([]);

      await worker.handleCronRetry();

      expect(mockInvoiceRepo.findRetryable).not.toHaveBeenCalled();
    });

    it('returns early when there is nothing retryable', async () => {
      mockInvoiceRepo.findRetryable.mockResolvedValue([]);

      await worker.handleCronRetry();

      expect(mockInvoiceService.emit).not.toHaveBeenCalled();
    });

    it('skips an invoice whose backoff delay has not elapsed yet', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const invoice = {
        id: 'inv-1',
        retry_count: 1,
        created_at: nowSeconds - 30,
      };
      mockInvoiceRepo.findRetryable.mockResolvedValue([invoice]);

      await worker.handleCronRetry();

      expect(mockInvoiceService.emit).not.toHaveBeenCalled();
    });

    it('re-emits a pending invoice once the backoff window has elapsed', async () => {
      // Regression: retry_count=1 -> backoff = 120000ms
      // Invoice failed 3 minutes ago -> window elapsed, worker MUST re-emit.
      // Bug was `now - lastAttempt * 1000` (mixed seconds/ms): always negative,
      // so the worker skipped every retrowable invoice forever.
      const nowSeconds = Math.floor(Date.now() / 1000);
      const invoice = {
        id: 'inv-1',
        retry_count: 1,
        created_at: nowSeconds - 180,
      };
      mockInvoiceRepo.findRetryable.mockResolvedValue([invoice]);
      mockInvoiceService.emit.mockResolvedValue({
        invoiceId: 'inv-1',
        success: true,
        cae: '12345678901234',
        caeExpiration: '20260920',
      });

      await worker.handleCronRetry();

      expect(mockInvoiceService.emit).toHaveBeenCalledWith('inv-1');
    });

    it('counts failed emissions and continues with the next invoice', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const invoices = [
        {
          id: 'inv-a',
          retry_count: 0,
          created_at: nowSeconds,
        },
        {
          id: 'inv-b',
          retry_count: 0,
          created_at: nowSeconds,
        },
      ];
      mockInvoiceRepo.findRetryable.mockResolvedValue(invoices);
      const logSpy = jest.spyOn(worker['logger'] as unknown as { log: () => void }, 'log');
      mockInvoiceService.emit
        .mockResolvedValueOnce({ invoiceId: 'inv-a', success: true })
        .mockResolvedValueOnce({ invoiceId: 'inv-b', success: false, error: 'timeout' });

      await worker.handleCronRetry();

      expect(mockInvoiceService.emit).toHaveBeenCalledTimes(2);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('1 issued, 1 failed'),
      );
      logSpy.mockRestore();
    });

    it('counts a thrown error as a failure and keeps going', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      mockInvoiceRepo.findRetryable.mockResolvedValue([
        { id: 'inv-1', retry_count: 0, created_at: nowSeconds },
        { id: 'inv-2', retry_count: 0, created_at: nowSeconds },
      ]);
      mockInvoiceService.emit
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({ invoiceId: 'inv-2', success: true });

      await expect(worker.handleCronRetry()).resolves.toBeUndefined();

      expect(mockInvoiceService.emit).toHaveBeenCalledTimes(2);
    });

    it('resets the running flag even when a repository query throws', async () => {
      mockInvoiceRepo.findRetryable.mockRejectedValue(new Error('db locked'));

      await expect(worker.handleCronRetry()).resolves.toBeUndefined();

      const running = (worker as unknown as { isRunning: boolean }).isRunning;
      expect(running).toBe(false);
    });
  });

  describe('retryFailed', () => {
    it('rejects while the worker is running', async () => {
      setRunning(true);

      await expect(worker.retryFailed()).rejects.toThrow(
        'Worker is already running, please wait',
      );
    });

    it('returns zeros when there is nothing to retry', async () => {
      mockInvoiceRepo.findRetryable.mockResolvedValue([]);

      await expect(worker.retryFailed()).resolves.toEqual({
        total: 0,
        issued: 0,
        failed: 0,
      });
    });

    it('returns issued/failed counts', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      mockInvoiceRepo.findRetryable.mockResolvedValue([
        { id: 'inv-a', retry_count: 2, created_at: nowSeconds - 60 },
        { id: 'inv-b', retry_count: 2, created_at: nowSeconds - 120 },
      ]);
      mockInvoiceService.emit
        .mockResolvedValueOnce({ invoiceId: 'inv-a', success: true })
        .mockResolvedValueOnce({ invoiceId: 'inv-b', success: false, error: 'denied' });

      await expect(worker.retryFailed()).resolves.toEqual({
        total: 2,
        issued: 1,
        failed: 1,
      });
    });

    it('resets the flag even when emit throws', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      mockInvoiceRepo.findRetryable.mockResolvedValue([
        { id: 'inv-1', retry_count: 0, created_at: nowSeconds },
      ]);
      mockInvoiceService.emit.mockRejectedValue(new Error('boom'));

      await expect(worker.retryFailed()).resolves.toEqual({
        total: 1,
        issued: 0,
        failed: 1,
      });
      expect((worker as unknown as { isRunning: boolean }).isRunning).toBe(false);
    });
  });
});