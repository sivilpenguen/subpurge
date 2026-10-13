import { useState } from 'react';
import { CURRENCIES } from '../../core/constants/currencies';
import { LANGUAGE_OPTIONS, type Locale } from '../../core/constants/i18n';
import { getSubscriptionFutureCommitment, getSubscriptionTotalSpent } from '../../core/store/logic';
import { useStore } from '../../core/store/useSubscriptionStore';
import { BackupError, exportCSV, exportJSON, pickBackupFile } from '../../platform/backup';
import { haptic } from '../../platform/native';
import { scheduleNotificationTestAsync, syncSubscriptionNotificationsAsync } from '../../platform/notifications';
import { currencyName, money, toDisplay } from '../format';
import { IconCheck, IconChevron } from '../icons';
import { Sheet, useUI } from '../shell';
import { useFlows } from '../flows';

const FLAGS: Record<Locale, string> = { tr: '🇹🇷', en: '🇬🇧', es: '🇪🇸', de: '🇩🇪', fr: '🇫🇷' };

export function SettingsScreen({ onShowTour }: { onShowTour: () => void }) {
  const store = useStore();
  const { currency, locale, subscriptions, themeMode, t, exchangeRates } = store;
  const { push, showDialog, showToast } = useUI();
  const [sheet, setSheet] = useState<'lang' | 'currency' | null>(null);
  const { isPro, proPrice, openPaywall } = useFlows();

  const active = subscriptions.filter(s => s.isActive);
  const ended = subscriptions.filter(s => !s.isActive);
  const sum = (list: typeof subscriptions, pick: (s: (typeof subscriptions)[number]) => number) =>
    list.reduce((total, s) => total + toDisplay(pick(s), s, currency, exchangeRates), 0);
  const thisPeriodDue = sum(active, s => s.price);
  const endedTotalSpent = sum(ended, s => getSubscriptionTotalSpent(s));
  const futureCommitment = sum(active, s => getSubscriptionFutureCommitment(s));
  const currentLang = LANGUAGE_OPTIONS.find(l => l.code === locale);

  const backupErrorMessage = (err: unknown) => {
    if (err instanceof BackupError) {
      return err.code === 'unsupported' ? t.backupUnsupported : err.code === 'invalidJson' ? t.backupInvalidJson : t.backupInvalidFormat;
    }
    return t.importError;
  };

  const runExport = async (kind: 'json' | 'csv') => {
    // The JSON backup is the user's own data and stays free; CSV (spreadsheets) is Pro.
    if (kind === 'csv' && !isPro) {
      openPaywall('export');
      return;
    }
    try {
      if (kind === 'json') await exportJSON(subscriptions, currency);
      else await exportCSV(subscriptions, currency);
    } catch (err) {
      showDialog({ title: kind === 'json' ? t.exportJSON : t.exportCSV, message: backupErrorMessage(err), accent: 'destructive', actions: [{ label: t.ok, variant: 'primary' }] });
    }
  };

  const runImport = async () => {
    try {
      const backup = await pickBackupFile();
      if (!backup) return;
      showDialog({
        title: t.importJSON,
        message: t.importSuccessHint(backup.subscriptions.length),
        accent: 'destructive',
        actions: [
          { label: t.cancel },
          {
            label: t.importJSON,
            variant: 'destructive',
            onPress: () => {
              store.restoreFromBackup(backup.subscriptions, backup.currency);
              haptic.success();
              showToast(t.importSuccess);
            },
          },
        ],
      });
    } catch (err) {
      showDialog({ title: t.importJSON, message: backupErrorMessage(err), accent: 'destructive', actions: [{ label: t.ok, variant: 'primary' }] });
    }
  };

  const runNotificationTest = async () => {
    const scheduled = await scheduleNotificationTestAsync(locale);
    if (scheduled) await syncSubscriptionNotificationsAsync(subscriptions, locale);
    showDialog({
      title: t.notificationTests,
      message: scheduled ? t.notificationTestScheduled : t.notificationPermissionDenied,
      accent: scheduled ? 'neutral' : 'destructive',
      actions: [{ label: t.ok, variant: 'primary' }],
    });
  };

  const row = (title: string, hint: string | null, onClick: () => void, value?: string, danger = false) => (
    <button className={`group-row${danger ? ' danger' : ''}`} onClick={() => { haptic.tap(); onClick(); }}>
      <div className="group-row-body">
        <div className="group-row-title">{title}</div>
        {hint && <div className="group-row-hint">{hint}</div>}
      </div>
      {value && <span className="group-row-value">{value}</span>}
      <IconChevron className="chev" size={17} />
    </button>
  );

  return (
    <div className="screen">
      <header className="screen-header">
        <h1 className="screen-title">{t.settings}</h1>
      </header>

      <div className="section-label"><span className="eyebrow">{t.proTitle}</span></div>
      <div className="group">
        {isPro
          ? <div className="group-row"><div className="group-row-body group-row-title">{t.proActive}</div><span className="pill ok">PRO</span></div>
          : row(t.proTitle, t.proTagline, () => openPaywall(), proPrice)}
      </div>

      <div className="section-label"><span className="eyebrow">{t.appearance}</span></div>
      <div style={{ margin: '0 var(--gutter)' }}>
        <div className="segment" role="group">
          {(['dark', 'light'] as const).map(mode => (
            <button key={mode} aria-pressed={themeMode === mode} onClick={() => { haptic.tap(); store.setThemeMode(mode); }}>
              {mode === 'dark' ? t.themeDark : t.themeLight}
            </button>
          ))}
        </div>
      </div>

      <div className="section-label"><span className="eyebrow">{t.language} · {t.currency}</span></div>
      <div className="group">
        {row(t.language, null, () => setSheet('lang'), `${FLAGS[locale]} ${currentLang?.nativeName ?? ''}`)}
        {row(t.currency, null, () => setSheet('currency'), `${currency.symbol} ${currency.code}`)}
      </div>
      <p className="note">{t.currencySymbolNote}</p>

      <div className="section-label"><span className="eyebrow">{t.summary}</span></div>
      <div className="group">
        <div className="stat-grid">
          <div className="stat-cell"><span>{t.totalSubscriptions}</span><b>{subscriptions.length}</b></div>
          <div className="stat-cell"><span>{t.active} / {t.terminated}</span><b>{active.length} / {ended.length}</b></div>
          <div className="stat-cell"><span>{t.thisMonthDue}</span><b>{money(thisPeriodDue, currency.symbol, locale)}</b></div>
          <div className="stat-cell"><span>{t.futureCommitment}</span><b>{money(futureCommitment, currency.symbol, locale)}</b></div>
          <div className="stat-cell" style={{ gridColumn: '1 / -1' }}><span>{t.endedTotalSpent}</span><b>{money(endedTotalSpent, currency.symbol, locale)}</b></div>
        </div>
        {row(t.priceSummary, t.costBreakdown, () => push({ name: 'summary' }))}
      </div>

      <div className="section-label"><span className="eyebrow">{t.backupSection}</span></div>
      <div className="group">
        {row(t.exportJSON, t.exportJSONHint, () => { void runExport('json'); })}
        {row(t.exportCSV, t.exportCSVHint, () => { void runExport('csv'); }, isPro ? undefined : 'PRO')}
        {row(t.importJSON, t.importJSONHint, () => { void runImport(); })}
      </div>

      <div className="section-label"><span className="eyebrow">{t.onboardingSection} · {t.notificationTests}</span></div>
      <div className="group">
        {row(t.onboardingShowTour, t.onboardingShowTourHint, onShowTour)}
        {row(t.runNotificationTest, t.notificationTestsHint, () => { void runNotificationTest(); })}
        {import.meta.env.DEV && row(t.loadDemoData, t.loadDemoDataHint, () => showDialog({
          title: t.demoLoadTitle,
          message: t.demoLoadMessage,
          accent: 'destructive',
          actions: [
            { label: t.cancel },
            { label: t.loadDemoData, variant: 'destructive', onPress: () => { store.loadDemoSubscriptions(); showToast(t.demoLoadedTitle); } },
          ],
        }))}
      </div>

      <div className="section-label"><span className="eyebrow">{t.resetData}</span></div>
      <div className="group">
        {row(t.resetData, t.resetDataHint, () => showDialog({
          title: t.resetDataTitle,
          message: t.resetDataMessage,
          accent: 'destructive',
          actions: [{ label: t.cancel }, { label: t.resetData, variant: 'destructive', onPress: store.resetAllData }],
        }), undefined, true)}
      </div>

      <p className="note" style={{ textAlign: 'center', paddingTop: 24 }}>
        Subpurge · {t.version} {__APP_VERSION__}
      </p>

      {sheet === 'lang' && (
        <Sheet title={t.selectLanguage} onClose={() => setSheet(null)}>
          {close => LANGUAGE_OPTIONS.map(option => (
            <button
              key={option.code}
              className="option"
              aria-selected={option.code === locale}
              onClick={() => { haptic.tap(); store.setLocale(option.code); close(); }}
            >
              <span className="option-lead">{FLAGS[option.code]}</span>
              <span className="option-body">
                <div>{option.nativeName}</div>
                <div className="option-sub">{option.name}</div>
              </span>
              {option.code === locale && <IconCheck size={18} />}
            </button>
          ))}
        </Sheet>
      )}

      {sheet === 'currency' && (
        <Sheet title={t.selectCurrency} onClose={() => setSheet(null)}>
          {close => CURRENCIES.map(option => (
            <button
              key={option.code}
              className="option"
              aria-selected={option.code === currency.code}
              onClick={() => { haptic.tap(); store.setCurrency(option); close(); }}
            >
              <span className="option-lead num">{option.symbol}</span>
              <span className="option-body">
                <div>{option.code}</div>
                <div className="option-sub">{currencyName(option, locale)}</div>
              </span>
              {option.code === currency.code && <IconCheck size={18} />}
            </button>
          ))}
        </Sheet>
      )}
    </div>
  );
}
