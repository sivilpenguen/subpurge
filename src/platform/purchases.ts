/**
 * Pro (one-time, non-consumable) through StoreKit 2 — the native
 * SubpurgeStore plugin in ios/App/App/SubpurgePlugins.swift. In the browser it
 * falls back to a local flag so the web build and tests still exercise the paywall.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { storage } from './storage';

interface SubpurgeStorePlugin {
  getProduct(options: { id: string }): Promise<{ id: string; price: string; title: string }>;
  purchase(options: { id: string }): Promise<{ state: 'purchased' | 'cancelled' | 'pending' | 'unavailable' | 'failed'; error?: string }>;
  restore(options: { id: string }): Promise<{ owned: boolean }>;
  isOwned(options: { id: string }): Promise<{ owned: boolean }>;
  addListener(event: 'entitlementChanged', listener: (data: { id: string; owned: boolean }) => void): Promise<{ remove: () => Promise<void> }>;
}

const Store = registerPlugin<SubpurgeStorePlugin>('SubpurgeStore');

export const PRO_PRODUCT_ID = 'com.rakuappdigital.subpurge.pro';
/** Active subscriptions allowed without Pro. */
export const FREE_ACTIVE_LIMIT = 3;

const PRO_KEY = 'subpurge_pro';
// Shown only until StoreKit returns the localized price; matches App Store Connect.
const FALLBACK_PRICE: Record<string, string> = { TRY: '₺179,99', USD: '$3.99', EUR: '3,99 €' };

const isNative = () => Capacitor.isNativePlatform();

async function setCached(value: boolean) {
  if (value) await storage.setItem(PRO_KEY, '1');
  else await storage.removeItem(PRO_KEY);
}

/** Cached flag first (instant, offline), then StoreKit's current entitlements. */
export async function loadProStatus(): Promise<boolean> {
  const cached = (await storage.getItem(PRO_KEY)) === '1';
  if (!isNative()) return cached;
  try {
    const { owned } = await Store.isOwned({ id: PRO_PRODUCT_ID });
    if (owned !== cached) await setCached(owned);
    return owned;
  } catch {
    return cached;
  }
}

export function fallbackProPrice(currencyCode: string): string {
  return FALLBACK_PRICE[currencyCode] ?? FALLBACK_PRICE.USD;
}

/** StoreKit's localized price string, or null when the store can't be reached. */
export async function fetchProPrice(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    return (await Store.getProduct({ id: PRO_PRODUCT_ID })).price;
  } catch {
    return null;
  }
}

export type PurchaseResult = 'purchased' | 'cancelled' | 'unavailable' | 'failed';

export async function purchasePro(): Promise<PurchaseResult> {
  if (!isNative()) {
    await setCached(true);
    return 'purchased';
  }
  try {
    const { state } = await Store.purchase({ id: PRO_PRODUCT_ID });
    if (state === 'purchased') {
      await setCached(true);
      return 'purchased';
    }
    // "pending" (Ask to Buy) is approved later and arrives through entitlementChanged.
    return state === 'pending' ? 'cancelled' : state;
  } catch {
    return 'failed';
  }
}

export async function restorePro(): Promise<boolean | 'unavailable'> {
  if (!isNative()) return (await storage.getItem(PRO_KEY)) === '1';
  try {
    const { owned } = await Store.restore({ id: PRO_PRODUCT_ID });
    await setCached(owned);
    return owned;
  } catch {
    return 'unavailable';
  }
}

/** Family Sharing, Ask to Buy approvals and refunds land here while the app runs. */
export function onProChanged(listener: (owned: boolean) => void): () => void {
  if (!isNative()) return () => {};
  const handle = Store.addListener('entitlementChanged', data => {
    if (data.id !== PRO_PRODUCT_ID) return;
    void setCached(data.owned);
    listener(data.owned);
  });
  return () => { void handle.then(h => h.remove()); };
}
