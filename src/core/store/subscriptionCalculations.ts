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


// ─── Spend calculations ───────────────────────────────────────────────────────

function paymentDate(anchor: Date, cycle: BillingCycle, k: number): Date {
  if (cycle === 'weekly') return new Date(anchor.getTime() + k * 7 * DAY_MS);
  // Always offset from the anchor (not the previous date) so the 31st doesn't drift to the 28th.
  return cycle === 'monthly' ? addMonths(anchor, k) : addYears(anchor, k);
}

/**
 * Payments are charged at the start of every period: startDate, +1 cycle, …
 * Counts those charge dates inside [from, to) — or [from, to] with
 * `inclusiveEnd` — and before `stopBefore` (a fixed term's end date).
 */
export function countPaymentsBetween(
  startDate: string,
  cycle: BillingCycle,
  from: string,
  to: string,
  inclusiveEnd: boolean,
  stopBefore?: string | null,
): number {
  const anchor = parseDateValue(formatDateInput(startDate));
  const fromDay = formatDateInput(from);
  const toDay = formatDateInput(to);
  const stopDay = stopBefore ? formatDateInput(stopBefore) : null;
  if (Number.isNaN(anchor.getTime()) || !fromDay || !toDay) return 0;

  let count = 0;
  for (let k = 0; k < 10_000; k++) {
    const day = formatDateInput(paymentDate(anchor, cycle, k));
    if (inclusiveEnd ? day > toDay : day >= toDay) break;
    if (stopDay && day >= stopDay) break;
    if (day >= fromDay) count++;
  }
  return count;
}

/** Payments made in the current (unsettled) stretch: currentPeriodStart → today or the end date. */
export function getUnsettledPaymentCount(subscription: Subscription, now = new Date()): number {
  const end = subscription.isActive ? now.toISOString() : (subscription.endedAt ?? now.toISOString());
  return countPaymentsBetween(
    subscription.startDate,
    subscription.billingCycle,
    subscription.currentPeriodStart,
    end,
    true,
    subscription.trackingType === 'expiry' ? subscription.expiryDate : null,
  );
}

export function getCompletedCycleCount(subscription: Subscription, now = new Date()): number {
  return subscription.completedCyclesCarry + getUnsettledPaymentCount(subscription, now);
}

/** What has actually been paid so far: every charge up to today (or the end date), at its price. */
export function getSubscriptionTotalSpent(subscription: Subscription, now = new Date()): number {
  return subscription.accruedSpentCarry + getUnsettledPaymentCount(subscription, now) * subscription.price;
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
