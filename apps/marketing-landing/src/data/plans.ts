export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'months' | 'days';
  frequency: number;
  trialDays: number;
  features: string[];
  highlighted: boolean;
  mpPlanId?: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Emprendedor',
    description: 'Para negocios de una sola sucursal',
    price: 0,
    currency: 'ARS',
    interval: 'months',
    frequency: 1,
    trialDays: 0,
    features: [
      '1 sucursal',
      'POS offline-first',
      'Catálogo de productos',
      'Inventario básico',
      'Reportes diarios',
      'Soporte por email',
    ],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Profesional',
    description: 'Para negocios que necesitan cloud sync',
    price: 4999,
    currency: 'ARS',
    interval: 'months',
    frequency: 1,
    trialDays: 14,
    features: [
      'Todo del plan Emprendedor',
      'Sync cloud ilimitado',
      'Multi-dispositivo',
      'Reportes avanzados + PDF',
      'Migración de datos',
      'Soporte prioritario',
    ],
    highlighted: true,
    mpPlanId: import.meta.env.MP_PLAN_ID_PRO || '',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para empresas con múltiples sucursales',
    price: 9999,
    currency: 'ARS',
    interval: 'months',
    frequency: 1,
    trialDays: 14,
    features: [
      'Todo del plan Profesional',
      'Sucursales ilimitadas',
      'Multi-tenant',
      'API para integraciones',
      'Webhooks personalizados',
      'Soporte dedicado',
    ],
    highlighted: false,
    mpPlanId: import.meta.env.MP_PLAN_ID_ENTERPRISE || '',
  },
];
