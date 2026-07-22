import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './data-access/prisma/prisma.module';
import { TenantModule } from './core/tenant/tenant.module';
import { SystemModule } from './features/system/system.module';
import { LocalTenantMiddleware } from './core/tenant/local-tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    TenantModule,
    SystemModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LocalTenantMiddleware)
      .forRoutes('*');
  }
}
