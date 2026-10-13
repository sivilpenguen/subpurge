import { SplashScreen } from '@capacitor/splash-screen';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDueReviewSubscriptions, getInactiveSubscriptions, getPriceIncreaseSubscriptions } from './core/store/logic';
import { StoreContext, useStore, useSubscriptionStore } from './core/store/useSubscriptionStore';
import { haptic, syncStatusBar } from './platform/native';
import { syncSubscriptionNotificationsAsync } from './platform/notifications';
import { CoachMarks, Onboarding } from './ui/components/Onboarding';
import { IconFlame, IconReceipt, IconSliders } from './ui/icons';
import { EditPage } from './ui/screens/EditPage';
import { HomeScreen } from './ui/screens/HomeScreen';
import { PurgeScreen } from './ui/screens/PurgeScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { SummaryPage } from './ui/screens/SummaryPage';
import { UIProvider, type Route } from './ui/shell';

type Tab = 'home' | 'purge' | 'settings';

function renderRoute(route: Route, closing: boolean) {
  return route.name === 'edit' ? <EditPage id={route.id} closing={closing} /> : <SummaryPage closing={closing} />;
}

function Shell() {
  const { subscriptions, locale, themeMode, t, isHydrated, hasOnboarded } = useStore();
  const [tab, setTab] = useState<Tab>('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [touring, setTouring] = useState(false);

  // Theme → <html data-theme>, status bar style, theme-color.
  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.lang = locale;
    syncStatusBar(themeMode);
  }, [themeMode, locale]);

  // Keep scheduled reminders in step with the data (never prompts here).
  useEffect(() => {
    if (isHydrated) void syncSubscriptionNotificationsAsync(subscriptions, locale).catch(() => {});
  }, [isHydrated, subscriptions, locale]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!hasOnboarded) setShowOnboarding(true);
    void SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
    // Only on first hydration.
  }, [isHydrated]);

  const purgeCount = useMemo(() => {
    const ids = new Set([...getDueReviewSubscriptions(subscriptions), ...getInactiveSubscriptions(subscriptions), ...getPriceIncreaseSubscriptions(subscriptions)].map(s => s.id));
    return ids.size;
  }, [subscriptions]);

  const startTour = useCallback(() => {
    setTab('home');
    setTimeout(() => setTouring(true), 350);
  }, []);
  const endTour = useCallback(() => setTouring(false), []);

  if (!isHydrated) return null;

  const tabs: { id: Tab; label: string; icon: typeof IconReceipt; className?: string }[] = [
    { id: 'home', label: t.tabSubscriptions, icon: IconReceipt },
    { id: 'purge', label: t.purgeMode, icon: IconFlame, className: 'purge' },
    { id: 'settings', label: t.tabSettings, icon: IconSliders },
  ];

  return (
    <>
      {tab === 'home' && <HomeScreen />}
      {tab === 'purge' && <PurgeScreen />}
      {tab === 'settings' && <SettingsScreen onShowTour={startTour} />}

      <nav className="tabbar" role="tablist">
        {tabs.map(({ id, label, icon: Icon, className }) => (
          <button
            key={id}
            role="tab"
            className={`tab${className ? ` ${className}` : ''}`}
            aria-selected={tab === id}
            aria-label={label}
            data-coach={id === 'purge' ? 'purge' : undefined}
            onClick={() => { if (tab !== id) haptic.tap(); setTab(id); }}
          >
            <Icon size={21} />
            <span className="tab-label">{label}</span>
            {id === 'purge' && purgeCount > 0 && tab !== 'purge' && <span className="tab-badge">{purgeCount}</span>}
          </button>
        ))}
      </nav>

      {showOnboarding && <Onboarding onFinish={() => { setShowOnboarding(false); startTour(); }} />}
      {touring && <CoachMarks onDone={endTour} />}
    </>
  );
}

export default function App() {
  const store = useSubscriptionStore();
  return (
    <StoreContext.Provider value={store}>
      <div className="app">
        <UIProvider renderRoute={renderRoute}>
          <Shell />
        </UIProvider>
      </div>
    </StoreContext.Provider>
  );
}
