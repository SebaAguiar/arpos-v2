import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantContextService {
  private companyId: string = '';
  private storeId: string = '';
  private userId: string = '';

  setCompanyId(companyId: string): void {
    this.companyId = companyId;
  }

  getCompanyId(): string {
    return this.companyId;
  }

  setStoreId(storeId: string): void {
    this.storeId = storeId;
  }

  getStoreId(): string {
    return this.storeId;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  getUserId(): string {
    return this.userId;
  }

  clear(): void {
    this.companyId = '';
    this.storeId = '';
    this.userId = '';
  }
}
