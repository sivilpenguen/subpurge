import { useMemo } from 'react';
import { getSubscriptionAccruedSpent } from '../../core/store/logic';
import { useStore } from '../../core/store/useSubscriptionStore';
import { getMonthlyEquivalent, getMonthlySpendHistory, getSummaryTotals } from '../../core/utils/subscriptionSummary';
import { ServiceLogo } from '../components/ServiceLogo';
import { currencyFor, money, toDisplay } from '../format';
import { IconBack } from '../icons';
import { useUI } from '../shell';

export function SummaryPage({ closing }: { closing: boolean }) {
  const { subscriptions, currency, exchangeRates, t, locale } = useStore();
  const { pop } = useUI();
  const { monthlyTotal, dailyCost, yearlyCost } = getSummaryTotals(subscriptions, currency.code, exchangeRates);
  const active = subscriptions.filter(s => s.isActive);

  const trend = useMemo(() => {
    const months = getMonthlySpendHistory(subscriptions, 6);
    // Re-label with the app locale (the util uses the runtime default).
    return months.map(m => ({
      ...m,
      label: new Date(`${m.isoMonth}-15T12:00:00`).toLocaleString(locale, { month: 'short' }),
    }));
  }, [subscriptions, locale]);
  const trendMax = Math.max(...trend.map(d => d.amount), 1);
  const currentIsoMonth = new Date().toISOString().slice(0, 7);

  const breakdown = useMemo(() => [...subscriptions]
    .map(s => ({ s, monthly: toDisplay(getMonthlyEquivalent(s), s, currency, exchangeRates) }))
    .sort((a, b) => Number(b.s.isActive) - Number(a.s.isActive) || b.monthly - a.monthly), [subscriptions, currency, exchangeRates]);

  return (
    <div className={`page${closing ? ' closing' : ''}`}>
      <header className="page-header">
        <button className="text-btn left" onClick={pop}><IconBack size={18} />{t.back.replace(/^‹\s*/, '')}</button>
        <h2>{t.priceSummary}</h2>
        <span />
      </header>

      <div className="page-body">
        <div className="kpis">
          <div className="kpi feature">
            <span>{t.monthlyTotal}</span>
            <b>{money(monthlyTotal, currency.symbol, locale)}</b>
          </div>
          <div className="kpi"><span>{t.daily}</span><b>{money(dailyCost, currency.symbol, locale)}</b></div>
          <div className="kpi"><span>{t.yearlyCost}</span><b>{money(yearlyCost, currency.symbol, locale, 0)}</b></div>
        </div>

        <div className="section-label"><span className="eyebrow">{t.spendTrend}</span></div>
        <div className="card">
          <div className="chart">
            {trend.map((month, i) => (
              <div key={month.isoMonth} className={`bar-col${month.isoMonth === currentIsoMonth ? ' current' : ''}`}>
                <span className="bar-value">{month.amount > 0 ? money(month.amount, currency.symbol, locale, 0) : ''}</span>
                <div
                  className="bar"
                  style={{ height: `${Math.max(4, (month.amount / trendMax) * 100)}px`, animationDelay: `${i * 50}ms` }}
                />
                <span className="bar-label">{month.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-label">
          <span className="eyebrow">{t.costBreakdown}</span>
          <span className="count-badge">{active.length}</span>
        </div>
        <div className="group">
          {breakdown.map(({ s, monthly }, i) => {
            const symbol = currencyFor(s.currencyCode, currency).symbol;
            const share = monthlyTotal > 0 && s.isActive ? monthly / monthlyTotal : 0;
            return (
              <div className="share-row" key={s.id} style={{ opacity: s.isActive ? 1 : 0.55 }}>
                <ServiceLogo name={s.name} color={s.color} size={36} />
                <div className="row-body">
                  <div className="row-top">
                    <span className="row-name">{s.name}</span>
                    <span className="row-price">
                      {money(monthly, currency.symbol, locale)}
                      <span className="row-cycle">{t.cycleShort.monthly}</span>
                    </span>
                  </div>
                  <div className="row-bottom">
                    <span className="row-meta">
                      {money(s.price, symbol, locale)}{t.cycleShort[s.billingCycle]} · {t.totalSpent}: {money(getSubscriptionAccruedSpent(s), symbol, locale)}
                    </span>
                    {s.isActive && <span className="pill violet">{Math.round(share * 100)}%</span>}
                  </div>
                  {s.isActive && (
                    <div className="share-track">
                      <div className="share-fill" style={{ width: `${share * 100}%`, animationDelay: `${i * 40}ms` }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
