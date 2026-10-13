import type { BillingCycle } from '../constants/services';

export type TrackingType = 'renewal' | 'expiry';

/** Where the user pays — decides which page the cancel flow opens. */
export type BillingSource = 'appstore' | 'googleplay' | 'web' | 'operator';

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
  currencyCode?: string;
  billedVia?: BillingSource;
}

export interface PriceChangeInfo {
  subscriptionId: string;
  oldPrice: number;
  newPrice: number;
  delta: number;
}

export type ThemeMode = 'dark' | 'light';

/** One confirmed cancellation, kept for the "saved per year" counter. */
export interface PurgeLogEntry {
  id: string;
  name: string;
  yearly: number;
  currencyCode: string;
  date: string;
}
