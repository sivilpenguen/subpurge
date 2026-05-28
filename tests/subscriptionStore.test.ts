import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCompletedCycleCount,
  getCompletedCycleCountBetween,
  getCurrentCycleProratedSpent,
  getDaysSinceLastUsed,
  getDueReviewSubscriptions,
  getInactiveSubscriptions,
  getPriceChangeInfo,
  getPriceIncreaseSubscriptions,
  getSubscriptionAccruedSpent,
  getSubscriptionTotalSpent,
  getTrackedDate,
  toMonthly,
  toYearly,
  type Subscription,
} from '../store/useSubscriptionStore';

function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'test',
    name: 'Test',
    color: '#000',
    icon: '📌',
    price: 100,
    billingCycle: 'monthly',
    startDate: '2026-01-01',
    trackingType: 'renewal',
    nextBillingDate: '2026-06-01',
    expiryDate: null,
    currentPeriodStart: '2026-01-01',
    completedCyclesCarry: 0,
    accruedSpentCarry: 0,
    isActive: true,
    endedAt: null,
    reviewReminderDate: null,
    lastUsedAt: null,
    ...overrides,
  };
}

// ─── getCompletedCycleCountBetween ───────────────────────────────────────────

test('getCompletedCycleCountBetween: monthly — exact months', () => {
  assert.equal(getCompletedCycleCountBetween('2026-01-01', '2026-04-01', 'monthly'), 3);
});

test('getCompletedCycleCountBetween: monthly — partial month does not count', () => {
  assert.equal(getCompletedCycleCountBetween('2026-01-01', '2026-01-31', 'monthly'), 0);
});

test('getCompletedCycleCountBetween: monthly — end-of-month boundary (Jan→Feb)', () => {
  // 1 full month: Jan 31 to Feb 28
  assert.equal(getCompletedCycleCountBetween('2026-01-31', '2026-02-28', 'monthly'), 1);
});

test('getCompletedCycleCountBetween: yearly — exact year', () => {
  assert.equal(getCompletedCycleCountBetween('2025-01-01', '2026-01-01', 'yearly'), 1);
});

test('getCompletedCycleCountBetween: yearly — partial year does not count', () => {
  assert.equal(getCompletedCycleCountBetween('2025-01-01', '2025-06-01', 'yearly'), 0);
});

test('getCompletedCycleCountBetween: weekly — 3 weeks', () => {
  assert.equal(getCompletedCycleCountBetween('2026-01-01', '2026-01-22', 'weekly'), 3);
});

test('getCompletedCycleCountBetween: returns 0 when end <= start', () => {
  assert.equal(getCompletedCycleCountBetween('2026-05-01', '2026-01-01', 'monthly'), 0);
  assert.equal(getCompletedCycleCountBetween('2026-01-01', '2026-01-01', 'monthly'), 0);
});

// ─── getCompletedCycleCount ──────────────────────────────────────────────────

test('getCompletedCycleCount: active sub counts cycles up to now', () => {
  const sub = makeSub({ currentPeriodStart: '2026-01-01', completedCyclesCarry: 0 });
  const now = new Date('2026-04-01T12:00:00Z');
  assert.equal(getCompletedCycleCount(sub, now), 3);
});

test('getCompletedCycleCount: carry is added on top of live cycles', () => {
  const sub = makeSub({ currentPeriodStart: '2026-03-01', completedCyclesCarry: 5 });
  const now = new Date('2026-05-01T12:00:00Z');
  assert.equal(getCompletedCycleCount(sub, now), 7); // 5 carry + 2 live
});

test('getCompletedCycleCount: inactive sub uses endedAt, not now', () => {
  const sub = makeSub({
    isActive: false,
    currentPeriodStart: '2026-01-01',
    endedAt: '2026-03-01',
    completedCyclesCarry: 0,
  });
  const now = new Date('2026-06-01T12:00:00Z');
  assert.equal(getCompletedCycleCount(sub, now), 2);
});

// ─── getSubscriptionTotalSpent ───────────────────────────────────────────────

test('getSubscriptionTotalSpent: price × completed cycles + carry', () => {
  const sub = makeSub({
    price: 100,
    billingCycle: 'monthly',
    currentPeriodStart: '2026-01-01',
    completedCyclesCarry: 1,
    accruedSpentCarry: 50,
  });
  const now = new Date('2026-04-01T12:00:00Z');
  // 3 live cycles × 100 + 50 carry = 350
  assert.equal(getSubscriptionTotalSpent(sub, now), 350);
});

