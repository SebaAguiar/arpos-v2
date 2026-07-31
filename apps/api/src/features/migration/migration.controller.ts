import { Controller, Post } from '@nestjs/common';
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
}
