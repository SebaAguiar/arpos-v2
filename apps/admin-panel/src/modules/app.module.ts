import { KanjijsModule } from '@kanjijs/core';
import { StoreModule } from '@kanjijs/store';
import { HealthModule } from './health/health.module';
import { AdminAuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ProductsModule } from './products/products.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ProjectsModule } from './projects/projects.module';
import { PaymentsModule } from './payments/payments.module';
import { SupportModule } from './support/support.module';
import { WebhooksModule } from './webhooks/webhooks.module';
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
    PlansModule,
    SubscriptionsModule,
    ProjectsModule,
    PaymentsModule,
    SupportModule,
    WebhooksModule,
    HealthModule,
  ],
})
export class AppModule {}
