/**
 * useSubscriptionStore — React hook + Context
 *
 * Responsibilities:
 *   - AsyncStorage persistence (subscriptions, currency, locale, theme, onboarded)
 *   - CRUD operations (add, update, delete, toggleActive, markUsed, snooze, reset)
 *   - Demo data creation
 *   - Zod-validated hydration from AsyncStorage
 *
 * Pure calculation logic  → store/subscriptionCalculations.ts
 * Pure filter helpers     → store/subscriptionFilters.ts
 * Shared types            → store/subscriptionTypes.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { z } from 'zod';
import { BillingCycle, SERVICE_PRESETS } from '../constants/services';
import { Currency, DEFAULT_CURRENCY } from '../constants/currencies';
import { isLocale, Locale, TRANSLATIONS, Translations } from '../constants/i18n';
import { ThemeMode } from '../constants/theme';
import {
  addMonthsToDateValue,
  formatDateInput,
  getUpcomingBillingDate,
} from '../utils/subscriptionDates';
import {
  getCompletedCycleCountBetween,
  getSubscriptionTotalSpent,
} from './subscriptionCalculations';
import { findPlanTemplate } from './subscriptionFilters';
import type { PriceChangeInfo, Subscription, TrackingType } from './subscriptionTypes';

// ─── Re-exports (backward compat — all existing imports still work) ───────────
export type { TrackingType, Subscription, PriceChangeInfo } from './subscriptionTypes';
export {
  getCompletedCycleCountBetween,
  getCompletedCycleCount,
  getSubscriptionTotalSpent,
  getCurrentCycleProratedSpent,
  getSubscriptionAccruedSpent,
  getSubscriptionPaidUsage,
  getSubscriptionFutureCommitment,
  toMonthly,
  toYearly,
  getTrackedDate,
  getDaysSinceLastUsed,
} from './subscriptionCalculations';
export {
  getDueReviewSubscriptions,
  getInactiveSubscriptions,
  getPriceChangeInfo,
  getPriceIncreaseSubscriptions,
} from './subscriptionFilters';

// ─── Zod schema for stored subscriptions ─────────────────────────────────────

const BillingCycleSchema = z.enum(['weekly', 'monthly', 'yearly']);
const TrackingTypeSchema = z.enum(['renewal', 'expiry']);

const StoredSubscriptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
  price: z.number(),
  billingCycle: BillingCycleSchema,
  // optional fields with safe defaults
  logoUrl: z.string().optional(),
  manageDeepLink: z.string().optional(),
  planTemplateId: z.string().nullable().optional(),
  startDate: z.string().optional(),
  trackingType: TrackingTypeSchema.optional(),
  nextBillingDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  currentPeriodStart: z.string().optional(),
  completedCyclesCarry: z.number().optional(),
  accruedSpentCarry: z.number().optional(),
  isActive: z.boolean().optional(),
  endedAt: z.string().nullable().optional(),
  purpose: z.string().optional(),
  quickCancelUrl: z.string().optional(),
  reviewReminderDate: z.string().nullable().optional(),
  lastUsedAt: z.string().nullable().optional(),
  notes: z.string().optional(),
});

type StoredSubscription = z.infer<typeof StoredSubscriptionSchema>;

// ─── Store interface ──────────────────────────────────────────────────────────

interface StoreState {
  subscriptions: Subscription[];
  currency: Currency;
  locale: Locale;
  themeMode: ThemeMode;
  t: Translations;
  hasOnboarded: boolean;
  addSubscription: (sub: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, sub: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  toggleActive: (id: string) => void;
  markSubscriptionUsed: (id: string, usedAt?: string) => void;
  snoozeReviewReminder: (id: string, months: number) => void;
  resetAllData: () => void;
  setOnboarded: () => void;
  setCurrency: (currency: Currency) => void;
  setLocale: (locale: Locale) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  toggleThemeMode: () => void;
  loadDemoSubscriptions: () => void;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'subpurge_subscriptions';
const CURRENCY_KEY = 'subpurge_currency';
const LOCALE_KEY = 'subpurge_locale';
const THEME_KEY = 'subpurge_theme_mode';
const ONBOARDED_KEY = 'subpurge_onboarded';

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── Demo copy ────────────────────────────────────────────────────────────────

const DEMO_COPY: Record<Locale, {
  spotifyPurpose: string; spotifyNotes: string;
  chatgptPurpose: string; chatgptNotes: string;
  netflixPurpose: string; netflixNotes: string;
  youtubePurpose: string; youtubeNotes: string;
}> = {
  tr: {
    spotifyPurpose: 'Her an acip dinliyorum', spotifyNotes: 'Demo: 3 haftadir aktif',
    chatgptPurpose: 'Arastirma ve is akislarim icin', chatgptNotes: 'Demo: 3 tam aylik dongu',
    netflixPurpose: 'Sadece aile plani aktif', netflixNotes: 'Demo: 1 tam yillik dongu',
    youtubePurpose: 'Sadece bir dizi icin acilmisti', youtubeNotes: 'Demo: sonlandirilmis ve toplam harcama dondurulmus',
  },
  en: {
    spotifyPurpose: 'I open it constantly to listen', spotifyNotes: 'Demo: active for 3 weeks',
    chatgptPurpose: 'For research and work workflows', chatgptNotes: 'Demo: 3 full monthly cycles',
    netflixPurpose: 'Only the family plan is still active', netflixNotes: 'Demo: 1 full yearly cycle',
    youtubePurpose: 'It had only been opened for one show', youtubeNotes: 'Demo: terminated and total spend frozen',
  },
  es: {
    spotifyPurpose: 'Lo abro constantemente para escuchar', spotifyNotes: 'Demo: activo durante 3 semanas',
    chatgptPurpose: 'Para investigacion y flujos de trabajo', chatgptNotes: 'Demo: 3 ciclos mensuales completos',
    netflixPurpose: 'Solo sigue activo el plan familiar', netflixNotes: 'Demo: 1 ciclo anual completo',
    youtubePurpose: 'Solo se habia activado por una serie', youtubeNotes: 'Demo: cancelado y gasto total congelado',
  },
  de: {
    spotifyPurpose: 'Ich nutze es standig zum Horen', spotifyNotes: 'Demo: seit 3 Wochen aktiv',
    chatgptPurpose: 'Fur Recherche und Arbeitsablaufe', chatgptNotes: 'Demo: 3 volle Monatszyklen',
    netflixPurpose: 'Nur der Familienplan ist noch aktiv', netflixNotes: 'Demo: 1 voller Jahreszyklus',
    youtubePurpose: 'Es war nur fur eine Serie aktiv', youtubeNotes: 'Demo: beendet und Gesamtausgaben eingefroren',
  },
  fr: {
    spotifyPurpose: "Je l'ouvre constamment pour ecouter", spotifyNotes: 'Demo : actif depuis 3 semaines',
    chatgptPurpose: 'Pour la recherche et mes flux de travail', chatgptNotes: 'Demo : 3 cycles mensuels complets',
    netflixPurpose: 'Seul le forfait familial reste actif', netflixNotes: 'Demo : 1 cycle annuel complet',
    youtubePurpose: "Il avait seulement ete active pour une serie", youtubeNotes: 'Demo : resilie et depense totale figee',
  },
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

function persistItem(key: string, value: string, errorMessage: string) {
  void AsyncStorage.setItem(key, value).catch(err => console.error(errorMessage, err));
}

function getDeviceLocale(): Locale {
  try {
    const lang = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0];
    return isLocale(lang) ? lang : 'en';
  } catch {
    return 'en';
  }
}

function findPresetByName(name: string) {
  return SERVICE_PRESETS.find(s => s.name === name);
}

function getPresetPlanPrice(
  preset: ReturnType<typeof SERVICE_PRESETS.find>,
  planId: string,
  fallback: number,
): number {
  return preset?.plans?.find(p => p.id === planId)?.price ?? fallback;
}

function settleSubscriptionHistory(subscription: Subscription, settledAtISO: string) {
  const unsettled = getCompletedCycleCountBetween(
    subscription.currentPeriodStart,
    settledAtISO,
    subscription.billingCycle,
  );
  return {
    completedCyclesCarry: subscription.completedCyclesCarry + unsettled,
    accruedSpentCarry: subscription.accruedSpentCarry + unsettled * subscription.price,
    currentPeriodStart: settledAtISO,
  };
}

/**
 * Hydrates a raw stored object into a full Subscription.
 * Relies on Zod pre-validation so all fields are typed.
 */
