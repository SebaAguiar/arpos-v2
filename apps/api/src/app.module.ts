import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './data-access/prisma/prisma.module';
import { TenantModule } from './core/tenant/tenant.module';
import { AuthModule } from './features/auth/auth.module';
import { SystemModule } from './features/system/system.module';
import { ContactsModule } from './features/contacts/contacts.module';
import { ProductsModule } from './features/products/products.module';
import { VariantsModule } from './features/variants/variants.module';
import { SalesModule } from './features/sales/sales.module';
import { CashRegisterModule } from './features/cash-register/cash-register.module';
import { InventoryModule } from './features/inventory/inventory.module';
import { UsersModule } from './features/users/users.module';
import { StoresModule } from './features/stores/stores.module';
import { SyncModule } from './features/sync/sync.module';
import { PurchasesModule } from './features/purchases/purchases.module';
import { WalletModule } from './features/wallet/wallet.module';
import { LocalTenantMiddleware } from './core/tenant/local-tenant.middleware';
import { JwtAuthGuard } from './features/auth/guards/jwt-auth.guard';

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
    VariantsModule,
    SalesModule,
    InventoryModule,
    UsersModule,
    StoresModule,
    SyncModule,
    PurchasesModule,
    WalletModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LocalTenantMiddleware).forRoutes('*');
  }
}
