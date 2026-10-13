import { useEffect, useRef, useState } from 'react';
import { SERVICE_CATEGORIES, SERVICE_PRESETS, type BillingCycle, type ServicePlanTemplate, type ServicePreset } from '../../core/constants/services';
import type { TrackingType } from '../../core/store/logic';
import { useStore } from '../../core/store/useSubscriptionStore';
import { addBillingCycleToDate, addMonthsToDateValue, compareDateValues, formatDateInput, isCalendarDate } from '../../core/utils/subscriptionDates';
import { haptic } from '../../platform/native';
import { syncSubscriptionNotificationsAsync } from '../../platform/notifications';
import { ServiceLogo } from '../components/ServiceLogo';
import { currencyFor, money } from '../format';
import { IconChevron, IconPlus, IconSearch } from '../icons';
import { useUI } from '../shell';
import { useFlows } from '../flows';
import type { BillingSource } from '../../core/store/logic';

const CYCLES: BillingCycle[] = ['weekly', 'monthly', 'yearly'];
const TRACKING: TrackingType[] = ['renewal', 'expiry'];

function normalizeExternalUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidExternalUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+\.[^\s]+/i.test(value);
}

function Segment<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="segment" role="group">
      {options.map(o => (
        <button key={o.value} aria-pressed={o.value === value} onClick={() => { haptic.tap(); onChange(o.value); }}>{o.label}</button>
      ))}
    </div>
  );
}

