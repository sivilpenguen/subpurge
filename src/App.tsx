import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDueReviewSubscriptions, getInactiveSubscriptions, getPriceIncreaseSubscriptions } from './core/store/logic';
import { StoreContext, useStore, useSubscriptionStore } from './core/store/useSubscriptionStore';
import { haptic, syncStatusBar } from './platform/native';
import { syncSubscriptionNotificationsAsync } from './platform/notifications';
import { AppSplash } from './ui/components/AppSplash';
import { CoachMarks, Onboarding } from './ui/components/Onboarding';
import { FlowProvider } from './ui/flows';
import { IconFlame, IconReceipt, IconSliders } from './ui/icons';
import { EditPage } from './ui/screens/EditPage';
import { HomeScreen } from './ui/screens/HomeScreen';
import { DeckScreen } from './ui/screens/DeckScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { SummaryPage } from './ui/screens/SummaryPage';
import { UIOutlet, UIProvider, type Route } from './ui/shell';

type Tab = 'home' | 'cut' | 'settings';

function renderRoute(route: Route, closing: boolean) {
  return route.name === 'edit' ? <EditPage id={route.id} closing={closing} /> : <SummaryPage closing={closing} />;
}

function Shell() {
  const { subscriptions, locale, themeMode, t, isHydrated, hasOnboarded } = useStore();
  const [tab, setTab] = useState<Tab>('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [splash, setSplash] = useState(true);
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

  const finishSplash = useCallback(() => setSplash(false), []);

  // First launch: onboarding right after the splash (once the data is known).
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  useEffect(() => {
    if (splash || !isHydrated || onboardingChecked) return;
    setOnboardingChecked(true);
    if (!hasOnboarded) setShowOnboarding(true);
  }, [splash, isHydrated, hasOnboarded, onboardingChecked]);

  const cutCount = useMemo(() => {
    const ids = new Set([...getDueReviewSubscriptions(subscriptions), ...getInactiveSubscriptions(subscriptions), ...getPriceIncreaseSubscriptions(subscriptions)].map(s => s.id));
    return ids.size;
  }, [subscriptions]);

  const startTour = useCallback(() => {
    setTab('home');
    setTimeout(() => setTouring(true), 350);
  }, []);
  const endTour = useCallback(() => setTouring(false), []);


  const tabs: { id: Tab; label: string; icon: typeof IconReceipt; className?: string }[] = [
    { id: 'home', label: t.tabList, icon: IconReceipt },
    { id: 'cut', label: t.tabCut, icon: IconFlame, className: 'purge' },
    { id: 'settings', label: t.tabSettings, icon: IconSliders },
  ];

  return (
    <>
      {isHydrated && (
        <>
          {tab === 'home' && <HomeScreen />}
          {tab === 'cut' && <DeckScreen />}
          {tab === 'settings' && <SettingsScreen onShowTour={startTour} />}

          <nav className="tabbar" role="tablist">
            {tabs.map(({ id, label, icon: Icon, className }) => (
              <button
                key={id}
                role="tab"
                className={`tab${className ? ` ${className}` : ''}`}
                aria-selected={tab === id}
                aria-label={label}
                data-coach={id === 'cut' ? 'purge' : undefined}
                onClick={() => { if (tab !== id) haptic.tap(); setTab(id); }}
              >
                <Icon size={21} />
                <span className="tab-label">{label}</span>
                {id === 'cut' && cutCount > 0 && tab !== 'cut' && <span className="tab-badge">{cutCount}</span>}
              </button>
            ))}
          </nav>

          {showOnboarding && <Onboarding onFinish={() => { setShowOnboarding(false); startTour(); }} />}
          {touring && <CoachMarks onDone={endTour} />}
        </>
      )}
      {splash && <AppSplash onDone={finishSplash} />}
    </>
  );
}

export default function App() {
  const store = useSubscriptionStore();
  return (
    <StoreContext.Provider value={store}>
      <div className="app">
        <UIProvider renderRoute={renderRoute}>
          <FlowProvider>
            <Shell />
            <UIOutlet />
          </FlowProvider>
        </UIProvider>
      </div>
    </StoreContext.Provider>
  );
}
