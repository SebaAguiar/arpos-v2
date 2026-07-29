import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../data-access/prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

export interface CloudChange {
  action: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  payload: Record<string, unknown>;
  updatedAt: number;
}

export interface PullResult {
  pulled: number;
  applied: number;
  skipped: number;
  errors: string[];
}

@Injectable()
export class CloudRelayService {
  private readonly logger = new Logger('CloudRelayService');

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async pushToCloud(item: {
    action: string;
    entity: string;
    entityId: string;
    payload: string;
  }): Promise<void> {
    const { cloudUrl, cloudJwt } = this.getCloudConfig();
    if (!cloudUrl || !cloudJwt) {
      throw new Error('Cloud not configured');
    }

    const response = await fetch(`${cloudUrl}/api/sync/apply`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cloudJwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: item.action,
        entity: item.entity,
        entityId: item.entityId,
        payload: JSON.parse(item.payload),
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      throw new Error(`Cloud push failed (${response.status}): ${text}`);
    }
  }

  async pullFromCloud(since: number | null): Promise<PullResult> {
    const { cloudUrl, cloudJwt } = this.getCloudConfig();
    if (!cloudUrl || !cloudJwt) {
      throw new Error('Cloud not configured');
    }

    const url = since
      ? `${cloudUrl}/api/sync/changes?since=${since}`
      : `${cloudUrl}/api/sync/changes`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cloudJwt}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      throw new Error(`Cloud pull failed (${response.status}): ${text}`);
    }

    const changes: CloudChange[] = await response.json();
    if (changes.length === 0) {
      return { pulled: 0, applied: 0, skipped: 0, errors: [] };
    }

    const result: PullResult = { pulled: changes.length, applied: 0, skipped: 0, errors: [] };

    for (const change of changes) {
      try {
        const applied = await this.applyRemoteChange(change);
        if (applied) {
          result.applied++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push(message);
        this.logger.warn(`Failed to apply remote change ${change.entity}:${change.entityId}: ${message}`);
      }
    }

    this.logger.log(`Pull complete: ${result.applied} applied, ${result.skipped} skipped, ${result.errors.length} errors`);
    return result;
  }

  private async applyRemoteChange(change: CloudChange): Promise<boolean> {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();

    switch (change.entity) {
      case 'product': {
        return this.applyProductChange(change, companyId, storeId);
      }
      case 'contact': {
        return this.applyContactChange(change, companyId, storeId);
      }
      case 'inventory': {
        return this.applyInventoryChange(change, companyId, storeId);
      }
      default:
        this.logger.warn(`Unknown sync entity: ${change.entity}, skipping`);
        return false;
    }
  }

  private async applyProductChange(
    change: CloudChange,
    companyId: string,
    storeId: string,
  ): Promise<boolean> {
    const existing = await this.prisma.product.findUnique({
      where: { id: change.entityId },
      select: { updated_at: true },
    });

    if (existing && existing.updated_at >= change.updatedAt) {
      return false;
    }

    const payload = change.payload as Record<string, unknown>;

    if (change.action === 'delete') {
      await this.prisma.product.update({
        where: { id: change.entityId },
        data: { is_active: false, updated_at: change.updatedAt },
      });
      return true;
    }

    const data = {
      companyId,
      storeId,
      code: payload.code as string,
      name: payload.name as string,
      description: (payload.description as string) ?? null,
      price_cents: (payload.price_cents as number) ?? 0,
      cost_cents: (payload.cost_cents as number) ?? null,
      category_id: (payload.category_id as string) ?? null,
      is_active: (payload.is_active as boolean) ?? true,
      updated_at: change.updatedAt,
    };

    if (existing) {
      await this.prisma.product.update({
        where: { id: change.entityId },
        data,
      });
    } else {
      await this.prisma.product.create({
        data: {
          id: change.entityId,
          ...data,
          created_at: change.updatedAt,
        },
      });
    }

    return true;
  }

  private async applyContactChange(
    change: CloudChange,
    companyId: string,
    _storeId: string,
  ): Promise<boolean> {
    const existing = await this.prisma.contact.findUnique({
      where: { id: change.entityId },
      select: { updated_at: true },
    });

    if (existing && existing.updated_at >= change.updatedAt) {
      return false;
    }

    const payload = change.payload as Record<string, unknown>;

    if (change.action === 'delete') {
      await this.prisma.contact.update({
        where: { id: change.entityId },
        data: { is_active: false, updated_at: change.updatedAt },
      });
      return true;
    }

    const data = {
      companyId,
      type: (payload.type as string) ?? 'customer',
      name: payload.name as string,
      email: (payload.email as string) ?? null,
      phone: (payload.phone as string) ?? null,
      address: (payload.address as string) ?? null,
      tax_id: (payload.tax_id as string) ?? null,
      notes: (payload.notes as string) ?? null,
      is_active: (payload.is_active as boolean) ?? true,
      updated_at: change.updatedAt,
    };

    if (existing) {
      await this.prisma.contact.update({
        where: { id: change.entityId },
        data,
      });
    } else {
      await this.prisma.contact.create({
        data: {
          id: change.entityId,
          ...data,
          created_at: change.updatedAt,
        },
      });
    }

    return true;
  }

  private async applyInventoryChange(
    change: CloudChange,
    companyId: string,
    storeId: string,
  ): Promise<boolean> {
    const existing = await this.prisma.inventory.findUnique({
      where: { id: change.entityId },
      select: { updated_at: true },
    });

    if (existing && existing.updated_at >= change.updatedAt) {
      return false;
    }

    const payload = change.payload as Record<string, unknown>;

    if (change.action === 'delete') {
      await this.prisma.inventory.update({
        where: { id: change.entityId },
        data: { quantity: 0, updated_at: change.updatedAt },
      });
      return true;
    }

    const data = {
      companyId,
      storeId,
      productId: payload.productId as string,
      variantId: (payload.variantId as string) ?? null,
      quantity: (payload.quantity as number) ?? 0,
      min_stock: (payload.min_stock as number) ?? 0,
      max_stock: (payload.max_stock as number) ?? null,
      updated_at: change.updatedAt,
    };

    if (existing) {
      await this.prisma.inventory.update({
        where: { id: change.entityId },
        data,
      });
    } else {
      await this.prisma.inventory.create({
        data: {
          id: change.entityId,
          ...data,
          created_at: change.updatedAt,
        },
      });
    }

    return true;
  }

  isCloudConfigured(): boolean {
    const { cloudUrl, cloudJwt } = this.getCloudConfig();
    return !!(cloudUrl && cloudJwt);
  }

  private getCloudConfig(): { cloudUrl: string | undefined; cloudJwt: string | undefined } {
    const cloudUrl = this.configService.get<string>('CLOUD_URL');
    const cloudJwt = this.configService.get<string>('CLOUD_JWT');
    return { cloudUrl, cloudJwt };
  }
}
