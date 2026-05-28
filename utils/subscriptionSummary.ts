import type { Subscription } from '../store/useSubscriptionStore';
import { formatDateInput } from './subscriptionDates';

export function getMonthlyEquivalent(subscription: Pick<Subscription, 'billingCycle' | 'price'>): number {
  if (subscription.billingCycle === 'weekly') {
    return (subscription.price * 52) / 12;
  }

  if (subscription.billingCycle === 'yearly') {
    return subscription.price / 12;
  }

  return subscription.price;
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
export function getMonthlySpendHistory(subscriptions: Subscription[], months = 6): MonthSpend[] {
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
      .reduce((sum, sub) => sum + getMonthlyEquivalent(sub), 0);

    result.push({ label, amount, isoMonth });
  }

  return result;
}

export function getSummaryTotals(subscriptions: Subscription[]) {
  const activeSubscriptions = subscriptions.filter(subscription => subscription.isActive);
  const monthlyTotal = activeSubscriptions.reduce((sum, subscription) => sum + getMonthlyEquivalent(subscription), 0);

  return {
    monthlyTotal,
    dailyCost: monthlyTotal / 30,
    yearlyCost: monthlyTotal * 12,
    subscriptionCount: subscriptions.length,
  };
}