// ─── getCurrentCycleProratedSpent ────────────────────────────────────────────

test('getCurrentCycleProratedSpent: halfway through renewal cycle = half price', () => {
  // Cycle: 2026-05-01 → 2026-06-01 (31 days). Now = halfway ≈ 2026-05-16
  const sub = makeSub({
    price: 100,
    billingCycle: 'monthly',
    trackingType: 'renewal',
    nextBillingDate: '2026-06-01',
    isActive: true,
  });
  const cycleStart = new Date('2026-05-01T12:00:00');
  const cycleEnd = new Date('2026-06-01T12:00:00');
  const totalMs = cycleEnd.getTime() - cycleStart.getTime();
  const halfMs = totalMs / 2;
  const now = new Date(cycleStart.getTime() + halfMs);

  const result = getCurrentCycleProratedSpent(sub, now);
  assert.ok(result > 49 && result < 51, `expected ~50, got ${result}`);
});

test('getCurrentCycleProratedSpent: at cycle end = full price', () => {
  const sub = makeSub({
    price: 100,
    billingCycle: 'monthly',
    trackingType: 'renewal',
    nextBillingDate: '2026-06-01',
    isActive: true,
  });
  const now = new Date('2026-06-01T12:00:00');
  assert.equal(getCurrentCycleProratedSpent(sub, now), 100);
});

test('getCurrentCycleProratedSpent: inactive sub stopped mid-cycle', () => {
  const sub = makeSub({
    price: 100,
    billingCycle: 'monthly',
    trackingType: 'renewal',
    nextBillingDate: '2026-06-01',
    isActive: false,
    endedAt: '2026-05-16', // stopped halfway
  });
  const now = new Date('2026-06-01T12:00:00');
  const result = getCurrentCycleProratedSpent(sub, now);
  assert.ok(result > 0 && result < 100, `expected partial spend, got ${result}`);
});

test('getCurrentCycleProratedSpent: expiry tracking uses currentPeriodStart→expiryDate window', () => {
  const sub = makeSub({
    price: 120,
    trackingType: 'expiry',
    currentPeriodStart: '2026-01-01',
    expiryDate: '2026-07-01', // 6-month window
    nextBillingDate: null,
    isActive: true,
  });
  const now = new Date('2026-04-01T12:00:00'); // 3 months in = halfway
  const result = getCurrentCycleProratedSpent(sub, now);
  assert.ok(result > 59 && result < 61, `expected ~60, got ${result}`);
});

// ─── getSubscriptionAccruedSpent ─────────────────────────────────────────────

test('getSubscriptionAccruedSpent: total = completed spend + prorated current cycle', () => {
  const sub = makeSub({
    price: 100,
    billingCycle: 'monthly',
    currentPeriodStart: '2026-01-01',
    completedCyclesCarry: 0,
    accruedSpentCarry: 0,
    trackingType: 'renewal',
    nextBillingDate: '2026-06-01',
    isActive: true,
  });
  const now = new Date('2026-06-01T12:00:00');
  // 5 completed cycles × 100 = 500, + full current cycle = 100 → 600
  assert.equal(getSubscriptionAccruedSpent(sub, now), 600);
});

// ─── toMonthly / toYearly ────────────────────────────────────────────────────

test('toMonthly converts all cycles correctly', () => {
  assert.equal(toMonthly(120, 'monthly'), 120);
  assert.equal(toMonthly(1200, 'yearly'), 100);
  assert.equal(toMonthly(75, 'weekly'), (75 * 52) / 12);
});

test('toYearly converts all cycles correctly', () => {
  assert.equal(toYearly(100, 'monthly'), 1200);
  assert.equal(toYearly(1200, 'yearly'), 1200);
  assert.equal(toYearly(75, 'weekly'), 75 * 52);
});

// ─── getTrackedDate ──────────────────────────────────────────────────────────

test('getTrackedDate: renewal returns nextBillingDate', () => {
  const sub = makeSub({ trackingType: 'renewal', nextBillingDate: '2026-06-01' });
  assert.equal(getTrackedDate(sub), '2026-06-01');
});

test('getTrackedDate: expiry returns expiryDate', () => {
  const sub = makeSub({ trackingType: 'expiry', expiryDate: '2026-12-31', nextBillingDate: null });
  assert.equal(getTrackedDate(sub), '2026-12-31');
});

