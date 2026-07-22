export abstract class BaseEntity {
  abstract id: string;
  abstract created_at: number;
  abstract updated_at: number;
}

export abstract class TenantBaseEntity extends BaseEntity {
  abstract companyId: string;
}
