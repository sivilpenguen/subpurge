import { useMemo, useState } from 'react';
import { getInactiveSubscriptions, getPriceIncreaseSubscriptions, getTrackedDate, type Subscription } from '../../core/store/logic';
import { useStore } from '../../core/store/useSubscriptionStore';
import { compareDateValues, differenceInCalendarDays, formatDisplayDate, formatRelativeDayLabel } from '../../core/utils/subscriptionDates';
import { getMonthlyEquivalent, getSummaryTotals } from '../../core/utils/subscriptionSummary';
import { haptic, openSubscriptionLink } from '../../platform/native';
import { ServiceLogo } from '../components/ServiceLogo';
import { SwipeRow } from '../components/SwipeRow';
import { currencyFor, money } from '../format';
import { IconMoon, IconMore, IconPlus, IconSearch, IconSun } from '../icons';
import { useUI } from '../shell';

type Filter = 'all' | 'upcoming' | 'idle' | 'price' | 'ended';

function sortSubscriptions(subscriptions: Subscription[], tab: 'active' | 'ended'): Subscription[] {
  return [...subscriptions].sort((left, right) => {
    if (tab === 'ended') return (right.endedAt ?? '').localeCompare(left.endedAt ?? '');
    const leftDate = getTrackedDate(left);
    const rightDate = getTrackedDate(right);
    if (leftDate && rightDate) return compareDateValues(leftDate, rightDate);
    if (leftDate) return -1;
    if (rightDate) return 1;
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
  const { subscriptions, currency, locale, t, themeMode, toggleThemeMode, exchangeRates } = store;
  const { push, showDialog, showToast } = useUI();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const active = useMemo(() => sortSubscriptions(subscriptions.filter(s => s.isActive), 'active'), [subscriptions]);
  const ended = useMemo(() => sortSubscriptions(subscriptions.filter(s => !s.isActive), 'ended'), [subscriptions]);
  const idle = useMemo(() => getInactiveSubscriptions(active), [active]);
  const raised = useMemo(() => getPriceIncreaseSubscriptions(active), [active]);
  const upcoming = useMemo(() => active.filter(s => {
    const d = getTrackedDate(s);
    return d ? differenceInCalendarDays(d) <= 7 : false;
  }), [active]);
  const { monthlyTotal, yearlyCost, dailyCost } = useMemo(
    () => getSummaryTotals(subscriptions, currency.code, exchangeRates),
    [subscriptions, currency.code, exchangeRates],
  );
  const attention = new Set([...idle, ...raised].map(s => s.id)).size;
  const nextUp = active.find(s => getTrackedDate(s));

  const lists: Record<Filter, Subscription[]> = { all: active, upcoming, idle, price: raised, ended };
  const displayed = useMemo(() => {
    const base = lists[filter];
    const q = query.trim().toLocaleLowerCase(locale);
    return q ? base.filter(s => s.name.toLocaleLowerCase(locale).includes(q)) : base;
  }, [filter, query, active, ended, upcoming, idle, raised, locale]);

  const chips: { id: Filter; label: string }[] = [
    { id: 'all', label: t.filterAll },
    { id: 'upcoming', label: t.filterUpcoming },
    { id: 'idle', label: t.filterIdle },
    { id: 'price', label: t.filterPrice },
    { id: 'ended', label: t.ended },
  ];

  const withUndo = (item: Subscription, message: string, action: () => void) => {
    const index = subscriptions.findIndex(s => s.id === item.id);
    action();
    haptic.success();
    showToast(message, { label: t.undo, onPress: () => store.restoreSubscription(item, index) });
  };

  const terminate = (item: Subscription) => withUndo(item, t.toastTerminated(item.name), () => store.toggleActive(item.id));
  const remove = (item: Subscription) => withUndo(item, t.toastDeleted(item.name), () => store.deleteSubscription(item.id));
  const markUsed = (item: Subscription) => withUndo(item, t.toastUsed(item.name), () => store.markSubscriptionUsed(item.id));
  const reactivate = (item: Subscription) => withUndo(item, t.toastReactivated(item.name), () => store.toggleActive(item.id));

  const openManage = async (item: Subscription) => {
    const opened = await openSubscriptionLink(item.manageDeepLink, item.quickCancelUrl);
    if (!opened) showDialog({ title: item.name, message: t.cancelGuideMissing, actions: [{ label: t.ok, variant: 'primary' }] });
  };

  const openMenu = (item: Subscription) => {
    haptic.tap();
    showDialog(item.isActive
      ? {
          title: item.name,
          actions: [
            { label: t.manage, variant: 'primary', onPress: () => { void openManage(item); } },
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

  const nextUpDate = nextUp ? getTrackedDate(nextUp) : null;
  const nextUpDays = nextUpDate ? differenceInCalendarDays(nextUpDate) : 0;

  return (
    <div className="screen">
      <header className="screen-header">
        <h1 className="screen-title">{t.subscriptions}</h1>
        <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
          <button className="icon-btn" onClick={() => { haptic.tap(); toggleThemeMode(); }} aria-label={themeMode === 'dark' ? t.themeLight : t.themeDark}>
            {themeMode === 'dark' ? <IconSun size={19} /> : <IconMoon size={19} />}
          </button>
          <button className="icon-btn primary" data-coach="add" onClick={() => push({ name: 'edit' })} aria-label={t.newSubscription}>
            <IconPlus size={21} />
          </button>
        </div>
      </header>

      <button className="receipt" onClick={() => push({ name: 'summary' })} aria-label={t.priceSummary}>
        <div className="receipt-top">
          <span className="eyebrow">{t.monthlyTotal}</span>
          <span className="eyebrow">{t.priceSummary} ›</span>
        </div>
        <div className="receipt-total">
          {money(monthlyTotal, currency.symbol, locale)}
          <span className="unit">{t.cycleShort.monthly}</span>
        </div>
        <div className="receipt-sub">
          {money(yearlyCost, currency.symbol, locale, 0)} {t.perYearLabel} · {money(dailyCost, currency.symbol, locale)} / {t.daily.toLocaleLowerCase(locale)}
        </div>
        <hr className="receipt-rule" />
        <div className="receipt-stats">
          <div className={`receipt-stat${upcoming.length ? ' warn' : ''}`}>
            <b>{upcoming.length}</b>
            <span>{t.focusUpcoming}</span>
          </div>
          <div className={`receipt-stat${attention ? ' alert' : ''}`}>
            <b>{attention}</b>
            <span>{t.focusAttention}</span>
          </div>
          <div className="receipt-stat">
            <b>{active.length}</b>
            <span>{t.active}</span>
          </div>
        </div>
      </button>

      {nextUp && nextUpDate && (
        <button className="next-up" onClick={() => push({ name: 'edit', id: nextUp.id })}>
          <ServiceLogo name={nextUp.name} color={nextUp.color} size={36} />
          <div className="next-up-body">
            <div className="eyebrow">{t.nextUp}</div>
            <div className="next-up-title">
              {nextUp.name} · <span className="num">{money(nextUp.price, currencyFor(nextUp.currencyCode, currency).symbol, locale)}</span>
            </div>
          </div>
          <span className={`next-up-when ${toneFor(nextUpDays)}`}>{formatRelativeDayLabel(nextUpDate, locale)}</span>
        </button>
      )}

      {subscriptions.length > 0 && (
        <>
          <label className="search">
            <IconSearch size={18} />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              enterKeyHint="search"
              autoCorrect="off"
            />
          </label>

          <div className="chips" role="toolbar">
            {chips.map(chip => (
              <button
                key={chip.id}
                className="chip"
                aria-pressed={filter === chip.id}
                onClick={() => { haptic.tap(); setFilter(chip.id); }}
              >
                {chip.label}
                <span className="count">{lists[chip.id].length}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {displayed.length > 0 ? (
        <div className="list">
          {displayed.map((item, index) => {
            const tracked = getTrackedDate(item);
            const days = tracked ? differenceInCalendarDays(tracked) : Number.NaN;
            const symbol = currencyFor(item.currencyCode, currency).symbol;
            const monthlyEquiv = item.billingCycle !== 'monthly' ? t.perMonthEquiv(money(getMonthlyEquivalent(item), symbol, locale)) : null;
            const meta = item.isActive
              ? `${item.trackingType === 'renewal' ? '↻' : '⇥'} ${tracked ? formatDisplayDate(tracked, locale) : '—'}`
              : `${t.terminated} · ${item.endedAt ? formatDisplayDate(item.endedAt.slice(0, 10), locale) : '—'}`;

            return (
              <SwipeRow
                key={item.id}
                leftLabel={item.isActive ? t.terminate : t.delete}
                rightLabel={item.isActive ? t.usedToday : t.reactivate}
                onSwipeLeft={() => (item.isActive ? terminate(item) : remove(item))}
                onSwipeRight={() => (item.isActive ? markUsed(item) : reactivate(item))}
              >
                <div className="row" data-coach={index === 0 ? 'row' : undefined}>
                  <button
                    style={{ display: 'contents' }}
                    onClick={() => push({ name: 'edit', id: item.id })}
                    aria-label={`${item.name}, ${t.editSubscriptionHint}`}
                  >
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
                        <span className="row-meta">{monthlyEquiv ?? meta}</span>
                        {item.isActive && tracked
                          ? <span className={`pill ${toneFor(days)}`}>{formatRelativeDayLabel(tracked, locale)}</span>
                          : !item.isActive && <span className="pill muted">{t.ended}</span>}
                      </div>
                    </div>
                  </button>
                  <button className="row-menu" onClick={() => openMenu(item)} aria-label="More options">
                    <IconMore size={20} />
                  </button>
                </div>
              </SwipeRow>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <img className="empty-badger" src="badger.png" alt="" />
          <h3>{filter === 'ended' ? t.noEndedSubscriptions : t.noSubscriptions}</h3>
          <p>{filter === 'ended' ? t.noEndedSubscriptionsHint : t.noSubscriptionsHint}</p>
          {filter !== 'ended' && (
            <button className="btn primary" onClick={() => push({ name: 'edit' })}>
              <IconPlus size={18} /> {t.newSubscription}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
