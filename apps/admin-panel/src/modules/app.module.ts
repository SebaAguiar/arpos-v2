import { KanjijsModule } from '@kanjijs/core';
import { StoreModule } from '@kanjijs/store';
import { HealthModule } from './health/health.module';
import { AdminAuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ProductsModule } from './products/products.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ProjectsModule } from './projects/projects.module';
import { PaymentsModule } from './payments/payments.module';
import * as schema from '@/database/schema';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5436/admin_panel';

@KanjijsModule({
  imports: [
    StoreModule.forRoot({
      type: 'postgres',
      connectionString: databaseUrl,
      schema,
    }),
    AdminAuthModule,
    ClientsModule,
    ProductsModule,
    SubscriptionsModule,
    ProjectsModule,
    PaymentsModule,
    HealthModule,
  ],
})
export class AppModule {}
