import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { Public } from '../auth/guards/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime(),
        db: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: Date.now(),
        uptime: process.uptime(),
        db: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
