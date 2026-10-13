import { useMemo, useRef, useState } from 'react';
import {
  getDaysSinceLastUsed,
  getDueReviewSubscriptions,
  getInactiveSubscriptions,
  getPriceChangeInfo,
  type Subscription,
} from '../../core/store/logic';
import { useStore } from '../../core/store/useSubscriptionStore';
import { formatDateInput, addMonthsToDateValue } from '../../core/utils/subscriptionDates';
import { haptic } from '../../platform/native';
import { ServiceLogo } from '../components/ServiceLogo';
import { useFlows } from '../flows';
import { currencyFor, money, toDisplay } from '../format';
import { useUI } from '../shell';

const FLING = 110;

/** Everything that deserves a keep-or-cut decision, idle first. */
function useCandidates(subscriptions: Subscription[]) {
  return useMemo(() => {
    const seen = new Map<string, Subscription>();
    const idle = getInactiveSubscriptions(subscriptions);
    const review = getDueReviewSubscriptions(subscriptions);
    const raised = subscriptions.filter(s => s.isActive && getPriceChangeInfo(s));
    for (const s of [...idle, ...raised, ...review]) seen.set(s.id, s);
    return [...seen.values()];
  }, [subscriptions]);
}

export function DeckScreen() {
  const store = useStore();
  const { subscriptions, t, locale, currency, exchangeRates, purgeLog } = store;
  const { showToast } = useUI();
  const { startCancel } = useFlows();
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [dx, setDx] = useState(0);
  const [flying, setFlying] = useState<0 | 1 | -1>(0);
  const start = useRef<{ x: number; id: number } | null>(null);

  const all = useCandidates(subscriptions);
  const deck = all.filter(s => !skipped.has(s.id));
  const card = deck[0];
  const next = deck[1];
  const saved = purgeLog.reduce((sum, e) => sum + toDisplay(e.yearly, e, currency, exchangeRates), 0);

  const keep = (s: Subscription) => {
    const today = formatDateInput(new Date());
    const raise = getPriceChangeInfo(s);
    // Keeping means: I use it, I accept the new price, ask me again in 3 months.
    store.updateSubscription(s.id, {
      lastUsedAt: today,
      ...(raise ? { price: raise.newPrice } : {}),
      ...(s.reviewReminderDate && s.reviewReminderDate <= today ? { reviewReminderDate: addMonthsToDateValue(today, 3) } : {}),
    });
    haptic.success();
    showToast(t.toastUsed(s.name));
  };

  const decide = (direction: 1 | -1) => {
    if (!card) return;
    const current = card;
    setFlying(direction);
    setTimeout(() => {
      setFlying(0);
      setDx(0);
      if (direction === 1) keep(current);
      else {
        // Out of the deck for this session; it leaves for good once cancelled.
        setSkipped(prev => new Set(prev).add(current.id));
        startCancel(current);
      }
    }, 220);
  };

  const reasons = (s: Subscription) => {
    const out: { tone: string; text: string }[] = [];
    const days = getDaysSinceLastUsed(s);
    if (days !== null && days >= 15) out.push({ tone: 'soon', text: t.unusedFor(days) });
    const raise = getPriceChangeInfo(s);
    if (raise) {
      const symbol = currencyFor(s.currencyCode, currency).symbol;
      out.push({ tone: 'late', text: t.priceRaised(symbol, raise.oldPrice.toFixed(2), raise.newPrice.toFixed(2)) });
    }
    const today = formatDateInput(new Date());
    if (s.reviewReminderDate && s.reviewReminderDate <= today) out.push({ tone: 'violet', text: t.reasonReview });
    return out;
  };

  const offset = flying ? flying * window.innerWidth : dx;
  const tilt = offset / 22;
  const armed = Math.abs(dx) > FLING ? Math.sign(dx) : 0;

  return (
    <div className="screen">
      <header className="screen-header">
        <h1 className="screen-title">{t.tabCut}</h1>
        {card && <span className="count-badge">{t.deckCount(all.length - deck.length + 1, all.length)}</span>}
      </header>

      <div className="saved-banner">
        <span className="eyebrow">{t.savedPerYear}</span>
        <span className="saved-amount">{money(saved, currency.symbol, locale, 0)}</span>
      </div>

      {card ? (
        <>
          <div className="deck">
            {next && (
              <div className="deck-card behind" aria-hidden="true">
                <ServiceLogo name={next.name} color={next.color} size={64} />
              </div>
            )}
            <div
              className="deck-card"
              style={{
                transform: `translateX(${offset}px) rotate(${tilt}deg)`,
                transition: start.current ? 'none' : 'transform .22s cubic-bezier(.2,.8,.2,1)',
              }}
              onPointerDown={e => { start.current = { x: e.clientX, id: e.pointerId }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
              onPointerMove={e => { if (start.current?.id === e.pointerId) setDx(e.clientX - start.current.x); }}
              onPointerUp={() => {
                start.current = null;
                if (Math.abs(dx) > FLING) decide(dx > 0 ? 1 : -1);
                else setDx(0);
              }}
              onPointerCancel={() => { start.current = null; setDx(0); }}
            >
              <span className={`deck-stamp keep${armed === 1 ? ' on' : ''}`}>{t.keep}</span>
              <span className={`deck-stamp cut${armed === -1 ? ' on' : ''}`}>{t.cut}</span>
              <ServiceLogo name={card.name} color={card.color} size={72} />
              <div className="deck-name">{card.name}</div>
              <div className="deck-price num">
                {money(card.price, currencyFor(card.currencyCode, currency).symbol, locale)}
                <span>{t.cycleShort[card.billingCycle]}</span>
              </div>
              <div className="deck-reasons">
                {reasons(card).map(r => <span key={r.text} className={`pill ${r.tone}`}>{r.text}</span>)}
              </div>
              {(card.purpose?.trim() || card.notes?.trim()) && (
                <div className="card-quote" style={{ textAlign: 'left', width: '100%' }}>
                  <span className="eyebrow">{t.whyPaying}</span>
                  {card.purpose?.trim() || card.notes?.trim()}
                </div>
              )}
              <p className="deck-question">{t.deckQuestion}</p>
            </div>
          </div>
          <div className="deck-actions">
            <button className="btn danger" onClick={() => decide(-1)}>← {t.cut}</button>
            <button className="btn primary" onClick={() => decide(1)}>{t.keep} →</button>
          </div>
        </>
      ) : (
        <div className="empty" style={{ marginTop: 18 }}>
          <img className="empty-badger" src="badger.png" alt="" />
          <h3>{t.deckEmptyTitle}</h3>
          <p>{t.deckEmptyBody}</p>
        </div>
      )}
    </div>
  );
}
