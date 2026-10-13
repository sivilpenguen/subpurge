import { useMemo, useState } from 'react';
import { getTrackedDate, type Subscription } from '../../core/store/logic';
import { useStore } from '../../core/store/useSubscriptionStore';
import { compareDateValues, differenceInCalendarDays, formatDisplayDate, formatRelativeDayLabel } from '../../core/utils/subscriptionDates';
import { getSummaryTotals } from '../../core/utils/subscriptionSummary';
import { haptic } from '../../platform/native';
import { ServiceLogo } from '../components/ServiceLogo';
import { SwipeRow } from '../components/SwipeRow';
import { useFlows } from '../flows';
import { currencyFor, money } from '../format';
import { IconChevron, IconMore, IconPlus } from '../icons';
import { useUI } from '../shell';

function byDate(subscriptions: Subscription[]): Subscription[] {
  return [...subscriptions].sort((left, right) => {
    const l = getTrackedDate(left);
    const r = getTrackedDate(right);
    if (l && r) return compareDateValues(l, r);
    if (l) return -1;
    if (r) return 1;
    return left.name.localeCompare(right.name);
  });
}

export function toneFor(daysUntil: number): 'late' | 'soon' | 'ok' {
  if (daysUntil < 0) return 'late';
  if (daysUntil <= 3) return 'soon';
  return 'ok';
}

export function HomeScreen() {
  const store = useStore();
  const { subscriptions, currency, locale, t, exchangeRates } = store;
  const { push, showDialog, showToast } = useUI();
  const { startCancel, ensureCapacity } = useFlows();
  const [showEnded, setShowEnded] = useState(false);

  const active = useMemo(() => byDate(subscriptions.filter(s => s.isActive)), [subscriptions]);
  const ended = useMemo(
    () => subscriptions.filter(s => !s.isActive).sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? '')),
    [subscriptions],
  );
  const { monthlyTotal, yearlyCost } = useMemo(
    () => getSummaryTotals(subscriptions, currency.code, exchangeRates),
    [subscriptions, currency.code, exchangeRates],
  );

  const withUndo = (item: Subscription, message: string, action: () => void) => {
    const index = subscriptions.findIndex(s => s.id === item.id);
    action();
    haptic.success();
    showToast(message, { label: t.undo, onPress: () => store.restoreSubscription(item, index) });
  };
  const terminate = (item: Subscription) => withUndo(item, t.toastTerminated(item.name), () => store.toggleActive(item.id));
  const remove = (item: Subscription) => withUndo(item, t.toastDeleted(item.name), () => store.deleteSubscription(item.id));
  const markUsed = (item: Subscription) => withUndo(item, t.toastUsed(item.name), () => store.markSubscriptionUsed(item.id));
  const reactivate = (item: Subscription) => {
    if (!ensureCapacity()) return;
    withUndo(item, t.toastReactivated(item.name), () => store.toggleActive(item.id));
  };

  const openMenu = (item: Subscription) => {
    haptic.tap();
    showDialog(item.isActive
      ? {
          title: item.name,
          actions: [
            { label: t.cancelAction, variant: 'primary', onPress: () => startCancel(item) },
            { label: t.usedToday, onPress: () => markUsed(item) },
            { label: t.terminate, variant: 'destructive', onPress: () => terminate(item) },
            { label: t.cancel },
          ],
        }
      : {
          title: item.name,
          accent: 'destructive',
          actions: [
            { label: t.reactivate, variant: 'primary', onPress: () => reactivate(item) },
            { label: t.delete, variant: 'destructive', onPress: () => remove(item) },
            { label: t.cancel },
          ],
        });
  };

  const addNew = () => { if (ensureCapacity()) push({ name: 'edit' }); };

  const row = (item: Subscription, coach: boolean) => {
    const tracked = getTrackedDate(item);
    const symbol = currencyFor(item.currencyCode, currency).symbol;
    const meta = item.isActive
      ? (tracked ? formatDisplayDate(tracked, locale) : '—')
      : `${t.terminated} · ${item.endedAt ? formatDisplayDate(item.endedAt.slice(0, 10), locale) : '—'}`;
    return (
      <SwipeRow
        key={item.id}
        leftLabel={item.isActive ? t.terminate : t.delete}
        rightLabel={item.isActive ? t.usedToday : t.reactivate}
        onSwipeLeft={() => (item.isActive ? terminate(item) : remove(item))}
        onSwipeRight={() => (item.isActive ? markUsed(item) : reactivate(item))}
      >
        <div className="row" data-coach={coach ? 'row' : undefined}>
          <button style={{ display: 'contents' }} onClick={() => push({ name: 'edit', id: item.id })} aria-label={`${item.name}, ${t.editSubscriptionHint}`}>
            <ServiceLogo name={item.name} color={item.color} size={42} />
            <div className="row-body">
              <div className="row-top">
                <span className="row-name">{item.name}</span>
                <span className="row-price">
                  {money(item.price, symbol, locale)}
                  <span className="row-cycle">{t.cycleShort[item.billingCycle]}</span>
                </span>
              </div>
              <div className="row-bottom">
                <span className="row-meta">{meta}</span>
                {item.isActive && tracked && (
                  <span className={`pill ${toneFor(differenceInCalendarDays(tracked))}`}>{formatRelativeDayLabel(tracked, locale)}</span>
                )}
              </div>
            </div>
          </button>
          <button className="row-menu" onClick={() => openMenu(item)} aria-label="More options">
            <IconMore size={20} />
          </button>
        </div>
      </SwipeRow>
    );
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <h1 className="screen-title">{t.tabList}</h1>
        <button className="icon-btn primary" data-coach="add" onClick={addNew} aria-label={t.newSubscription}>
          <IconPlus size={21} />
        </button>
      </header>

      <button className="receipt" onClick={() => push({ name: 'summary' })} aria-label={t.priceSummary}>
        <div className="receipt-top">
          <span className="eyebrow">{t.monthlyTotal}</span>
          <IconChevron size={18} style={{ opacity: 0.5 }} />
        </div>
        <div className="receipt-total">
          {money(monthlyTotal, currency.symbol, locale)}
          <span className="unit">{t.cycleShort.monthly}</span>
        </div>
        <div className="receipt-sub">{money(yearlyCost, currency.symbol, locale, 0)} {t.perYearLabel} · {active.length} {t.active.toLocaleLowerCase(locale)}</div>
      </button>

      {active.length > 0 ? (
        <div className="list">{active.map((item, i) => row(item, i === 0))}</div>
      ) : (
        <div className="empty">
          <img className="empty-badger" src="badger.png" alt="" />
          <h3>{t.noSubscriptions}</h3>
          <p>{t.noSubscriptionsHint}</p>
          <button className="btn primary" onClick={addNew}><IconPlus size={18} /> {t.newSubscription}</button>
        </div>
      )}

      {ended.length > 0 && (
        <>
          <button className="ended-toggle" onClick={() => { haptic.tap(); setShowEnded(v => !v); }} aria-expanded={showEnded}>
            <span>{t.endedSection(ended.length)}</span>
            <IconChevron size={16} style={{ transform: showEnded ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
          </button>
          {showEnded && <div className="list ended-list">{ended.map(item => row(item, false))}</div>}
        </>
      )}
    </div>
  );
}
