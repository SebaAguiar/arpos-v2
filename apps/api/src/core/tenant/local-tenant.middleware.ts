import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';
import { PrismaService } from '../../data-access/prisma/prisma.service';

interface AugmentedRequest extends Request {
  companyId?: string;
  storeId?: string;
  user?: { id?: string };
}

/** Prisma error code for "table does not exist" (fresh DB before first-run setup). */
const P2021_TABLE_NOT_FOUND = 'P2021';

@Injectable()
export class LocalTenantMiddleware implements NestMiddleware {
  private resolved = false;

  constructor(
    private configService: ConfigService,
    private tenantContext: TenantContextService,
    private prisma: PrismaService,
  ) {}

  /**
   * Resolve a lookup against a freshly created DB that has no tables yet.
   * The first-run wizard creates the schema, so until then every request
   * (including the boot health check) must degrade gracefully instead of
   * throwing, or the app deadlocks behind the health gate.
   */
  private async tryFind<T>(query: () => Promise<T>): Promise<{ value: T | null; schemaReady: boolean }> {
    try {
      return { value: await query(), schemaReady: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === P2021_TABLE_NOT_FOUND) {
        return { value: null, schemaReady: false };
      }
      throw error;
    }
  }

  async use(req: Request, _res: Response, next: NextFunction) {
    let localCompanyId = this.configService.get<string>('LOCAL_COMPANY_ID');
    let localStoreId = this.configService.get<string>('LOCAL_STORE_ID');

    if ((!localCompanyId || !localStoreId) && !this.resolved) {
      const company = await this.tryFind(() => this.prisma.company.findFirst());
      if (company.value) {
        localCompanyId = localCompanyId || company.value.id;
        const store = await this.tryFind(() =>
          this.prisma.store.findFirst({ where: { companyId: company.value!.id } }),
        );
        localStoreId = localStoreId || store.value?.id || '';
        this.resolved = true;
      } else if (company.schemaReady) {
        // Schema exists but no company yet — don't re-probe every request.
        this.resolved = true;
      }
      // schemaReady=false: fresh DB, allow re-probing once the wizard creates tables.
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
    } else {
      const admin = await this.tryFind(() => this.prisma.user.findFirst({ where: { role: 'admin' } }));
      if (admin.value) {
        this.tenantContext.setUserId(admin.value.id);
      }
    }

    augmented.companyId = localCompanyId;
    augmented.storeId = localStoreId;

    next();
  }
}