function normalizeSubscription(raw: StoredSubscription, referenceNowISO: string): Subscription {
  const preset = findPresetByName(raw.name);
  const fallbackDate = formatDateInput(referenceNowISO);
  const startDate = raw.startDate ? formatDateInput(raw.startDate) || fallbackDate : fallbackDate;
  const isActive = raw.isActive !== false;
  const endedAt = typeof raw.endedAt === 'string' ? raw.endedAt : isActive ? null : referenceNowISO;
  const trackingType: TrackingType = raw.trackingType === 'expiry' ? 'expiry' : 'renewal';
  const nextBillingDate = typeof raw.nextBillingDate === 'string'
    ? formatDateInput(raw.nextBillingDate) || null
    : trackingType === 'renewal'
      ? getUpcomingBillingDate(startDate, raw.billingCycle, new Date(referenceNowISO))
      : null;
  const expiryDate = typeof raw.expiryDate === 'string' ? formatDateInput(raw.expiryDate) || null : null;
  const reviewReminderDate = typeof raw.reviewReminderDate === 'string' ? formatDateInput(raw.reviewReminderDate) || null : null;
  const inferredPlan = findPlanTemplate({
    name: raw.name,
    planTemplateId: raw.planTemplateId ?? null,
    billingCycle: raw.billingCycle,
    price: raw.price,
  });
  const lastUsedAt = typeof raw.lastUsedAt === 'string'
    ? formatDateInput(raw.lastUsedAt) || null
    : isActive ? startDate : null;

  return {
    id: raw.id,
    name: raw.name,
    color: raw.color,
    icon: raw.icon,
    logoUrl: raw.logoUrl,
    manageDeepLink: raw.manageDeepLink ?? preset?.manageDeepLink,
    planTemplateId: inferredPlan?.id ?? null,
    price: raw.price,
    billingCycle: raw.billingCycle,
    startDate,
    trackingType,
    nextBillingDate,
    expiryDate,
    currentPeriodStart: raw.currentPeriodStart ?? startDate,
    completedCyclesCarry: raw.completedCyclesCarry ?? 0,
    accruedSpentCarry: raw.accruedSpentCarry ?? 0,
    isActive,
    endedAt,
    purpose: raw.purpose,
    quickCancelUrl: raw.quickCancelUrl ?? preset?.quickCancelUrl,
    reviewReminderDate,
    lastUsedAt,
    notes: raw.notes,
  };
}

