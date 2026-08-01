import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
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

export interface CloudSyncConfig {
  url?: string;
  jwt?: string;
}

const SYNC_RELAY_CHANNEL = 'sync:changes';
const PLACEHOLDER_PASSWORD = '!arcon-sync-placeholder!';

@Injectable()
export class CloudRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('CloudRelayService');
  private socket: Socket | null = null;
  private remoteChangesHandler: (() => void | Promise<void>) | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async onModuleInit(): Promise<void> {
    const { url, jwt } = await this.getCloudConfig();
    if (url && jwt) {
      this.connectWebSocket();
    }
  }

  onModuleDestroy(): void {
    this.disconnectWebSocket();
  }

  // ------------------------------------------------------------------
  // Configuration (DB-first, env fallback for development)
  // ------------------------------------------------------------------

  async getCloudConfig(): Promise<CloudSyncConfig> {
    const companyId = this.tenantContext.getCompanyId();

    if (companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { config: true },
      });

      if (company?.config) {
        try {
          const parsed = JSON.parse(company.config) as {
            cloud?: { url?: string; jwt?: string };
          };
          if (parsed.cloud?.url && parsed.cloud?.jwt) {
            return { url: parsed.cloud.url, jwt: parsed.cloud.jwt };
          }
        } catch {
          this.logger.warn('Company config is not valid JSON, falling back to env');
        }
      }
    }

    return {
      url: this.configService.get<string>('CLOUD_URL'),
      jwt: this.configService.get<string>('CLOUD_JWT'),
    };
  }

  async isCloudConfigured(): Promise<boolean> {
    const { url, jwt } = await this.getCloudConfig();
    return !!(url && jwt);
  }

  async saveCloudConfig(url: string, jwt: string): Promise<void> {
    await this.updateCompanyConfig((config) => ({
      ...config,
      cloud: { url, jwt },
    }));
    this.connectWebSocket();
  }

  async saveSubscription(subscription: {
    status: 'active' | 'inactive';
    tier?: string;
    expiresAt?: number;
  }): Promise<void> {
    await this.updateCompanyConfig((config) => ({
      ...config,
      subscription,
    }));
  }

  async getConfigInfo(): Promise<{
    cloud_configured: boolean;
    cloud_url: string | null;
    subscription: {
      status: 'active' | 'inactive' | 'none';
      tier?: string;
      expiresAt?: number;
    } | null;
  }> {
    const companyId = this.tenantContext.getCompanyId();
    let config: Record<string, unknown> = {};

    if (companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { config: true },
      });
      if (company?.config) {
        try {
          config = JSON.parse(company.config) as Record<string, unknown>;
        } catch {
          config = {};
        }
      }
    }

    const cloud = config.cloud as { url?: string } | undefined;
    const subscription = config.subscription as
      | { status?: string; tier?: string; expiresAt?: number }
      | undefined;

    const envUrl = this.configService.get<string>('CLOUD_URL');

    return {
      cloud_configured: Boolean(cloud?.url ?? envUrl),
      cloud_url: cloud?.url ?? envUrl ?? null,
      subscription: subscription?.status
        ? {
            status: subscription.status === 'active' ? 'active' : 'inactive',
            tier: subscription.tier,
            expiresAt: subscription.expiresAt,
          }
        : null,
    };
  }

  async clearCloudConfig(): Promise<void> {
    await this.updateCompanyConfig((config) => {
      const { cloud: _removed, ...rest } = config;
      return rest;
    });
    this.disconnectWebSocket();
  }

  private async updateCompanyConfig(
    update: (config: Record<string, unknown>) => Record<string, unknown>,
  ): Promise<void> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new Error('No company context for cloud config');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { config: true },
    });

    let current: Record<string, unknown> = {};
    if (company?.config) {
      try {
        current = JSON.parse(company.config) as Record<string, unknown>;
      } catch {
        current = {};
      }
    }

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        config: JSON.stringify(update(current)),
        updated_at: Math.floor(Date.now() / 1000),
      },
    });
  }

  // ------------------------------------------------------------------
  // WebSocket notifications (real-time push from cloud relay)
  // ------------------------------------------------------------------

  registerRemoteChangesHandler(handler: () => void | Promise<void>): void {
    this.remoteChangesHandler = handler;
  }

  connectWebSocket(): void {
    void this.connectWebSocketAsync();
  }

  private async connectWebSocketAsync(): Promise<void> {
    if (this.socket?.connected) return;

    const { url, jwt } = await this.getCloudConfig();
    if (!url || !jwt) return;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(url, {
      auth: { token: jwt },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 5_000,
      reconnectionDelayMax: 30_000,
    });

    this.socket.on('connect', () => {
      this.logger.log(`Connected to cloud relay at ${url}`);
    });

    this.socket.on(SYNC_RELAY_CHANNEL, () => {
      this.logger.log('Cloud relay notified remote changes');
      if (this.remoteChangesHandler) {
        void Promise.resolve(this.remoteChangesHandler()).catch((error) => {
          this.logger.warn(
            `Remote changes handler failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        });
      }
    });

    this.socket.on('connect_error', (error) => {
      this.logger.warn(`Cloud relay connection error: ${error.message}`);
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.debug(`Cloud relay disconnected: ${reason}`);
    });
  }

  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ------------------------------------------------------------------
  // Push / Pull over HTTP
  // ------------------------------------------------------------------

  async pushToCloud(item: {
    action: string;
    entity: string;
    entityId: string;
    payload: string;
  }): Promise<void> {
    const { url, jwt } = await this.getCloudConfig();
    if (!url || !jwt) {
      throw new Error('Cloud not configured');
    }

    const response = await fetch(`${url}/api/sync/apply`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
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
    const { url, jwt } = await this.getCloudConfig();
    if (!url || !jwt) {
      throw new Error('Cloud not configured');
    }

    const target = since
      ? `${url}/api/sync/changes?since=${since}`
      : `${url}/api/sync/changes`;

    const response = await fetch(target, {
      headers: {
        Authorization: `Bearer ${jwt}`,
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

    const result: PullResult = {
      pulled: changes.length,
      applied: 0,
      skipped: 0,
      errors: [],
    };

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
        this.logger.warn(
          `Failed to apply remote change ${change.entity}:${change.entityId}: ${message}`,
        );
      }
    }

    this.logger.log(
      `Pull complete: ${result.applied} applied, ${result.skipped} skipped, ${result.errors.length} errors`,
    );
    return result;
  }

  // ------------------------------------------------------------------
  // Remote change application (last-write-wins)
  // ------------------------------------------------------------------

  private async applyRemoteChange(change: CloudChange): Promise<boolean> {
    const companyId = this.tenantContext.getCompanyId();
    const storeId = this.tenantContext.getStoreId();

    switch (change.entity) {
      case 'product':
        return this.applyProductChange(change, companyId, storeId);
      case 'contact':
        return this.applyContactChange(change, companyId, storeId);
      case 'inventory':
        return this.applyInventoryChange(change, companyId, storeId);
      case 'sale':
        return this.applySaleChange(change, companyId, storeId);
      case 'user':
        return this.applyUserChange(change, companyId);
      case 'cash_register':
        return this.applyCashRegisterChange(change, companyId, storeId);
      case 'wallet_transaction':
        return this.applyWalletTransactionChange(change, companyId, storeId);
      default:
        this.logger.warn(`Unknown sync entity: ${change.entity}, skipping`);
        return false;
    }
  }

  private async isOutdated(
    existingUpdatedAt: number | null,
    changeUpdatedAt: number,
  ): Promise<boolean> {
    return existingUpdatedAt !== null && existingUpdatedAt >= changeUpdatedAt;
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

    if (await this.isOutdated(existing?.updated_at ?? null, change.updatedAt)) {
      return false;
    }

    const payload = change.payload as Record<string, unknown>;

    if (change.action === 'delete') {
      if (!existing) return true;
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

    if (await this.isOutdated(existing?.updated_at ?? null, change.updatedAt)) {
      return false;
    }

    const payload = change.payload as Record<string, unknown>;

    if (change.action === 'delete') {
      if (!existing) return true;
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

    if (await this.isOutdated(existing?.updated_at ?? null, change.updatedAt)) {
      return false;
    }

    const payload = change.payload as Record<string, unknown>;

    if (change.action === 'delete') {
      if (!existing) return true;
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

  private async applySaleChange(
    change: CloudChange,
    companyId: string,
    storeId: string,
  ): Promise<boolean> {
    if (change.action === 'delete') return false;

    const existing = await this.prisma.sale.findUnique({
      where: { id: change.entityId },
      select: { updated_at: true },
    });

    if (await this.isOutdated(existing?.updated_at ?? null, change.updatedAt)) {
      return false;
    }

    const payload = change.payload as Record<string, unknown>;
    const rawItems = Array.isArray(payload.items) ? payload.items : [];
    const now = change.updatedAt;

    const userId = (payload.user_id as string) ?? null;
    const resolvedUserId = userId
      ? await this.resolveUserId(userId, companyId, now)
      : 'system';

    return this.prisma.$transaction(async (tx) => {
      const data = {
        companyId,
        storeId,
        user_id: resolvedUserId,
        contact_id: (payload.contact_id as string) ?? null,
        cash_register_id: (payload.cash_register_id as string) ?? null,
        ticket_number: (payload.ticket_number as number) ?? 0,
        total_cents: (payload.total_cents as number) ?? 0,
        discount_cents: (payload.discount_cents as number) ?? 0,
        tax_cents: (payload.tax_cents as number) ?? 0,
        status: (payload.status as string) ?? 'completed',
        payment_method: (payload.payment_method as string) ?? 'cash',
        payment_details: (payload.payment_details as string) ?? null,
        notes: (payload.notes as string) ?? null,
        created_at: now,
        updated_at: now,
      };

      if (existing) {
        await tx.sale.update({ where: { id: change.entityId }, data });
      } else {
        await tx.sale.create({ data: { id: change.entityId, ...data } });
      }

      const itemCount = await tx.saleItem.count({
        where: { saleId: change.entityId },
      });
      if (itemCount === 0) {
        for (const raw of rawItems) {
          const item = raw as Record<string, unknown>;
          const productId = item.productId as string;
          const unitPrice = (item.unit_price_cents as number) ?? 0;
          const quantity = (item.quantity as number) ?? 1;

          await tx.saleItem.create({
            data: {
              saleId: change.entityId,
              productId,
              variantId: (item.variantId as string) ?? null,
              quantity,
              unit_price_cents: unitPrice,
              total_cents: (item.total_cents as number) ?? unitPrice * quantity,
              discount_cents: (item.discount_cents as number) ?? 0,
            },
          });

          const product = await tx.product.findUnique({
            where: { id: productId },
            select: { stock_quantity: true },
          });
          if (product) {
            await tx.product.update({
              where: { id: productId },
              data: { stock_quantity: { decrement: quantity } },
            });
          }
        }
      }

      return true;
    });
  }

  private async resolveUserId(
    userId: string,
    companyId: string,
    now: number,
  ): Promise<string> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (existing) return userId;

    const placeholderEmail = `sync-${userId}@local.arcon`;
    const placeholder = await this.prisma.user.create({
      data: {
        id: userId,
        companyId,
        email: placeholderEmail,
        password: await bcrypt.hash(PLACEHOLDER_PASSWORD, 10),
        name: 'Usuario remoto',
        role: 'cashier',
        is_active: false,
        created_at: now,
        updated_at: now,
      },
    });
    return placeholder.id;
  }

  private async applyUserChange(
    change: CloudChange,
    companyId: string,
  ): Promise<boolean> {
    const existing = await this.prisma.user.findUnique({
      where: { id: change.entityId },
      select: { updated_at: true },
    });

    if (await this.isOutdated(existing?.updated_at ?? null, change.updatedAt)) {
      return false;
    }

    const payload = change.payload as Record<string, unknown>;

    if (change.action === 'delete') {
      if (!existing) return true;
      await this.prisma.user.update({
        where: { id: change.entityId },
        data: { is_active: false, updated_at: change.updatedAt },
      });
      return true;
    }

    const data = {
      email: payload.email as string,
      name: (payload.name as string) ?? 'Usuario',
      role: (payload.role as string) ?? 'cashier',
      updated_at: change.updatedAt,
    };

    if (existing) {
      await this.prisma.user.update({
        where: { id: change.entityId },
        data,
      });
    } else {
      await this.prisma.user.create({
        data: {
          id: change.entityId,
          companyId,
          ...data,
          password: await bcrypt.hash(
            `${PLACEHOLDER_PASSWORD}-${randomBytes(8).toString('hex')}`,
            10,
          ),
          is_active: false,
          created_at: change.updatedAt,
        },
      });
    }

    return true;
  }

  private async applyCashRegisterChange(
    change: CloudChange,
    companyId: string,
    storeId: string,
  ): Promise<boolean> {
    const payload = change.payload as Record<string, unknown>;

    // Movements are enqueued under the register id with a movementId marker
    if (payload.movementId) {
      const movementId = payload.movementId as string;
      const movementExists = await this.prisma.cashMovement.findUnique({
        where: { id: movementId },
        select: { id: true },
      });
      if (movementExists) return true;

      const register = await this.prisma.cashRegister.findUnique({
        where: { id: change.entityId },
        select: { id: true },
      });
      if (!register) {
        throw new Error(
          `Cash register ${change.entityId} not found for movement ${movementId}`,
        );
      }

      await this.prisma.cashMovement.create({
        data: {
          id: movementId,
          cashRegisterId: change.entityId,
          companyId,
          storeId,
          type: (payload.type as string) ?? 'sale',
          amount_cents: (payload.amount_cents as number) ?? 0,
          description: (payload.description as string) ?? '',
          created_at: change.updatedAt,
        },
      });
      return true;
    }

    const existing = await this.prisma.cashRegister.findUnique({
      where: { id: change.entityId },
      select: { updated_at: true },
    });

    if (await this.isOutdated(existing?.updated_at ?? null, change.updatedAt)) {
      return false;
    }

    const data = {
      companyId,
      storeId,
      name: (payload.name as string) ?? 'Caja',
      status: (payload.status as string) ?? 'closed',
      opening_amount: (payload.opening_amount as number) ?? 0,
      closing_amount: (payload.closing_amount as number) ?? null,
      opened_at: (payload.opened_at as number) ?? null,
      closed_at: (payload.closed_at as number) ?? null,
      updated_at: change.updatedAt,
    };

    if (existing) {
      await this.prisma.cashRegister.update({
        where: { id: change.entityId },
        data,
      });
    } else {
      await this.prisma.cashRegister.create({
        data: {
          id: change.entityId,
          ...data,
          created_at: change.updatedAt,
        },
      });
    }

    return true;
  }

  private async applyWalletTransactionChange(
    change: CloudChange,
    companyId: string,
    _storeId: string,
  ): Promise<boolean> {
    if (change.action === 'delete') return false;

    const existing = await this.prisma.walletTransaction.findUnique({
      where: { id: change.entityId },
      select: { id: true },
    });
    if (existing) return true;

    const payload = change.payload as Record<string, unknown>;
    const contactId = payload.contactId as string;
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      select: { id: true, balance_cents: true },
    });
    if (!contact) {
      throw new Error(
        `Contact ${contactId} not found for wallet transaction ${change.entityId}`,
      );
    }

    const amount = (payload.amount_cents as number) ?? 0;
    const type = (payload.type as string) ?? 'credit';
    const balanceAfter =
      type === 'debit' ? contact.balance_cents - amount : contact.balance_cents + amount;

    return this.prisma.$transaction(async (tx) => {
      await tx.walletTransaction.create({
        data: {
          id: change.entityId,
          companyId,
          contactId,
          type,
          amount_cents: amount,
          balance_before: contact.balance_cents,
          balance_after: balanceAfter,
          reference: (payload.reference as string) ?? null,
          reference_id: (payload.reference_id as string) ?? null,
          notes: (payload.notes as string) ?? null,
          created_by: (payload.created_by as string) ?? null,
          created_at: change.updatedAt,
        },
      });

      await tx.contact.update({
        where: { id: contactId },
        data: { balance_cents: balanceAfter },
      });

      return true;
    });
  }
}
