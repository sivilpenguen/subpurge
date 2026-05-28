/**
 * Filter helpers used by Purge Mode and the subscription list.
 * Pure functions — no React, no side effects.
 */
import { SERVICE_PRESETS } from '../constants/services';
import type { ServicePlanTemplate } from '../constants/services';
import { formatDateInput, parseDateValue } from '../utils/subscriptionDates';
import type { PriceChangeInfo, Subscription } from './subscriptionTypes';

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── Internal preset helpers ──────────────────────────────────────────────────

function findPresetByName(name: string) {
  return SERVICE_PRESETS.find(s => s.name === name);
}

export function findPlanTemplate(
  subscription: Pick<Subscription, 'name' | 'planTemplateId' | 'billingCycle' | 'price'>,
): ServicePlanTemplate | null {
  const preset = findPresetByName(subscription.name);
  if (!preset?.plans?.length) return null;

  if (subscription.planTemplateId) {
    const matched = preset.plans.find(p => p.id === subscription.planTemplateId);
    if (matched) return matched;
  }

  const exact = preset.plans.find(
    p => p.billingCycle === subscription.billingCycle && p.price.toFixed(2) === subscription.price.toFixed(2),
  );
  if (exact) return exact;

  const sameCycle = preset.plans.filter(p => p.billingCycle === subscription.billingCycle);
  return sameCycle.length === 1 ? sameCycle[0] : null;
}

// ─── Exported filter functions ────────────────────────────────────────────────

export function getDueReviewSubscriptions(subscriptions: Subscription[], now = new Date()): Subscription[] {
  const today = formatDateInput(now);
  return subscriptions
    .filter(s => s.isActive && s.reviewReminderDate)
    .sort((a, b) => (a.reviewReminderDate ?? '').localeCompare(b.reviewReminderDate ?? ''))
    .filter(s => (s.reviewReminderDate ?? '') <= today);
}

export function getInactiveSubscriptions(subscriptions: Subscription[], now = new Date()): Subscription[] {
  const today = parseDateValue(formatDateInput(now)).getTime();
  return subscriptions
    .filter(s => s.isActive && s.lastUsedAt)
    .filter(s => {
      const last = parseDateValue(s.lastUsedAt!);
      return Math.floor((today - last.getTime()) / DAY_MS) >= 15;
    })
    .sort((a, b) => (a.lastUsedAt ?? '').localeCompare(b.lastUsedAt ?? ''));
}

export function getPriceChangeInfo(subscription: Subscription): PriceChangeInfo | null {
  const plan = findPlanTemplate(subscription);
  if (!plan || plan.price <= subscription.price) return null;
  return {
    subscriptionId: subscription.id,
    oldPrice: subscription.price,
    newPrice: plan.price,
    delta: plan.price - subscription.price,
  };
}

export function getPriceIncreaseSubscriptions(
  subscriptions: Subscription[],
): Array<Subscription & { priceChange: PriceChangeInfo }> {
  return subscriptions
    .filter(s => s.isActive)
    .map(s => {
      const priceChange = getPriceChangeInfo(s);
      return priceChange ? { ...s, priceChange } : null;
    })
    .filter((s): s is Subscription & { priceChange: PriceChangeInfo } => s !== null)
    .sort((a, b) => b.priceChange.delta - a.priceChange.delta);
}
