import type { BillingCycle } from '../constants/services';

export type TrackingType = 'renewal' | 'expiry';

export interface Subscription {
  id: string;
  name: string;
  color: string;
  icon: string;
  logoUrl?: string;
  manageDeepLink?: string;
  planTemplateId?: string | null;
  price: number;
  billingCycle: BillingCycle;
  startDate: string;
  trackingType: TrackingType;
  nextBillingDate?: string | null;
  expiryDate?: string | null;
  currentPeriodStart: string;
  completedCyclesCarry: number;
  accruedSpentCarry: number;
  isActive: boolean;
  endedAt?: string | null;
  purpose?: string;
  quickCancelUrl?: string;
  reviewReminderDate?: string | null;
  lastUsedAt?: string | null;
  notes?: string;
}

export interface PriceChangeInfo {
  subscriptionId: string;
  oldPrice: number;
  newPrice: number;
  delta: number;
}
