/**
 * Cross-screen flows: the cancel flow (where do you pay → steps → open page →
 * "did you cancel?" on return) and Pro (status, price, paywall).
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { BillingSource, Subscription } from '../core/store/logic';
import { toYearly } from '../core/store/logic';
import { useStore } from '../core/store/useSubscriptionStore';
import { formatDateInput } from '../core/utils/subscriptionDates';
import { haptic, openSubscriptionLink } from '../platform/native';
import { fallbackProPrice, fetchProPrice, FREE_ACTIVE_LIMIT, loadProStatus, purchasePro, restorePro } from '../platform/purchases';
import { ServiceLogo } from './components/ServiceLogo';
import { money, toDisplay } from './format';
import { IconCheck, IconExternal } from './icons';
import { Sheet, useUI } from './shell';

const APP_STORE_SUBSCRIPTIONS = 'itms-apps://apps.apple.com/account/subscriptions';
const APP_STORE_SUBSCRIPTIONS_WEB = 'https://apps.apple.com/account/subscriptions';
const PLAY_SUBSCRIPTIONS = 'https://play.google.com/store/account/subscriptions';
// Services Apple bills directly.
const APPLE_BILLED = new Set(['Apple One', 'iCloud+']);
const SOURCES: BillingSource[] = ['appstore', 'googleplay', 'web', 'operator'];

export function guessBillingSource(sub: Subscription): BillingSource {
  return sub.billedVia ?? (APPLE_BILLED.has(sub.name) ? 'appstore' : 'web');
}

function linksFor(sub: Subscription, source: BillingSource): [string | undefined, string | undefined] {
  if (source === 'appstore') return [APP_STORE_SUBSCRIPTIONS, APP_STORE_SUBSCRIPTIONS_WEB];
  if (source === 'googleplay') return [PLAY_SUBSCRIPTIONS, undefined];
  if (source === 'web') return [sub.quickCancelUrl || sub.manageDeepLink, sub.manageDeepLink];
  return [undefined, undefined];
}

interface FlowCtx {
  startCancel: (sub: Subscription) => void;
  isPro: boolean;
  proPrice: string;
  openPaywall: (reason?: 'limit' | 'export') => void;
  /** True when one more active subscription is allowed; otherwise opens the paywall. */
  ensureCapacity: () => boolean;
}

const Ctx = createContext<FlowCtx | null>(null);

export function useFlows(): FlowCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFlows must be used within FlowProvider');
  return ctx;
}

