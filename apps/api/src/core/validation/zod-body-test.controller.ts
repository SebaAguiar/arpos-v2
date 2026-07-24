import { Controller, Post } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ZodBody } from './zod-body.decorator';
import { z } from 'zod';

const EchoSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

@Controller('test')
class ZodBodyTestController {
  @Post('echo')
  echo(@ZodBody(EchoSchema) body: { name: string; age: number }) {
    return body;
  }
}

@Module({
  controllers: [ZodBodyTestController],
})
export class ZodBodyModule {}

export { ZodBodyTestController };