function createDemoSubscriptions(locale: Locale, now = new Date()): Subscription[] {
  const isoDaysAgo = (days: number) => new Date(now.getTime() - days * DAY_MS).toISOString();
  const getPreset = (name: string) => SERVICE_PRESETS.find(s => s.name === name);
  const copy = DEMO_COPY[locale] ?? DEMO_COPY.en;
  const netflix = getPreset('Netflix');
  const spotify = getPreset('Spotify');
  const chatgpt = getPreset('ChatGPT Plus');
  const youtube = getPreset('YouTube Premium');

  return [
    {
      id: 'demo-weekly-spotify', name: 'Spotify',
      color: spotify?.color ?? '#1DB954', icon: spotify?.icon ?? '🎵',
      logoUrl: spotify?.logoUrl, manageDeepLink: spotify?.manageDeepLink,
      planTemplateId: 'individual', price: getPresetPlanPrice(spotify, 'individual', 99),
      billingCycle: 'weekly', startDate: formatDateInput(isoDaysAgo(21)),
      trackingType: 'renewal',
      nextBillingDate: getUpcomingBillingDate(formatDateInput(isoDaysAgo(21)), 'weekly', now),
      expiryDate: null, currentPeriodStart: isoDaysAgo(21),
      completedCyclesCarry: 0, accruedSpentCarry: 0, isActive: true, endedAt: null,
      purpose: copy.spotifyPurpose, quickCancelUrl: spotify?.quickCancelUrl,
      reviewReminderDate: formatDateInput(now), lastUsedAt: formatDateInput(now),
      notes: copy.spotifyNotes,
    },
    {
      id: 'demo-monthly-chatgpt', name: 'ChatGPT Plus',
      color: chatgpt?.color ?? '#10A37F', icon: chatgpt?.icon ?? '🤖',
      logoUrl: chatgpt?.logoUrl, manageDeepLink: chatgpt?.manageDeepLink,
      planTemplateId: 'plus', price: getPresetPlanPrice(chatgpt, 'plus', 749),
      billingCycle: 'monthly', startDate: formatDateInput(isoDaysAgo(95)),
      trackingType: 'renewal',
      nextBillingDate: getUpcomingBillingDate(formatDateInput(isoDaysAgo(95)), 'monthly', now),
      expiryDate: null, currentPeriodStart: isoDaysAgo(95),
      completedCyclesCarry: 0, accruedSpentCarry: 0, isActive: true, endedAt: null,
      purpose: copy.chatgptPurpose, quickCancelUrl: chatgpt?.quickCancelUrl,
      reviewReminderDate: formatDateInput(now),
      lastUsedAt: formatDateInput(new Date(now.getTime() - 9 * DAY_MS)),
      notes: copy.chatgptNotes,
    },
    {
      id: 'demo-yearly-netflix', name: 'Netflix',
      color: netflix?.color ?? '#E50914', icon: netflix?.icon ?? '🎬',
      logoUrl: netflix?.logoUrl, manageDeepLink: netflix?.manageDeepLink,
      planTemplateId: null, price: 2399,
      billingCycle: 'yearly', startDate: formatDateInput(isoDaysAgo(410)),
      trackingType: 'renewal',
      nextBillingDate: getUpcomingBillingDate(formatDateInput(isoDaysAgo(410)), 'yearly', now),
      expiryDate: null, currentPeriodStart: isoDaysAgo(410),
      completedCyclesCarry: 0, accruedSpentCarry: 0, isActive: true, endedAt: null,
      purpose: copy.netflixPurpose, quickCancelUrl: netflix?.quickCancelUrl,
      reviewReminderDate: getUpcomingBillingDate(formatDateInput(isoDaysAgo(350)), 'monthly', now),
      lastUsedAt: formatDateInput(new Date(now.getTime() - 46 * DAY_MS)),
      notes: copy.netflixNotes,
    },
    {
      id: 'demo-ended-youtube', name: 'YouTube Premium',
      color: youtube?.color ?? '#FF0000', icon: youtube?.icon ?? '▶️',
      logoUrl: youtube?.logoUrl, manageDeepLink: youtube?.manageDeepLink,
      planTemplateId: 'family', price: getPresetPlanPrice(youtube, 'family', 159.99),
      billingCycle: 'monthly', startDate: formatDateInput(isoDaysAgo(132)),
      trackingType: 'expiry', nextBillingDate: null,
      expiryDate: formatDateInput(isoDaysAgo(42)),
      currentPeriodStart: isoDaysAgo(132),
      completedCyclesCarry: 0, accruedSpentCarry: 0, isActive: false,
      endedAt: isoDaysAgo(42),
      purpose: copy.youtubePurpose, quickCancelUrl: youtube?.quickCancelUrl,
      reviewReminderDate: null, lastUsedAt: null,
      notes: copy.youtubeNotes,
    },
  ];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSubscriptionStore(): StoreState {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);
  const [locale, setLocaleState] = useState<Locale>(getDeviceLocale());
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [hasOnboarded, setHasOnboardedState] = useState(false);

  useEffect(() => {
    void (async () => {
      // ── Subscriptions (Zod-validated) ──
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (!Array.isArray(parsed)) throw new Error('Payload is not an array');

          const referenceNowISO = new Date().toISOString();
          const normalized: Subscription[] = [];

          for (const item of parsed) {
            const result = StoredSubscriptionSchema.safeParse(item);
            if (result.success) {
              normalized.push(normalizeSubscription(result.data, referenceNowISO));
            } else {
              console.warn('Skipping invalid subscription entry', result.error.flatten());
            }
          }

          setSubscriptions(normalized);
          persistItem(STORAGE_KEY, JSON.stringify(normalized), 'Failed to persist normalized subscriptions');
        } catch (err) {
          console.error('Failed to load subscriptions', err);
          void AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        }
      }

      // ── Currency ──
      const cur = await AsyncStorage.getItem(CURRENCY_KEY);
      if (cur) {
        try { setCurrencyState(JSON.parse(cur)); } catch { void AsyncStorage.removeItem(CURRENCY_KEY); }
      }

      // ── Locale ──
      const loc = await AsyncStorage.getItem(LOCALE_KEY);
      if (loc && isLocale(loc)) {
        setLocaleState(loc);
      } else if (loc) {
        void AsyncStorage.removeItem(LOCALE_KEY).catch(() => {});
      }

      // ── Theme ──
      const theme = await AsyncStorage.getItem(THEME_KEY);
      if (theme === 'dark' || theme === 'light') setThemeModeState(theme);

      // ── Onboarded ──
      const onboarded = await AsyncStorage.getItem(ONBOARDED_KEY);
      if (onboarded === '1') setHasOnboardedState(true);

      // ── Pricing update (arka planda, UI'yi bloklamaz) ──
      void import('../utils/pricingUpdater').then(m => m.fetchAndCachePricing());
    })();
  }, []);

  const save = (subs: Subscription[]) => {
    setSubscriptions(subs);
    persistItem(STORAGE_KEY, JSON.stringify(subs), 'Failed to save subscriptions');
  };

  const addSubscription = (sub: Omit<Subscription, 'id'>) => {
    save([...subscriptions, { ...sub, id: Date.now().toString() }]);
  };

  const updateSubscription = (id: string, updates: Partial<Subscription>) => {
    const editedAtISO = new Date().toISOString();
    save(subscriptions.map(sub => {
      if (sub.id !== id) return sub;
      if (typeof updates.startDate === 'string' && updates.startDate !== sub.startDate) {
        return { ...sub, ...updates, currentPeriodStart: updates.startDate, completedCyclesCarry: 0, accruedSpentCarry: 0 };
      }
      const priceChanged = typeof updates.price === 'number' && updates.price !== sub.price;
      const cycleChanged = typeof updates.billingCycle === 'string' && updates.billingCycle !== sub.billingCycle;
      if (!priceChanged && !cycleChanged) return { ...sub, ...updates };
      const settledAt = sub.isActive ? editedAtISO : (sub.endedAt ?? editedAtISO);
      return { ...sub, ...settleSubscriptionHistory(sub, settledAt), ...updates, currentPeriodStart: settledAt };
    }));
  };

  const deleteSubscription = (id: string) => { save(subscriptions.filter(s => s.id !== id)); };

  const toggleActive = (id: string) => {
    const now = new Date().toISOString();
    save(subscriptions.map(sub => {
      if (sub.id !== id) return sub;
      if (sub.isActive) {
        return { ...sub, ...settleSubscriptionHistory(sub, now), isActive: false, endedAt: now };
      }
      return { ...sub, isActive: true, currentPeriodStart: now, endedAt: null };
    }));
  };

  const markSubscriptionUsed = (id: string, usedAt = formatDateInput(new Date())) => {
    save(subscriptions.map(s => s.id === id ? { ...s, lastUsedAt: usedAt } : s));
  };

  const snoozeReviewReminder = (id: string, months: number) => {
    const newDate = addMonthsToDateValue(formatDateInput(new Date()), months);
    save(subscriptions.map(s => s.id === id ? { ...s, reviewReminderDate: newDate } : s));
  };

  const resetAllData = () => {
    save([]);
    setCurrencyState(DEFAULT_CURRENCY);
    setLocaleState(getDeviceLocale());
    setThemeModeState('dark');
    void Promise.all([
      AsyncStorage.removeItem(CURRENCY_KEY),
      AsyncStorage.removeItem(LOCALE_KEY),
      AsyncStorage.setItem(THEME_KEY, 'dark'),
    ]).catch(err => console.error('Failed to reset data', err));
  };

  const setOnboarded = () => {
    setHasOnboardedState(true);
    persistItem(ONBOARDED_KEY, '1', 'Failed to save onboarded state');
  };

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    persistItem(CURRENCY_KEY, JSON.stringify(c), 'Failed to save currency');
  };

  const setLocale = (l: Locale) => {
    const next = isLocale(l) ? l : 'tr';
    setLocaleState(next);
    persistItem(LOCALE_KEY, next, 'Failed to save locale');
  };

  const setThemeMode = (next: ThemeMode) => {
    setThemeModeState(next);
    persistItem(THEME_KEY, next, 'Failed to save theme mode');
  };

  const toggleThemeMode = () => setThemeMode(themeMode === 'dark' ? 'light' : 'dark');

  const loadDemoSubscriptions = () => { save(createDemoSubscriptions(locale)); };

  return {
    subscriptions, currency, locale, themeMode, hasOnboarded,
    t: TRANSLATIONS[locale],
    addSubscription, updateSubscription, deleteSubscription, toggleActive,
    markSubscriptionUsed, snoozeReviewReminder, resetAllData, setOnboarded,
    setCurrency, setLocale, setThemeMode, toggleThemeMode, loadDemoSubscriptions,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const StoreContext = createContext<StoreState | null>(null);

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
