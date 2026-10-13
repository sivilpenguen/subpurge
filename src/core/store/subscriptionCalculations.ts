/**
 * Pure calculation functions for subscription spend.
 * No React, no AsyncStorage — safe to import anywhere including tests.
 */
import type { BillingCycle } from '../constants/services';
import { addMonths, addYears, formatDateInput, parseDateValue } from '../utils/subscriptionDates';
import type { Subscription } from './subscriptionTypes';

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── Cycle counting ───────────────────────────────────────────────────────────

export function getCompletedCycleCountBetween(
  startISO: string,
  endISO: string,
  cycle: BillingCycle,
): number {
  const start = parseDateValue(startISO);
  const end = parseDateValue(endISO);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }

  if (cycle === 'weekly') {
    return Math.floor((end.getTime() - start.getTime()) / (7 * DAY_MS));
  }

  if (cycle === 'monthly') {
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months <= 0) return 0;
    if (addMonths(start, months) > end) months -= 1;
    return Math.max(0, months);
  }

  let years = end.getFullYear() - start.getFullYear();
  if (years <= 0) return 0;
  if (addYears(start, years) > end) years -= 1;
  return Math.max(0, years);
}

export function getCompletedCycleCount(subscription: Subscription, now = new Date()): number {
  const effectiveEnd = subscription.isActive
    ? now.toISOString()
    : (subscription.endedAt ?? now.toISOString());
  return (
    subscription.completedCyclesCarry +
    getCompletedCycleCountBetween(subscription.currentPeriodStart, effectiveEnd, subscription.billingCycle)
  );
}

// ─── Spend calculations ───────────────────────────────────────────────────────

export function getSubscriptionTotalSpent(subscription: Subscription, now = new Date()): number {
  const effectiveEnd = subscription.isActive
    ? now.toISOString()
    : (subscription.endedAt ?? now.toISOString());
  const unsettled = getCompletedCycleCountBetween(
    subscription.currentPeriodStart,
    effectiveEnd,
    subscription.billingCycle,
  );
  return subscription.accruedSpentCarry + unsettled * subscription.price;
}

function getRenewalCycleWindow(subscription: Subscription) {
  if (!subscription.nextBillingDate) return null;
  const cycleEnd = parseDateValue(subscription.nextBillingDate);
  if (Number.isNaN(cycleEnd.getTime())) return null;

  const cycleStart =
    subscription.billingCycle === 'weekly'
      ? new Date(cycleEnd.getTime() - 7 * DAY_MS)
      : subscription.billingCycle === 'monthly'
        ? addMonths(cycleEnd, -1)
        : addYears(cycleEnd, -1);

  return { cycleStart, cycleEnd };
}

function getFixedTermCycleWindow(subscription: Subscription) {
  if (!subscription.expiryDate) return null;
  const cycleStart = parseDateValue(subscription.currentPeriodStart || subscription.startDate);
  const cycleEnd = parseDateValue(subscription.expiryDate);
  if (Number.isNaN(cycleStart.getTime()) || Number.isNaN(cycleEnd.getTime()) || cycleEnd <= cycleStart) {
    return null;
  }
  return { cycleStart, cycleEnd };
}

export function getCurrentCycleProratedSpent(subscription: Subscription, now = new Date()): number {
  const cycleWindow =
    subscription.trackingType === 'renewal'
      ? getRenewalCycleWindow(subscription)
      : getFixedTermCycleWindow(subscription);

  if (!cycleWindow) return 0;

  const effectiveEnd = subscription.isActive
    ? now
    : subscription.endedAt
      ? parseDateValue(subscription.endedAt)
      : now;

  if (Number.isNaN(effectiveEnd.getTime()) || effectiveEnd <= cycleWindow.cycleStart) return 0;

  const totalDuration = cycleWindow.cycleEnd.getTime() - cycleWindow.cycleStart.getTime();
  if (totalDuration <= 0) return 0;

  const elapsed = Math.min(cycleWindow.cycleEnd.getTime(), effectiveEnd.getTime()) - cycleWindow.cycleStart.getTime();
  if (elapsed <= 0) return 0;

  return subscription.price * Math.min(1, elapsed / totalDuration);
}

export function getSubscriptionAccruedSpent(subscription: Subscription, now = new Date()): number {
  return getSubscriptionTotalSpent(subscription, now) + getCurrentCycleProratedSpent(subscription, now);
}

export function getSubscriptionPaidUsage(subscription: Subscription, now = new Date()): number {
  if (!subscription.isActive) return 0;
  return getCurrentCycleProratedSpent(subscription, now);
}

// Remaining amount owed until the tracked date (nextBillingDate or expiryDate).
// renewal → price of the upcoming cycle (one payment)
// expiry  → prorated remainder of the fixed term
export function getSubscriptionFutureCommitment(subscription: Subscription, now = new Date()): number {
  if (!subscription.isActive) return 0;

  if (subscription.trackingType === 'renewal') {
    return subscription.nextBillingDate ? subscription.price : 0;
  }

  if (!subscription.expiryDate) return 0;
  const expiry = parseDateValue(subscription.expiryDate);
  const start = parseDateValue(subscription.currentPeriodStart || subscription.startDate);
  if (Number.isNaN(expiry.getTime()) || Number.isNaN(start.getTime())) return 0;

  const totalDuration = expiry.getTime() - start.getTime();
  if (totalDuration <= 0) return 0;

  const remaining = expiry.getTime() - now.getTime();
  if (remaining <= 0) return 0;

  return subscription.price * Math.min(1, remaining / totalDuration);
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────

export function toMonthly(price: number, cycle: BillingCycle): number {
  if (cycle === 'yearly') return price / 12;
  if (cycle === 'weekly') return (price * 52) / 12;
  return price;
}

export function toYearly(price: number, cycle: BillingCycle): number {
  if (cycle === 'yearly') return price;
  if (cycle === 'weekly') return price * 52;
  return price * 12;
}

export function getTrackedDate(subscription: Subscription): string | null {
  return subscription.trackingType === 'expiry'
    ? (subscription.expiryDate ?? null)
    : (subscription.nextBillingDate ?? null);
}

export function getDaysSinceLastUsed(subscription: Subscription, now = new Date()): number | null {
  if (!subscription.lastUsedAt) return null;
  const today = parseDateValue(formatDateInput(now)).getTime();
  const lastUsed = parseDateValue(subscription.lastUsedAt).getTime();
  return Math.floor((today - lastUsed) / DAY_MS);
}
