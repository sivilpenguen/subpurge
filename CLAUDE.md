# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Vite dev server (browser)
npm run build          # Typecheck + production build into dist/
npm run ios            # build + npx cap sync ios (then open ios/App/App.xcodeproj or build via xcodebuild)
npm test               # Node test runner with tsx (tests/*.test.ts)
npm run pricing:tr     # Scrape Turkish pricing data into data/pricing-tr.json
```

Single test file: `node --import tsx --test tests/subscriptionDates.test.ts`

## Architecture

**Subpurge** is a subscription tracker: React 19 + Vite, wrapped for iOS with Capacitor 8 (bundle id `com.rakuappdigital.subpurge`, team `JF86RYY9ZS`). No backend; all data is local. It was an Expo/React Native app until October 2026 (see git history before the `capacitor` branch).

```
src/core/      pure logic, no DOM/Capacitor UI — safe for tests
  constants/   services (presets + TR plans), currencies, i18n (TRANSLATIONS) + i18nExtra (strings added in the rewrite)
  store/       subscriptionTypes, subscriptionCalculations, subscriptionFilters, logic.ts (barrel tests import),
               useSubscriptionStore.ts (React state + persistence + Zod hydration)
  utils/       subscriptionDates, subscriptionSummary, exchangeRates (Frankfurter), remotePricing (GitHub raw JSON)
src/platform/  Capacitor wrappers: storage (Preferences, AsyncStorage-shaped), notifications (LocalNotifications),
               backup (Filesystem + Share export, <input type=file> import), native (links, haptics, status bar)
src/ui/        shell.tsx (dialog, undo toast, page stack, Sheet), screens/, components/, styles.css (design tokens)
src/App.tsx    tabs (home / purge / settings), onboarding + coach-mark tour, theme + notification sync
```

### State: `src/core/store/useSubscriptionStore.ts`

Single hook exposed via `StoreContext` / `useStore()`. Mutations use functional updates (`update(fn)`), so back-to-back actions never read a stale list. `t` is `TRANSLATIONS[locale]` merged with `EXTRA_TRANSLATIONS[locale]`. `restoreSubscription(snapshot, index)` backs the undo toast.

Storage keys are unchanged from the Expo version (`subpurge_subscriptions`, `subpurge_currency`, …); on iOS they live in UserDefaults as `CapacitorStorage.<key>`.

### Currency model

Every subscription carries `currencyCode` (the currency it was entered in). The settings currency is the *display* currency: totals convert via `convertAmount` with EUR-based Frankfurter rates; row prices show the subscription's own symbol. Hydration fills a missing `currencyCode` with the stored display currency (older builds dropped the field on load).

### Subscription data model

`trackingType: 'renewal' | 'expiry'` — renewal has `nextBillingDate`, expiry has `expiryDate`. Spend history accumulates in `completedCyclesCarry` / `accruedSpentCarry`, settled whenever price, cycle or active state changes. Dates are `YYYY-MM-DD` strings parsed at local noon (see `subscriptionDates.ts`).

### Notifications

`planReminders` (pure, tested) yields an inactivity reminder (7 days after last use) and a tracked-date reminder (4 days before) per active subscription, at 10:00. `syncSubscriptionNotificationsAsync` diffs pending notifications by a hashed numeric id of the fingerprint. Permission is requested only when the first subscription is saved or the test button is used.

### UI conventions

- Styling is plain CSS in `src/ui/styles.css` with tokens under `[data-theme='dark'|'light']`. Money uses `.num` / monospace tabular figures; red is reserved for purge/destructive actions.
- Format money with `money(amount, symbol, locale)` from `src/ui/format.ts`, never `toFixed`.
- New user-facing strings go into `i18nExtra.ts` for all five locales (tr, en, es, de, fr).
- Service logos: `public/logos/*.png`, mapped in `components/ServiceLogo.tsx`; fallback is a coloured monogram.

### iOS

`ios/App` is committed. `PrivacyInfo.xcprivacy` declares UserDefaults (CA92.1) and file timestamps (C617.1). iPhone-only, portrait. App icon source: `resources/app-icon-1024.png` (badger on cream). For CLI archive/upload see the team's App Store Connect API key workflow (manual Release signing).
