import { Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/guards/public.decorator';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { MigrationService } from './migration.service';
import { ImportV1Schema, ImportV1Input } from './dto/import-v1.schema';

@Controller('migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Public()
  @Post('import')
  async importV1(@ZodBody(ImportV1Schema) dto: ImportV1Input) {
    return this.migrationService.importFromV1(dto);
  }

  @Public()
  @Post('import/stream')
  async importV1Stream(@ZodBody(ImportV1Schema) dto: ImportV1Input, @Res() res: Response) {
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const write = (payload: unknown): void => {
      res.write(`${JSON.stringify(payload)}\n`);
    };

    try {
      const summary = await this.migrationService.importFromV1(dto, (progress) => {
        write({ type: 'progress', ...progress });
      });
      write({ type: 'complete', summary });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Migration failed';
      write({ type: 'error', message });
    } finally {
      res.end();
    }
  }
}