export function EditPage({ id, closing }: { id?: string; closing: boolean }) {
  const store = useStore();
  const { subscriptions, locale, currency, t, planLookup } = store;
  const { pop, showDialog, showToast } = useUI();
  const { ensureCapacity, startCancel } = useFlows();
  const presets = SERVICE_PRESETS;

  const existing = id ? subscriptions.find(s => s.id === id) ?? null : null;
  const isEdit = !!existing;
  const today = formatDateInput(new Date());
  const defaultStart = existing?.startDate ?? today;
  const defaultCycle = existing?.billingCycle ?? 'monthly';
  const matchingPreset = presets.find(p => p.name === existing?.name);
  const subCurrency = currencyFor(existing?.currencyCode, currency);

  const [name, setName] = useState(existing?.name ?? '');
  const [price, setPrice] = useState(existing?.price?.toString() ?? '');
  const [cycle, setCycle] = useState<BillingCycle>(defaultCycle);
  const [icon, setIcon] = useState(existing?.icon ?? '◈');
  const [color, setColor] = useState(existing?.color ?? '#6C6C6C');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(existing?.logoUrl);
  const [manageDeepLink, setManageDeepLink] = useState(existing?.manageDeepLink ?? matchingPreset?.manageDeepLink);
  const [purpose, setPurpose] = useState(existing?.purpose ?? '');
  const [quickCancelUrl, setQuickCancelUrl] = useState(existing?.quickCancelUrl ?? matchingPreset?.quickCancelUrl ?? '');
  const [reviewReminderDate, setReviewReminderDate] = useState(existing?.reviewReminderDate ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [startDate, setStartDate] = useState(defaultStart);
  const [trackingType, setTrackingType] = useState<TrackingType>(existing?.trackingType ?? 'renewal');
  const [nextBillingDate, setNextBillingDate] = useState(existing?.nextBillingDate ?? addBillingCycleToDate(defaultStart, defaultCycle));
  const [expiryDate, setExpiryDate] = useState(existing?.expiryDate ?? addBillingCycleToDate(defaultStart, defaultCycle));
  const [picking, setPicking] = useState(!existing);
  const [query, setQuery] = useState('');
  const [isCustom, setIsCustom] = useState(!!existing && !matchingPreset);
  const [targetDateTouched, setTargetDateTouched] = useState(Boolean(existing?.nextBillingDate || existing?.expiryDate));
  const [urlError, setUrlError] = useState('');
  const [showMore, setShowMore] = useState(isEdit);
  const [billedVia, setBilledVia] = useState<BillingSource | undefined>(existing?.billedVia);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => {
    const known = existing ? planLookup(existing.name, subCurrency.code, existing.billedVia)?.plans : undefined;
    if (!known?.length || !existing) return null;
    if (existing.planTemplateId && known.some(p => p.id === existing.planTemplateId)) return existing.planTemplateId;
    return known.find(p => p.billingCycle === existing.billingCycle && p.price.toFixed(2) === existing.price.toFixed(2))?.id ?? null;
  });
  const priceRef = useRef<HTMLInputElement>(null);

  // Plans for this service in the subscription's currency, from where the user pays.
  const planSet = name ? planLookup(name, subCurrency.code, billedVia) : null;
  const allPlans = planSet?.plans ?? [];
  const trackedDate = trackingType === 'renewal' ? nextBillingDate : expiryDate;
  const suggestedTracked = isCalendarDate(startDate) ? addBillingCycleToDate(startDate, cycle) : '';
  const reviewBase = isCalendarDate(trackedDate ?? '') ? trackedDate! : today;

  useEffect(() => {
    if (!isCalendarDate(startDate) || targetDateTouched) return;
    const suggested = addBillingCycleToDate(startDate, cycle);
    if (trackingType === 'renewal') setNextBillingDate(suggested);
    else setExpiryDate(suggested);
  }, [cycle, startDate, targetDateTouched, trackingType]);

  const applyPlan = (plan: ServicePlanTemplate) => {
    haptic.tap();
    setSelectedPlanId(plan.id);
    setCycle(plan.billingCycle);
    setPrice(plan.price.toFixed(2));
  };

  const selectPreset = (preset: ServicePreset, custom = false) => {
    haptic.tap();
    setIsCustom(custom);
    setName(preset.name);
    setIcon(preset.icon);
    setColor(preset.color);
    setLogoUrl(preset.logoUrl);
    setManageDeepLink(preset.manageDeepLink);
    setQuickCancelUrl(preset.quickCancelUrl ?? '');
    const first = custom ? undefined : planLookup(preset.name, subCurrency.code, billedVia)?.plans[0];
    if (first) applyPlan(first);
    else { setSelectedPlanId(null); setPrice(''); }
    setQuery('');
    setPicking(false);
    if (!first) setTimeout(() => priceRef.current?.focus(), 350);
  };

  const fail = (message: string) => showDialog({ message, actions: [{ label: t.ok, variant: 'primary' }] });

  const handleSave = () => {
    if (!name.trim()) return fail(t.errorNameRequired);
    const parsed = parseFloat(price.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed <= 0) return fail(t.errorInvalidPrice);
    if (!isCalendarDate(startDate)) return fail(`${t.startDate} ${t.errorInvalidDate}`);
    if (trackingType === 'expiry') {
      if (!trackedDate || !isCalendarDate(trackedDate)) return fail(`${t.endDate} ${t.errorInvalidDate}`);
      if (compareDateValues(trackedDate, startDate) < 0) return fail(t.errorTrackedDateBeforeStart);
    }
    const normalizedUrl = normalizeExternalUrl(quickCancelUrl);
    if (normalizedUrl && !isValidExternalUrl(normalizedUrl)) return fail(t.errorInvalidUrl);
    if (reviewReminderDate && !isCalendarDate(reviewReminderDate)) return fail(`${t.reviewReminderDate} ${t.errorInvalidDate}`);

    const startDateChanged = existing?.startDate !== startDate;
    const data = {
      name: name.trim(),
      price: parsed,
      billingCycle: cycle,
      icon,
      color,
      logoUrl,
      manageDeepLink,
      planTemplateId: selectedPlanId,
      trackingType,
      nextBillingDate: trackingType === 'renewal' ? trackedDate : null,
      expiryDate: trackingType === 'expiry' ? trackedDate : null,
      currentPeriodStart: startDateChanged ? startDate : existing?.currentPeriodStart ?? startDate,
      completedCyclesCarry: startDateChanged ? 0 : existing?.completedCyclesCarry ?? 0,
      accruedSpentCarry: startDateChanged ? 0 : existing?.accruedSpentCarry ?? 0,
      isActive: existing?.isActive ?? true,
      startDate,
      endedAt: existing?.endedAt ?? null,
      purpose: purpose.trim(),
      quickCancelUrl: normalizedUrl,
      reviewReminderDate: reviewReminderDate || null,
      lastUsedAt: existing?.lastUsedAt ?? today,
      notes: notes.trim(),
      currencyCode: existing?.currencyCode ?? currency.code,
      billedVia,
    };

    if (isEdit) {
      store.updateSubscription(existing.id, data);
    } else {
      store.addSubscription(data);
      // First subscription: ask for notification permission at a moment that makes sense.
      if (subscriptions.length === 0) {
        void syncSubscriptionNotificationsAsync([{ ...data, id: 'first' }], locale, { requestPermissions: true });
      }
    }
    haptic.success();
    showToast(t.saveSuccessTitle);
    pop();
  };

  const handleTerminate = () => {
    if (!existing) return;
    showDialog({
      title: existing.isActive ? t.deleteConfirmTitle : t.reactivate,
      message: existing.isActive ? t.terminateConfirmMessage(existing.name) : undefined,
      accent: existing.isActive ? 'destructive' : 'neutral',
      actions: [
        { label: t.cancel },
        existing.isActive
          ? { label: t.terminate, variant: 'destructive', onPress: () => { store.toggleActive(existing.id); pop(); } }
          : { label: t.reactivate, variant: 'primary', onPress: () => { if (!ensureCapacity()) return; store.toggleActive(existing.id); pop(); } },
      ],
    });
  };

  const suggestions = query.trim() ? presets.filter(p => p.name.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale))) : [];
  const grouped = SERVICE_CATEGORIES
    .map(cat => ({ id: cat.id, label: t.categories[cat.id as keyof typeof t.categories] ?? cat.label, items: presets.filter(p => p.category === cat.id) }))
    .filter(g => g.items.length > 0);
  // Bundled plan prices are TRY; never offer them for a subscription in another currency.
  const plans = allPlans.filter(p => p.billingCycle === cycle);
  const cycleLabels: Record<BillingCycle, string> = { weekly: t.weekly, monthly: t.monthly2, yearly: t.yearly2 };

  return (
    <div className={`page modal${closing ? ' closing' : ''}`} role="dialog" aria-modal="true">
      <header className="page-header">
        <button className="text-btn left" onClick={pop}>{t.cancel}</button>
        <h2>{isEdit ? t.editSubscription : t.newSubscription}</h2>
        {picking ? <span /> : <button className="text-btn accent right" onClick={handleSave}>{t.save}</button>}
      </header>

      <div className="page-body">
        {picking ? (
          <>
            <label className="search" style={{ marginTop: 0, marginBottom: 18 }}>
              <IconSearch size={18} />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t.selectService}
                autoCorrect="off"
                autoCapitalize="none"
                enterKeyHint="done"
              />
            </label>

            {query.trim() ? (
              <div className="group results">
                {suggestions.slice(0, 8).map(preset => (
                  <button key={preset.name} className="group-row" onClick={() => selectPreset(preset)}>
                    <ServiceLogo name={preset.name} color={preset.color} size={32} />
                    <div className="group-row-body group-row-title">{preset.name}</div>
                    <IconChevron className="chev" size={17} />
                  </button>
                ))}
                <button className="group-row" onClick={() => selectPreset({ name: query.trim(), color: '#6C6C6C', icon: '◈' }, true)}>
                  <div className="logo" style={{ width: 32, height: 32 }}><IconPlus size={18} /></div>
                  <div className="group-row-body group-row-title">{t.addCustomService(query.trim())}</div>
                </button>
              </div>
            ) : (
              grouped.map(group => (
                <div className="picker-group" key={group.id}>
                  <span className="eyebrow">{group.label}</span>
                  <div className={`picker-grid${group.items.length <= 3 ? ' single' : ''}`}>
                    {group.items.map(preset => (
                      <button key={preset.name} className="picker-item" onClick={() => selectPreset(preset)}>
                        <ServiceLogo name={preset.name} color={preset.color} size={30} />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <button className="selected-service" onClick={() => { if (!isEdit) setPicking(true); }} disabled={isEdit} style={{ opacity: 1 }}>
              <ServiceLogo name={name} color={color} size={48} />
              <span className="name">{name}</span>
              {!isEdit && <span className="eyebrow">↺</span>}
            </button>

            {isCustom && (
              <div className="field">
                <span className="eyebrow field-label">{t.subscriptionName}</span>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder={t.subscriptionNamePlaceholder} />
              </div>
            )}

            <div className="field">
              <span className="eyebrow field-label">{t.billingCycle}</span>
              <Segment
                options={CYCLES.map(c => ({ value: c, label: cycleLabels[c] }))}
                value={cycle}
                onChange={v => {
                  setCycle(v);
                  const plan = allPlans.find(p => p.billingCycle === v);
                  if (plan) { setSelectedPlanId(plan.id); setPrice(plan.price.toFixed(2)); } else setSelectedPlanId(null);
                }}
              />
            </div>

            <div className="field">
              <span className="eyebrow field-label">{t.whereBilled}</span>
              <div className="choice-grid" role="group">
                {(['appstore', 'googleplay', 'web', 'operator'] as const).map(source => (
                  <button
                    key={source}
                    className="plan"
                    aria-pressed={billedVia === source}
                    onClick={() => {
                      haptic.tap();
                      const next = billedVia === source ? undefined : source;
                      setBilledVia(next);
                      // Prices differ by where you pay (App Store vs website): re-pick the plan.
                      const nextPlan = planLookup(name, subCurrency.code, next)?.plans.find(p => p.billingCycle === cycle);
                      if (nextPlan) applyPlan(nextPlan);
                      else setSelectedPlanId(null);
                    }}
                  >
                    <div className="plan-name">{t.billingShort[source]}</div>
                  </button>
                ))}
              </div>
            </div>

            {plans.length > 0 && (
              <div className="field">
                <span className="eyebrow field-label">{t.planTemplates} · {planSet ? t.planSource[planSet.source] : ''}</span>
                <div className="plans">
                  {plans.map(plan => (
                    <button key={plan.id} className="plan" aria-pressed={plan.id === selectedPlanId} onClick={() => applyPlan(plan)}>
                      <div className="plan-name">{plan.name}</div>
                      <div className="plan-price">{money(plan.price, subCurrency.symbol, locale)}</div>
                    </button>
                  ))}
                  <button className="plan" aria-pressed={selectedPlanId === null} onClick={() => { setSelectedPlanId(null); priceRef.current?.focus(); }}>
                    <div className="plan-name">{t.customPrice}</div>
                    <div className="plan-price">…</div>
                  </button>
                </div>
              </div>
            )}

            <div className="field">
              <span className="eyebrow field-label">{t.price}</span>
              <label className="price-input">
                <span className="symbol">{subCurrency.symbol}</span>
                <input
                  ref={priceRef}
                  inputMode="decimal"
                  value={price}
                  onChange={e => { setSelectedPlanId(null); setPrice(e.target.value.replace(/[^0-9.,]/g, '')); }}
                  placeholder={t.pricePlaceholder}
                />
              </label>
            </div>

            <div className="field">
              <span className="eyebrow field-label">{t.trackingType}</span>
              <Segment
                options={TRACKING.map(k => ({ value: k, label: k === 'renewal' ? t.autoRenewing : t.fixedTerm }))}
                value={trackingType}
                onChange={v => { setTrackingType(v); setTargetDateTouched(false); }}
              />
            </div>

            <div className="field">
              <span className="eyebrow field-label">{t.startDate}</span>
              <input className="input date-input" type="date" value={startDate} max="2100-12-31" onChange={e => setStartDate(e.target.value)} />
              <div className="helper">
                <button className="helper-chip" onClick={() => setStartDate(today)}>{t.today}</button>
              </div>
            </div>

            <div className="field">
              <span className="eyebrow field-label">{trackingType === 'renewal' ? t.nextPaymentDate : t.endDate}</span>
              <input
                className="input date-input"
                type="date"
                value={trackedDate ?? ''}
                min={trackingType === 'expiry' && isCalendarDate(startDate) ? startDate : undefined}
                onChange={e => {
                  setTargetDateTouched(true);
                  if (trackingType === 'renewal') setNextBillingDate(e.target.value);
                  else setExpiryDate(e.target.value);
                }}
              />
              {suggestedTracked && suggestedTracked !== trackedDate && (
                <div className="helper">
                  <button
                    className="helper-chip"
                    onClick={() => {
                      setTargetDateTouched(true);
                      if (trackingType === 'renewal') setNextBillingDate(suggestedTracked);
                      else setExpiryDate(suggestedTracked);
                    }}
                  >
                    {t.suggestedDate}
                  </button>
                  <span className="helper-text">{suggestedTracked}</span>
                </div>
              )}
            </div>

            {!showMore ? (
              <div className="field">
                <button className="btn ghost block" onClick={() => setShowMore(true)}>{t.moreDetails}</button>
              </div>
            ) : (
              <>
                <div className="field">
                  <span className="eyebrow field-label">{t.whyPaying}</span>
                  <textarea className="input" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder={t.whyPayingPlaceholder} />
                </div>

                <div className="field">
                  <span className="eyebrow field-label">{t.reviewReminderDate}</span>
                  <input className="input date-input" type="date" value={reviewReminderDate} onChange={e => setReviewReminderDate(e.target.value)} />
                  <div className="helper">
                    <button className="helper-chip" onClick={() => setReviewReminderDate(addMonthsToDateValue(reviewBase, 1))}>{t.remindMeIn1Month}</button>
                    <button className="helper-chip" onClick={() => setReviewReminderDate(addMonthsToDateValue(reviewBase, 3))}>{t.remindMeIn3Months}</button>
                    {reviewReminderDate && <button className="helper-chip" onClick={() => setReviewReminderDate('')}>×</button>}
                  </div>
                </div>

                <div className="field">
                  <span className="eyebrow field-label">{t.quickCancelUrl}</span>
                  <input
                    className={`input${urlError ? ' error' : ''}`}
                    value={quickCancelUrl}
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    onChange={e => { setQuickCancelUrl(e.target.value); if (urlError) setUrlError(''); }}
                    onBlur={() => {
                      const normalized = normalizeExternalUrl(quickCancelUrl);
                      setUrlError(normalized && !isValidExternalUrl(normalized) ? t.errorInvalidUrl : '');
                    }}
                    placeholder={t.quickCancelUrlPlaceholder}
                  />
                  {urlError && <div className="field-error">{urlError}</div>}
                </div>

                <div className="field">
                  <span className="eyebrow field-label">{t.notes}</span>
                  <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.notesPlaceholder} />
                </div>
              </>
            )}

            <div className="form-actions">
              {isEdit && existing.isActive && (
                <button className="btn danger-ghost" onClick={() => { pop(); setTimeout(() => startCancel(existing), 260); }}>
                  {t.cancelAction}
                </button>
              )}
              {isEdit && (
                <button className={`btn ${existing.isActive ? 'danger-ghost' : 'ghost'}`} onClick={handleTerminate}>
                  {existing.isActive ? t.terminate : t.reactivate}
                </button>
              )}
              <button className="btn primary" onClick={handleSave}>{t.save}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
