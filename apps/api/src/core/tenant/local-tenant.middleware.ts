import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { TenantContextService } from './tenant-context.service';
import { PrismaService } from '../../data-access/prisma/prisma.service';

interface AugmentedRequest extends Request {
  companyId?: string;
  storeId?: string;
  user?: { id?: string };
}

@Injectable()
export class LocalTenantMiddleware implements NestMiddleware {
  private resolved = false;

  constructor(
    private configService: ConfigService,
    private tenantContext: TenantContextService,
    private prisma: PrismaService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    let localCompanyId = this.configService.get<string>('LOCAL_COMPANY_ID');
    let localStoreId = this.configService.get<string>('LOCAL_STORE_ID');

    if ((!localCompanyId || !localStoreId) && !this.resolved) {
      const company = await this.prisma.company.findFirst();
      if (company) {
        localCompanyId = localCompanyId || company.id;
        const store = await this.prisma.store.findFirst({
          where: { companyId: company.id },
        });
        localStoreId = localStoreId || store?.id || '';
      }
      this.resolved = true;
    }

    if (localCompanyId) {
      this.tenantContext.setCompanyId(localCompanyId);
    }
    if (localStoreId) {
      this.tenantContext.setStoreId(localStoreId);
    }

    const augmented = req as AugmentedRequest;
    if (augmented.user?.id) {
      this.tenantContext.setUserId(augmented.user.id);
    }

    augmented.companyId = localCompanyId;
    augmented.storeId = localStoreId;

    next();
  }
}
