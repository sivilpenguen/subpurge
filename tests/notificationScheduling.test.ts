import assert from 'node:assert/strict';
import test from 'node:test';
import type { Subscription } from '../src/core/store/logic';
import { formatDateInput } from '../src/core/utils/subscriptionDates';
import { planReminders, reminderIdFor } from '../src/platform/notifications';

const DAY_MS = 24 * 60 * 60 * 1000;

function makeSub(overrides: Partial<Subscription>): Subscription {
  const today = formatDateInput(new Date());
  return {
    id: 'sub', name: 'Netflix', color: '#000', icon: '🎬', price: 100, billingCycle: 'monthly',
    startDate: today, trackingType: 'renewal', nextBillingDate: null, expiryDate: null,
    currentPeriodStart: today, completedCyclesCarry: 0, accruedSpentCarry: 0, isActive: true, endedAt: null,
    ...overrides,
  };
}

test('reminderIdFor is stable, positive and below the test id range', () => {
  const id = reminderIdFor('sub:inactivity:2026-10-01');
  assert.equal(id, reminderIdFor('sub:inactivity:2026-10-01'));
  assert.notEqual(id, reminderIdFor('sub:inactivity:2026-10-02'));
  assert.ok(id > 0 && id < 2_000_000_000);
});

test('planReminders produces inactivity and renewal reminders in the future only', () => {
  const now = new Date();
  const inTenDays = formatDateInput(new Date(now.getTime() + 10 * DAY_MS));
  const plans = planReminders([makeSub({ lastUsedAt: formatDateInput(now), nextBillingDate: inTenDays })], 'en', now);
  assert.deepEqual(plans.map(plan => plan.kind).sort(), ['inactivity', 'tracked-date']);
  assert.ok(plans.every(plan => plan.triggerDate > now));
  assert.equal(plans.find(plan => plan.kind === 'tracked-date')?.title, 'Netflix renews in 4 days');
});

test('planReminders skips inactive subscriptions and past trigger dates', () => {
  const now = new Date();
  const longAgo = formatDateInput(new Date(now.getTime() - 30 * DAY_MS));
  assert.equal(planReminders([makeSub({ isActive: false, lastUsedAt: formatDateInput(now) })], 'tr', now).length, 0);
  assert.equal(planReminders([makeSub({ lastUsedAt: longAgo, nextBillingDate: longAgo })], 'tr', now).length, 0);
});
