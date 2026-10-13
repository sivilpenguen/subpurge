/**
 * Pro (one-time, non-consumable) via RevenueCat. With no API key, or in the
 * browser, it falls back to a local flag so the web build and tests still
 * exercise the paywall.
 */
import { Capacitor } from '@capacitor/core';
import { LOG_LEVEL, PRODUCT_CATEGORY, Purchases } from '@revenuecat/purchases-capacitor';
import { storage } from './storage';

/**
 * RevenueCat public key for the App Store app (Project Settings → API Keys,
 * starts with "appl_"). Empty until the app exists in App Store Connect and
 * RevenueCat.
 */
export const REVENUECAT_API_KEY = '';
export const PRO_PRODUCT_ID = 'com.rakuappdigital.subpurge.pro';
/** Active subscriptions allowed without Pro. */
export const FREE_ACTIVE_LIMIT = 6;

const PRO_KEY = 'subpurge_pro';
// Shown only until the store returns the real localized price. Must match App
// Store Connect: Turkey needs a manual price, otherwise Apple derives it from USD.
const FALLBACK_PRICE: Record<string, string> = { TRY: '₺149,99', USD: '$4.99' };

let configured = false;

function useRevenueCat(): boolean {
  return Capacitor.isNativePlatform() && REVENUECAT_API_KEY.length > 0;
}

async function configure(): Promise<boolean> {
  if (!useRevenueCat()) return false;
  if (configured) return true;
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    configured = true;
  } catch (err) {
    console.error('RevenueCat configure failed', err);
  }
  return configured;
}

async function ownsPro(): Promise<boolean> {
  const { customerInfo } = await Purchases.getCustomerInfo();
  return (customerInfo.nonSubscriptionTransactions ?? []).some(t => t.productIdentifier === PRO_PRODUCT_ID);
}

async function setCached(value: boolean) {
  if (value) await storage.setItem(PRO_KEY, '1');
  else await storage.removeItem(PRO_KEY);
}

/** Cached flag first (instant, offline), then the store's answer when available. */
export async function loadProStatus(): Promise<boolean> {
  const cached = (await storage.getItem(PRO_KEY)) === '1';
  if (!(await configure())) return cached;
  try {
    const owned = await ownsPro();
    if (owned !== cached) await setCached(owned);
    return owned;
  } catch {
    return cached;
  }
}

export function fallbackProPrice(currencyCode: string): string {
  return FALLBACK_PRICE[currencyCode] ?? FALLBACK_PRICE.USD;
}

/** The store's localized price string, or null when the store can't be reached. */
export async function fetchProPrice(): Promise<string | null> {
  if (!(await configure())) return null;
  try {
    const { products } = await Purchases.getProducts({ productIdentifiers: [PRO_PRODUCT_ID], type: PRODUCT_CATEGORY.NON_SUBSCRIPTION });
    return products[0]?.priceString ?? null;
  } catch {
    return null;
  }
}

export type PurchaseResult = 'purchased' | 'cancelled' | 'unavailable' | 'failed';

export async function purchasePro(): Promise<PurchaseResult> {
  if (!Capacitor.isNativePlatform()) {
    await setCached(true);
    return 'purchased';
  }
  if (!(await configure())) return 'unavailable';
  try {
    const { products } = await Purchases.getProducts({ productIdentifiers: [PRO_PRODUCT_ID], type: PRODUCT_CATEGORY.NON_SUBSCRIPTION });
    if (!products[0]) return 'unavailable';
    await Purchases.purchaseStoreProduct({ product: products[0] });
    await setCached(true);
    return 'purchased';
  } catch (err) {
    if ((err as { userCancelled?: boolean })?.userCancelled) return 'cancelled';
    console.error('Pro purchase failed', err);
    return 'failed';
  }
}

export async function restorePro(): Promise<boolean | 'unavailable'> {
  if (!(await configure())) return 'unavailable';
  try {
    await Purchases.restorePurchases();
    const owned = await ownsPro();
    await setCached(owned);
    return owned;
  } catch {
    return false;
  }
}
