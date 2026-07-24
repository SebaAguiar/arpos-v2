import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { ZodType } from 'zod';

export function ZodQuery(schema: ZodType) {
  return createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const result = schema.safeParse(request.query);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Query validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }

    return result.data;
  })();
}
