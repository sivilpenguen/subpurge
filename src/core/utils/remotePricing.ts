/**
 * Country price files built weekly by .github/workflows/update-pricing.yml
 * (data/pricing/<cc>.json): web prices and App Store prices per service.
 */
import { storage as AsyncStorage } from '../../platform/storage';

const REPO_PATH = 'sivilpenguen/subpurge@main/data/pricing';
// jsDelivr is a free CDN in front of GitHub; raw.githubusercontent is the fallback.
const SOURCES = (cc: string) => [
  `https://cdn.jsdelivr.net/gh/${REPO_PATH}/${cc}.json`,
  `https://raw.githubusercontent.com/sivilpenguen/subpurge/main/data/pricing/${cc}.json`,
];
const CACHE_PREFIX = 'pricing_v2_';
const TTL_MS = 24 * 60 * 60 * 1000;

export interface RemotePlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'weekly' | 'monthly' | 'yearly';
}

export interface CountryPricing {
  country: string;
  currency: string;
  updatedAt: string;
  services: Record<string, { web?: RemotePlan[]; appStore?: RemotePlan[] }>;
}

const SINGLE_COUNTRY: Record<string, string> = { TRY: 'tr', USD: 'us', GBP: 'gb', CAD: 'ca', AUD: 'au', MXN: 'mx', BRL: 'br' };
const EURO_FILES = new Set(['de', 'fr', 'es', 'it', 'nl']);

/** Which country file prices a currency; for the euro, the device's own country when we have it. */
export function pricingCountryFor(currencyCode: string, deviceRegion?: string): string | null {
  if (SINGLE_COUNTRY[currencyCode]) return SINGLE_COUNTRY[currencyCode];
  if (currencyCode === 'EUR') {
    const region = deviceRegion?.toLowerCase();
    return region && EURO_FILES.has(region) ? region : 'de';
  }
  return null;
}

export async function fetchCountryPricing(country: string): Promise<CountryPricing | null> {
  const cacheKey = CACHE_PREFIX + country;
  let cached: { data: CountryPricing; fetchedAt: number } | null = null;
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) cached = JSON.parse(raw);
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.data;
  } catch {}

  for (const url of SOURCES(country)) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = (await res.json()) as CountryPricing;
      if (!data?.services || !data.currency) continue;
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ data, fetchedAt: Date.now() }));
      return data;
    } catch {}
  }
  return cached?.data ?? null; // stale beats nothing when offline
}
