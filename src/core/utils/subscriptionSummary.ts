import type { Subscription } from '../store/subscriptionTypes';
import { formatDateInput } from './subscriptionDates';
import { convertAmount } from './exchangeRates';

export function getMonthlyEquivalent(subscription: Pick<Subscription, 'billingCycle' | 'price'>): number {
  if (subscription.billingCycle === 'weekly') {
    return (subscription.price * 52) / 12;
  }

  if (subscription.billingCycle === 'yearly') {
    return subscription.price / 12;
  }

  return subscription.price;
}

function toTarget(
  amount: number,
  subscription: Pick<Subscription, 'currencyCode'>,
  targetCurrencyCode: string | undefined,
  exchangeRates: Record<string, number>,
): number {
  if (!targetCurrencyCode || !subscription.currencyCode || subscription.currencyCode === targetCurrencyCode) {
    return amount;
  }
  return convertAmount(amount, subscription.currencyCode, targetCurrencyCode, exchangeRates);
}

export interface MonthSpend {
  label: string;
  amount: number;
  isoMonth: string; // 'YYYY-MM' for keying
}

/**
 * Returns approximate monthly-equivalent spend for the last `months` calendar months.
 * For each month, sums getMonthlyEquivalent of subscriptions that were active during it.
 */
export function getMonthlySpendHistory(
  subscriptions: Subscription[],
  months = 6,
  targetCurrencyCode?: string,
  exchangeRates: Record<string, number> = {},
): MonthSpend[] {
  const now = new Date();
  const result: MonthSpend[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = formatDateInput(d);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthEnd = formatDateInput(lastDay);
    const isoMonth = monthStart.slice(0, 7); // 'YYYY-MM'

    const label = d.toLocaleString('default', { month: 'short' });

    const amount = subscriptions
      .filter(sub => {
        const started = sub.startDate <= monthEnd;
        const notEndedBefore = sub.endedAt == null || sub.endedAt >= monthStart;
        return started && notEndedBefore;
      })
      .reduce((sum, sub) => sum + toTarget(getMonthlyEquivalent(sub), sub, targetCurrencyCode, exchangeRates), 0);

    result.push({ label, amount, isoMonth });
  }

  return result;
}

export function getSummaryTotals(
  subscriptions: Subscription[],
  targetCurrencyCode?: string,
  exchangeRates: Record<string, number> = {},
) {
  const activeSubscriptions = subscriptions.filter(subscription => subscription.isActive);
  const monthlyTotal = activeSubscriptions.reduce(
    (sum, subscription) => sum + toTarget(getMonthlyEquivalent(subscription), subscription, targetCurrencyCode, exchangeRates),
    0,
  );

  return {
    monthlyTotal,
    dailyCost: monthlyTotal / 30,
    yearlyCost: monthlyTotal * 12,
    subscriptionCount: subscriptions.length,
  };
}
