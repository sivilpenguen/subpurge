import { useMemo, type ReactNode } from 'react';
import {
  getDaysSinceLastUsed,
  getDueReviewSubscriptions,
  getInactiveSubscriptions,
  getPriceIncreaseSubscriptions,
  toYearly,
  type Subscription,
} from '../../core/store/logic';
import { useStore } from '../../core/store/useSubscriptionStore';
import { formatDisplayDate } from '../../core/utils/subscriptionDates';
import { haptic, openSubscriptionLink } from '../../platform/native';
import { ServiceLogo } from '../components/ServiceLogo';
import { currencyFor, money, toDisplay } from '../format';
import { IconExternal } from '../icons';
import { useUI } from '../shell';

export function PurgeScreen() {
  const { subscriptions, currency, locale, t, exchangeRates, markSubscriptionUsed, snoozeReviewReminder } = useStore();
  const { push, showDialog, showToast } = useUI();

  const dueReviews = useMemo(() => getDueReviewSubscriptions(subscriptions), [subscriptions]);
  const idle = useMemo(() => getInactiveSubscriptions(subscriptions), [subscriptions]);
  const raised = useMemo(() => getPriceIncreaseSubscriptions(subscriptions), [subscriptions]);

  // What cutting every flagged subscription would save per year, in the display currency.
  const { savings, candidateCount } = useMemo(() => {
    const unique = new Map<string, Subscription>();
    for (const s of [...dueReviews, ...idle, ...raised]) unique.set(s.id, s);
    const total = [...unique.values()].reduce(
      (sum, s) => sum + toDisplay(toYearly(s.price, s.billingCycle), s, currency, exchangeRates),
      0,
    );
    return { savings: total, candidateCount: unique.size };
  }, [dueReviews, idle, raised, currency, exchangeRates]);

  const openCancel = async (s: Subscription) => {
    haptic.tap();
    const opened = await openSubscriptionLink(s.manageDeepLink, s.quickCancelUrl);
    if (!opened) showDialog({ title: s.name, message: t.cancelGuideMissing, actions: [{ label: t.ok, variant: 'primary' }] });
  };

  const head = (s: Subscription, meta: ReactNode, price?: number) => {
    const symbol = currencyFor(s.currencyCode, currency).symbol;
    return (
      <div className="card-head">
        <ServiceLogo name={s.name} color={s.color} size={42} />
        <div className="card-head-body">
          <div className="card-title">{s.name}</div>
          <div className="card-meta">{meta}</div>
        </div>
        <div className="row-price">
          {money(price ?? s.price, symbol, locale)}
          <span className="row-cycle">{t.cycleShort[s.billingCycle]}</span>
        </div>
      </div>
    );
  };

  const section = (title: string, count: number, empty: { title: string; hint: string }, body: ReactNode) => (
    <>
      <div className="section-label">
        <span className="eyebrow">{title}</span>
        {count > 0 && <span className="count-badge">{count}</span>}
      </div>
      {count > 0 ? body : (
        <div className="muted-card">
          <b>{empty.title}</b>
          {empty.hint}
        </div>
      )}
    </>
  );

  return (
    <div className="screen">
      <header className="screen-header">
        <h1 className="screen-title">{t.purgeMode}</h1>
      </header>

      <div className="purge-hero">
        <span className="eyebrow">{t.attentionCount(candidateCount)}</span>
        <div className="amount">{money(savings, currency.symbol, locale, 0)}</div>
        <p>{candidateCount > 0 ? t.purgeSavings(money(savings, currency.symbol, locale, 0)) : t.purgeIntro}</p>
      </div>

      {section(t.reviewDue, dueReviews.length, { title: t.noPurgeCandidates, hint: t.noPurgeCandidatesHint }, dueReviews.map(s => (
        <div className="card" key={`review-${s.id}`}>
          {head(s, s.reviewReminderDate ? formatDisplayDate(s.reviewReminderDate, locale) : '—')}
          <div className="card-quote">
            <span className="eyebrow">{t.whyPaying}</span>
            {s.purpose?.trim() || s.notes?.trim() || t.noReasonSaved}
          </div>
          <div className="btn-row">
            <button className="btn sm ghost" onClick={() => { snoozeReviewReminder(s.id, 1); showToast(t.reviewSnooze); }}>{t.reviewSnooze}</button>
            <button className="btn sm ink" onClick={() => { snoozeReviewReminder(s.id, 3); haptic.success(); showToast(t.reviewDone); }}>{t.reviewDone}</button>
          </div>
          <div className="btn-row" style={{ marginTop: 8 }}>
            <button className="btn sm ghost" onClick={() => push({ name: 'edit', id: s.id })}>{t.updatePlan}</button>
            <button className="btn sm danger-ghost" onClick={() => { void openCancel(s); }}>{t.openCancelGuide} <IconExternal size={15} /></button>
          </div>
        </div>
      )))}

      {section(t.usageAlerts, idle.length, { title: t.noUsageAlerts, hint: t.noUsageAlertsHint }, idle.map(s => (
        <div className="card" key={`idle-${s.id}`}>
          {head(s, `${t.lastUsed}: ${s.lastUsedAt ? formatDisplayDate(s.lastUsedAt, locale) : '—'}`)}
          <p className="card-text">
            <span className="pill soon">{t.unusedFor(getDaysSinceLastUsed(s) ?? 0)}</span>
          </p>
          <div className="btn-row">
            <button className="btn sm ghost" onClick={() => { markSubscriptionUsed(s.id); haptic.success(); showToast(t.toastUsed(s.name)); }}>{t.usedToday}</button>
            <button className="btn sm danger" onClick={() => { void openCancel(s); }}>{t.openCancelGuide} <IconExternal size={15} /></button>
          </div>
        </div>
      )))}

      {section(t.priceChangeAlerts, raised.length, { title: t.noPriceChanges, hint: t.noPriceChangesHint }, raised.map(s => {
        const symbol = currencyFor(s.currencyCode, currency).symbol;
        return (
          <div className="card" key={`price-${s.id}`}>
            {head(s, <span className="pill late">+{money(s.priceChange.delta, symbol, locale)}</span>, s.priceChange.newPrice)}
            <p className="card-text">
              {t.priceRaised(symbol, s.priceChange.oldPrice.toFixed(2), s.priceChange.newPrice.toFixed(2))}
            </p>
            <div className="btn-row">
              <button className="btn sm ghost" onClick={() => push({ name: 'edit', id: s.id })}>{t.updatePlan}</button>
              <button className="btn sm ink" onClick={() => { void openCancel(s); }}>{t.manage}</button>
            </div>
          </div>
        );
      }))}
    </div>
  );
}
