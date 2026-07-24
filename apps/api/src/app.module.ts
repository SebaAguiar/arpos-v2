import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './data-access/prisma/prisma.module';
import { TenantModule } from './core/tenant/tenant.module';
import { AuthModule } from './features/auth/auth.module';
import { SystemModule } from './features/system/system.module';
import { ContactsModule } from './features/contacts/contacts.module';
import { ProductsModule } from './features/products/products.module';
import { SalesModule } from './features/sales/sales.module';
import { CashRegisterModule } from './features/cash-register/cash-register.module';
import { LocalTenantMiddleware } from './core/tenant/local-tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TenantModule,
    AuthModule,
    SystemModule,
    CashRegisterModule,
    ContactsModule,
    ProductsModule,
    SalesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LocalTenantMiddleware).forRoutes('*');
  }
}
