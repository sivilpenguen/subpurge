/**
 * Picks the plan list for a subscription: the user's country file when its
 * currency matches, App Store prices for App Store billing and web prices
 * otherwise; the bundled Turkish plans as an offline fallback for TRY.
 */
import { SERVICE_PRESETS, type ServicePlanTemplate } from '../constants/services';
import type { CountryPricing } from '../utils/remotePricing';
import type { BillingSource } from './subscriptionTypes';

export type PlanSource = 'web' | 'appStore';
export type PlanLookup = (name: string, currencyCode: string | undefined, billedVia?: BillingSource) => { plans: ServicePlanTemplate[]; source: PlanSource } | null;

export function createPlanLookup(remote: CountryPricing | null): PlanLookup {
  return (name, currencyCode, billedVia) => {
    if (remote && remote.currency === currencyCode) {
      const entry = remote.services[name];
      if (entry) {
        if (billedVia === 'appstore' && entry.appStore?.length) return { plans: entry.appStore, source: 'appStore' };
        if (entry.web?.length) return { plans: entry.web, source: 'web' };
        if (entry.appStore?.length) return { plans: entry.appStore, source: 'appStore' };
      }
    }
    if (currencyCode === 'TRY' && billedVia !== 'appstore') {
      const bundled = SERVICE_PRESETS.find(s => s.name === name)?.plans;
      if (bundled?.length) return { plans: bundled, source: 'web' };
    }
    return null;
  };
}

/** Bundled data only (tests, and before the country file arrives). */
export const bundledPlanLookup = createPlanLookup(null);
