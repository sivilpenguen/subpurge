# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run in browser
npm run lint           # ESLint
npm test               # Run tests (Node test runner with tsx)
npm run pricing:tr     # Scrape Turkish pricing data into data/pricing-tr.json
```

## Architecture

**Subpurge** is an Expo/React Native subscription tracker. It uses Expo Router (file-based routing) and stores all state in a single React Context + AsyncStorage store — no external backend.

### State management: `store/useSubscriptionStore.ts`

The entire app state lives here. `useSubscriptionStore()` is a custom hook that manages subscriptions, currency, locale, and theme via `useState` + `AsyncStorage`. It is exposed via `StoreContext`, and all screens access it with `useStore()`.

Key business logic also lives in this file:
- **`getCompletedCycleCount` / `getSubscriptionTotalSpent`**: computed from `completedCyclesCarry + unsettled cycles since currentPeriodStart`
- **`getCurrentCycleProratedSpent`**: time-weighted cost within the current billing window
- **`settleSubscriptionHistory`**: called on price/cycle change or deactivation — freezes accrued history into carry fields and resets `currentPeriodStart`
- **`getTrackedDate`**: returns `nextBillingDate` (renewal) or `expiryDate` (expiry) depending on `trackingType`
- **`getDueReviewSubscriptions` / `getInactiveSubscriptions` / `getPriceIncreaseSubscriptions`**: filter helpers used by the Purge Mode screen

### Subscription data model

Each `Subscription` has two tracking modes (`trackingType: 'renewal' | 'expiry'`):
- **renewal**: recurring, has `nextBillingDate`, auto-advances on each cycle
- **expiry**: fixed-term (e.g. annual prepay), has `expiryDate`, doesn't auto-renew

Spend history is accumulated in two carry fields (`completedCyclesCarry`, `accruedSpentCarry`) that are settled and snapshotted whenever the price, billing cycle, or active state changes. This avoids recomputing full history from scratch on every render.

### Navigation

- `app/_layout.tsx` — root: wraps everything in `StoreProvider`, syncs notifications on subscription changes
- `app/(tabs)/` — three tabs: `index` (subscription list), `explore` (Purge Mode), `settings`
- `app/add-subscription.tsx` — modal for add/edit
- `app/summary.tsx` — summary/stats screen

### Constants & i18n

- `constants/services.ts` — `SERVICE_PRESETS`: list of known services with colors, icons, logo URLs, deep links, and `ServicePlanTemplate[]` for price-change detection
- `constants/currencies.ts` — supported currencies with symbols
- `constants/i18n.ts` — `TRANSLATIONS` object keyed by `Locale` (`tr | en | es | de | fr`); locale is auto-detected from device and stored in AsyncStorage
- `constants/theme.ts` — `getTheme(themeMode)` returns a typed theme object; `ThemeMode` is `'dark' | 'light'`

### Utils

- `utils/subscriptionDates.ts` — all date arithmetic; dates are stored as `YYYY-MM-DD` calendar strings, parsed at noon local time to avoid DST shifts; `getUpcomingBillingDate` advances from start date until a future date
- `utils/subscriptionSummary.ts` — `getSummaryTotals` for dashboard numbers
- `utils/subscriptionNotifications.ts` — schedules local notifications; synced in `NotificationSync` component on every subscription change
- `utils/subscriptionLinks.ts` — deep link / quick-cancel URL helpers

### Testing

Tests use Node's built-in test runner with `tsx` for TypeScript. Test files live in `tests/` and are named `*.test.ts`. Run a single test file:

```bash
node --import tsx --test tests/subscriptionDates.test.ts
```

### Local service logos

`constants/localLogos.ts` maps service names to bundled assets in `assets/logos/`. `components/ServiceLogo.tsx` uses this map with a fallback to Clearbit URLs from `SERVICE_PRESETS`.