function CancelSheet({ sub, onClose, onOpened, onConfirm }: { sub: Subscription; onClose: () => void; onOpened: (sub: Subscription) => void; onConfirm: (sub: Subscription) => void }) {
  const { t, setBilledVia } = useStore();
  const { showDialog } = useUI();
  const [source, setSource] = useState<BillingSource | null>(sub.billedVia ?? null);
  const guess = guessBillingSource(sub);
  const [primary, fallback] = source ? linksFor(sub, source) : [undefined, undefined];

  return (
    <Sheet title={t.cancelAction} onClose={onClose}>
      {close => (
        <div style={{ padding: '0 20px 8px' }}>
          <div className="card-head" style={{ marginBottom: 18 }}>
            <ServiceLogo name={sub.name} color={sub.color} size={44} />
            <div className="card-head-body">
              <div className="card-title">{sub.name}</div>
              <div className="card-meta">{source ? t.billingLabels[source] : t.whereBilled}</div>
            </div>
          </div>

          {!source ? (
            <div className="group" style={{ margin: 0 }}>
              {SOURCES.map(s => (
                <button
                  key={s}
                  className="group-row"
                  onClick={() => { haptic.tap(); setSource(s); setBilledVia(sub.id, s); }}
                >
                  <div className="group-row-body group-row-title">{t.billingLabels[s]}</div>
                  {s === guess && <span className="pill ok">✓</span>}
                </button>
              ))}
            </div>
          ) : (
            <>
              <ol className="steps">
                {t.billingSteps[source].map(step => <li key={step}>{step}</li>)}
              </ol>
              {source === 'operator' || !primary ? (
                <button className="btn primary block" onClick={() => { close(); onConfirm(sub); }}>
                  <IconCheck size={18} /> {t.yesCancelled}
                </button>
              ) : (
                <button
                  className="btn primary block"
                  onClick={async () => {
                    const opened = await openSubscriptionLink(primary, fallback);
                    close();
                    if (opened) onOpened(sub);
                    else showDialog({ title: sub.name, message: t.cancelGuideMissing, actions: [{ label: t.ok, variant: 'primary' }] });
                  }}
                >
                  {t.openPage} <IconExternal size={17} />
                </button>
              )}
              <button className="text-btn" style={{ margin: '10px auto 0', display: 'flex' }} onClick={() => setSource(null)}>
                {t.changeBilling}
              </button>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

function Paywall({ reason, onClose }: { reason?: 'limit' | 'export'; onClose: () => void }) {
  const { t, purgeLog, currency, exchangeRates, locale } = useStore();
  const { proPrice, setPro } = useContext(ProInternal)!;
  const { showDialog, showToast } = useUI();
  const [busy, setBusy] = useState(false);
  const saved = purgeLog.reduce((sum, e) => sum + toDisplay(e.yearly, e, currency, exchangeRates), 0);

  return (
    <Sheet title={t.proTitle} onClose={onClose}>
      {close => (
        <div className="paywall">
          <img className="paywall-mark" src="badger.png" alt="" />
          {reason === 'limit' && <p className="paywall-reason">{t.proLimitTitle(FREE_ACTIVE_LIMIT)}. {t.proLimitBody}</p>}
          {reason === 'export' && <p className="paywall-reason">{t.proExportLocked}</p>}
          <h3>{t.proTagline}</h3>
          <ul className="paywall-list">
            {t.proFeatures.map(f => <li key={f}><IconCheck size={18} /> {f}</li>)}
          </ul>
          {saved > 0 && <p className="paywall-saved">{t.proSaved(money(saved, currency.symbol, locale, 0))}</p>}
          <button
            className="btn primary block"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const result = await purchasePro();
              setBusy(false);
              if (result === 'purchased') {
                setPro(true);
                haptic.success();
                close();
                showToast(t.proThanks);
              } else if (result === 'unavailable' || result === 'failed') {
                showDialog({ message: t.proUnavailable, actions: [{ label: t.ok, variant: 'primary' }] });
              }
            }}
          >
            {t.proBuy(proPrice)}
          </button>
          <button
            className="text-btn"
            style={{ margin: '12px auto 0', display: 'flex' }}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const owned = await restorePro();
              setBusy(false);
              if (owned === true) {
                setPro(true);
                close();
                showToast(t.proThanks);
              } else {
                showDialog({ message: owned === 'unavailable' ? t.proUnavailable : t.proNothingToRestore, actions: [{ label: t.ok, variant: 'primary' }] });
              }
            }}
          >
            {t.proRestore}
          </button>
        </div>
      )}
    </Sheet>
  );
}

const ProInternal = createContext<{ proPrice: string; setPro: (v: boolean) => void } | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const { t, currency, locale, subscriptions, exchangeRates } = store;
  const { showDialog, showToast } = useUI();
  const [cancelling, setCancelling] = useState<Subscription | null>(null);
  const [paywall, setPaywall] = useState<{ reason?: 'limit' | 'export' } | null>(null);
  const [isPro, setPro] = useState(false);
  const [storePrice, setStorePrice] = useState<string | null>(null);
  const pending = useRef<{ sub: Subscription; at: number } | null>(null);

  useEffect(() => {
    void loadProStatus().then(setPro);
    void fetchProPrice().then(setStorePrice);
  }, []);

  const confirm = useCallback((sub: Subscription) => {
    store.confirmCancellation(sub.id);
    haptic.success();
    const yearly = toDisplay(toYearly(sub.price, sub.billingCycle), sub, currency, exchangeRates);
    showToast(t.savedToast(money(yearly, currency.symbol, locale, 0)));
  }, [store, currency, exchangeRates, locale, t, showToast]);

  const askDidCancel = useCallback((sub: Subscription) => {
    showDialog({
      title: t.didYouCancel(sub.name),
      message: t.didYouCancelBody,
      actions: [
        { label: t.yesCancelled, variant: 'primary', onPress: () => confirm(sub) },
        {
          label: t.remindTomorrow,
          onPress: () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            store.updateSubscription(sub.id, { reviewReminderDate: formatDateInput(tomorrow) });
          },
        },
      ],
    });
  }, [t, showDialog, confirm, store]);

  // Coming back from the cancel page: ask once.
  useEffect(() => {
    const onVisible = () => {
      const p = pending.current;
      if (document.visibilityState !== 'visible' || !p || Date.now() - p.at < 1500) return;
      pending.current = null;
      setTimeout(() => askDidCancel(p.sub), 400);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [askDidCancel]);

  const onOpened = (sub: Subscription) => {
    pending.current = { sub, at: Date.now() };
    // Browser: a new tab opens without hiding us, so there is no visibility change.
    setTimeout(() => {
      if (pending.current?.sub.id === sub.id && document.visibilityState === 'visible') {
        pending.current = null;
        askDidCancel(sub);
      }
    }, 2500);
  };

  const activeCount = subscriptions.filter(s => s.isActive).length;
  const value: FlowCtx = {
    startCancel: sub => { haptic.tap(); setCancelling(sub); },
    isPro,
    proPrice: storePrice ?? fallbackProPrice(currency.code),
    openPaywall: reason => setPaywall({ reason }),
    ensureCapacity: () => {
      if (isPro || activeCount < FREE_ACTIVE_LIMIT) return true;
      setPaywall({ reason: 'limit' });
      return false;
    },
  };

  return (
    <Ctx.Provider value={value}>
      <ProInternal.Provider value={{ proPrice: value.proPrice, setPro }}>
        {children}
        {cancelling && (
          <CancelSheet
            sub={subscriptions.find(s => s.id === cancelling.id) ?? cancelling}
            onClose={() => setCancelling(null)}
            onOpened={onOpened}
            onConfirm={confirm}
          />
        )}
        {paywall && <Paywall reason={paywall.reason} onClose={() => setPaywall(null)} />}
      </ProInternal.Provider>
    </Ctx.Provider>
  );
}

