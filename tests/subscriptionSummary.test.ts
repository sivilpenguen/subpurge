import assert from 'node:assert/strict';
import test from 'node:test';
import { isLocale } from '../constants/i18n';
import type { Subscription } from '../store/useSubscriptionStore';
import { getMonthlyEquivalent, getMonthlySpendHistory, getSummaryTotals } from '../utils/subscriptionSummary';

function makeSub(overrides: Partial<Subscription> & { price: number; billingCycle: Subscription['billingCycle'] }): Subscription {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: Math.random().toString(36).slice(2),
    name: 'Test',
    color: '#000',
    icon: '🔧',
    startDate: today,
    trackingType: 'renewal',
    nextBillingDate: null,
    expiryDate: null,
    currentPeriodStart: today,
    completedCyclesCarry: 0,
    accruedSpentCarry: 0,
    isActive: true,
    endedAt: null,
    ...overrides,
  };
}

test('getMonthlyEquivalent normalizes weekly, monthly, and yearly prices', () => {
  assert.equal(getMonthlyEquivalent({ billingCycle: 'monthly', price: 100 }), 100);
  assert.equal(getMonthlyEquivalent({ billingCycle: 'yearly', price: 1200 }), 100);
  assert.equal(getMonthlyEquivalent({ billingCycle: 'weekly', price: 75 }), 325);
});

test('getSummaryTotals only counts active subscriptions in recurring totals', () => {
  const totals = getSummaryTotals([
    {
      id: 'active-monthly',
      name: 'Monthly',
      color: '#000',
      icon: 'A',
      price: 100,
      billingCycle: 'monthly',
      startDate: '2026-01-01',
      trackingType: 'renewal',
      nextBillingDate: '2026-05-01',
      currentPeriodStart: '2026-04-01',
      completedCyclesCarry: 0,
      accruedSpentCarry: 0,
      isActive: true,
    },
    {
      id: 'ended-yearly',
      name: 'Yearly',
      color: '#111',
      icon: 'B',
      price: 1200,
      billingCycle: 'yearly',
      startDate: '2025-01-01',
      trackingType: 'renewal',
      nextBillingDate: '2026-01-01',
      currentPeriodStart: '2025-01-01',
      completedCyclesCarry: 0,
      accruedSpentCarry: 0,
      isActive: false,
      endedAt: '2025-12-31',
    },
  ]);

  assert.equal(totals.subscriptionCount, 2);
  assert.equal(totals.monthlyTotal, 100);
  assert.equal(totals.dailyCost, 100 / 30);
  assert.equal(totals.yearlyCost, 1200);
});

test('isLocale only accepts supported locale codes', () => {
  assert.equal(isLocale('tr'), true);
  assert.equal(isLocale('fr'), true);
  assert.equal(isLocale('pt'), false);
  assert.equal(isLocale('english'), false);
});

// ─── getMonthlySpendHistory ───────────────────────────────────────────────────

test('getMonthlySpendHistory: returns exactly N months', () => {
  assert.equal(getMonthlySpendHistory([], 6).length, 6);
  assert.equal(getMonthlySpendHistory([], 3).length, 3);
});

test('getMonthlySpendHistory: last entry is current month', () => {
  const history = getMonthlySpendHistory([], 6);
  const currentIso = new Date().toISOString().slice(0, 7);
  assert.equal(history[history.length - 1].isoMonth, currentIso);
});

test('getMonthlySpendHistory: active subscription appears in current month', () => {
  const sub = makeSub({ price: 100, billingCycle: 'monthly' });
  const history = getMonthlySpendHistory([sub], 1);
  assert.equal(history[0].amount, 100);
});

test('getMonthlySpendHistory: subscription started in future gives zero', () => {
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  const sub = makeSub({ price: 100, billingCycle: 'monthly', startDate: next.toISOString().slice(0, 10) });
  const history = getMonthlySpendHistory([sub], 1);
  assert.equal(history[0].amount, 0);
});

test('getMonthlySpendHistory: excludes subscription that ended before the month', () => {
  const threeBack = new Date();
  threeBack.setMonth(threeBack.getMonth() - 3);
  const fourBack = new Date();
  fourBack.setMonth(fourBack.getMonth() - 4);
  const sub = makeSub({
    price: 100,
    billingCycle: 'monthly',
    startDate: fourBack.toISOString().slice(0, 10),
    isActive: false,
    endedAt: threeBack.toISOString().slice(0, 10),
  });
  // only current month — sub ended 3 months ago
  const history = getMonthlySpendHistory([sub], 1);
  assert.equal(history[0].amount, 0);
});

test('getMonthlySpendHistory: sums multiple subscriptions', () => {
  const s1 = makeSub({ price: 100, billingCycle: 'monthly' });
  const s2 = makeSub({ price: 200, billingCycle: 'monthly' });
  const history = getMonthlySpendHistory([s1, s2], 1);
  assert.equal(history[0].amount, 300);
});

test('getMonthlySpendHistory: uses monthly equivalent for yearly billing', () => {
  const sub = makeSub({ price: 1200, billingCycle: 'yearly' });
  const history = getMonthlySpendHistory([sub], 1);
  assert.equal(history[0].amount, 100);
});

test('getSummaryTotals handles mixed active recurring plans', () => {
  const totals = getSummaryTotals([
    {
      id: 'active-weekly',
      name: 'Weekly',
      color: '#222',
      icon: 'W',
      price: 75,
      billingCycle: 'weekly',
      startDate: '2026-01-01',
      trackingType: 'renewal',
      nextBillingDate: '2026-05-01',
      currentPeriodStart: '2026-04-24',
      completedCyclesCarry: 0,
      accruedSpentCarry: 0,
      isActive: true,
    },
    {
      id: 'active-yearly',
      name: 'Yearly',
      color: '#333',
      icon: 'Y',
      price: 1200,
      billingCycle: 'yearly',
      startDate: '2026-01-01',
      trackingType: 'renewal',
      nextBillingDate: '2027-01-01',
      currentPeriodStart: '2026-01-01',
      completedCyclesCarry: 0,
      accruedSpentCarry: 0,
      isActive: true,
    },
  ]);

  assert.equal(totals.monthlyTotal, 425);
  assert.equal(totals.yearlyCost, 5100);
});