test('getTrackedDate: returns null when date missing', () => {
  const sub = makeSub({ trackingType: 'renewal', nextBillingDate: null });
  assert.equal(getTrackedDate(sub), null);
});

// ─── getDueReviewSubscriptions ───────────────────────────────────────────────

test('getDueReviewSubscriptions: returns overdue and today reviews, excludes future and inactive', () => {
  const now = new Date('2026-05-23');
  const subs: Subscription[] = [
    makeSub({ id: 'overdue', reviewReminderDate: '2026-05-01', isActive: true }),
    makeSub({ id: 'today', reviewReminderDate: '2026-05-23', isActive: true }),
    makeSub({ id: 'future', reviewReminderDate: '2026-06-01', isActive: true }),
    makeSub({ id: 'inactive', reviewReminderDate: '2026-05-01', isActive: false }),
    makeSub({ id: 'no-reminder', reviewReminderDate: null, isActive: true }),
  ];
  const result = getDueReviewSubscriptions(subs, now);
  assert.deepEqual(result.map(s => s.id), ['overdue', 'today']);
});

// ─── getInactiveSubscriptions ────────────────────────────────────────────────

test('getInactiveSubscriptions: returns active subs unused for 15+ days', () => {
  const now = new Date('2026-05-23');
  const subs: Subscription[] = [
    makeSub({ id: 'stale', lastUsedAt: '2026-05-01', isActive: true }),   // 22 days ago
    makeSub({ id: 'recent', lastUsedAt: '2026-05-20', isActive: true }),  // 3 days ago
    makeSub({ id: 'inactive', lastUsedAt: '2026-01-01', isActive: false }),
    makeSub({ id: 'no-lastused', lastUsedAt: null, isActive: true }),
  ];
  const result = getInactiveSubscriptions(subs, now);
  assert.deepEqual(result.map(s => s.id), ['stale']);
});

// ─── getDaysSinceLastUsed ────────────────────────────────────────────────────

test('getDaysSinceLastUsed: returns correct day count', () => {
  const sub = makeSub({ lastUsedAt: '2026-05-13' });
  const now = new Date('2026-05-23');
  assert.equal(getDaysSinceLastUsed(sub, now), 10);
});

test('getDaysSinceLastUsed: returns null when lastUsedAt is missing', () => {
  const sub = makeSub({ lastUsedAt: null });
  assert.equal(getDaysSinceLastUsed(sub), null);
});

// ─── getPriceChangeInfo ──────────────────────────────────────────────────────

test('getPriceChangeInfo: returns null when price matches preset', () => {
  const sub = makeSub({ name: 'Spotify', price: 99, billingCycle: 'monthly', planTemplateId: 'individual' });
  assert.equal(getPriceChangeInfo(sub), null);
});

test('getPriceChangeInfo: returns delta when sub price is below current preset price', () => {
  // Netflix Standard preset = 229.99, sub was added at 199.99
  const sub = makeSub({ name: 'Netflix', price: 199.99, billingCycle: 'monthly', planTemplateId: 'standard' });
  const info = getPriceChangeInfo(sub);
  assert.ok(info !== null);
  assert.equal(info.newPrice, 229.99);
  assert.ok(info.delta > 0);
});

test('getPriceChangeInfo: returns null when sub price is already at or above preset', () => {
  const sub = makeSub({ name: 'Netflix', price: 299.99, billingCycle: 'monthly', planTemplateId: 'premium' });
  assert.equal(getPriceChangeInfo(sub), null);
});

// ─── getPriceIncreaseSubscriptions ──────────────────────────────────────────

test('getPriceIncreaseSubscriptions: excludes inactive, sorts by delta descending', () => {
  const subs: Subscription[] = [
    makeSub({ id: 'netflix-cheap', name: 'Netflix', price: 199.99, billingCycle: 'monthly', planTemplateId: 'standard', isActive: true }),
    makeSub({ id: 'netflix-inactive', name: 'Netflix', price: 199.99, billingCycle: 'monthly', planTemplateId: 'standard', isActive: false }),
    makeSub({ id: 'no-preset', name: 'Diğer', price: 50, billingCycle: 'monthly', isActive: true }),
  ];
  const result = getPriceIncreaseSubscriptions(subs);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'netflix-cheap');
});
