import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../../core/tenant/tenant-context.service';

export interface SubscriptionInfo {
  status: 'active' | 'inactive' | 'none';
  tier?: string;
  cloudUrl?: string;
  cloudJwt?: string;
  expiresAt?: number;
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new ForbiddenException('No company context');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { config: true },
    });

    if (!company) {
      throw new ForbiddenException('Company not found');
    }

    const subscription = this.getSubscription(company.config);
    if (!subscription || subscription.status !== 'active') {
      throw new ForbiddenException(
        'Cloud sync requires an active subscription. Go to Settings > Sync to activate.',
      );
    }

    if (subscription.expiresAt && subscription.expiresAt < Math.floor(Date.now() / 1000)) {
      throw new ForbiddenException('Subscription has expired. Renew to continue using cloud sync.');
    }

    return true;
  }

  private getSubscription(config: string | null): SubscriptionInfo | null {
    if (!config) return null;
    try {
      const parsed = JSON.parse(config);
      return parsed.subscription ?? null;
    } catch {
      return null;
    }
  }
}
