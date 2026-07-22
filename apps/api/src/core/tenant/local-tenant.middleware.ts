import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class LocalTenantMiddleware implements NestMiddleware {
  constructor(
    private configService: ConfigService,
    private tenantContext: TenantContextService,
  ) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const localCompanyId = this.configService.get<string>('LOCAL_COMPANY_ID');
    const localStoreId = this.configService.get<string>('LOCAL_STORE_ID');

    if (localCompanyId) {
      this.tenantContext.setCompanyId(localCompanyId);
    }
    if (localStoreId) {
      this.tenantContext.setStoreId(localStoreId);
    }

    const userId = (req as any).user?.id;
    if (userId) {
      this.tenantContext.setUserId(userId);
    }

    (req as any).companyId = localCompanyId;
    (req as any).storeId = localStoreId;

    next();
  }
}
