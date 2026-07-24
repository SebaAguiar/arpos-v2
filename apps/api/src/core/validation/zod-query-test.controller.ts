import { Controller, Get } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ZodQuery } from './zod-query.decorator';
import { z } from 'zod';

const QuerySchema = z.object({
  from: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

@Controller('test')
class ZodQueryTestController {
  @Get('query')
  query(@ZodQuery(QuerySchema) query: { from?: string; limit?: number }) {
    return query;
  }
}

@Module({
  controllers: [ZodQueryTestController],
})
export class ZodQueryModule {}

export { ZodQueryTestController };
