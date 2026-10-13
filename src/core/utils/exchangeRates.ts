import { storage as AsyncStorage } from '../../platform/storage';

const RATES_KEY = 'subpurge_exchange_rates';
const RATES_TTL_MS = 6 * 60 * 60 * 1000; // 6 saat

interface RatesCache {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

let memCache: RatesCache | null = null;

export async function getExchangeRates(base: string): Promise<Record<string, number>> {
  if (memCache && memCache.base === base && Date.now() - memCache.fetchedAt < RATES_TTL_MS) {
    return memCache.rates;
  }

  const stored = await AsyncStorage.getItem(RATES_KEY);
  if (stored) {
    const parsed: RatesCache = JSON.parse(stored);
    if (parsed.base === base && Date.now() - parsed.fetchedAt < RATES_TTL_MS) {
      memCache = parsed;
      return parsed.rates;
    }
  }

  try {
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}`);
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json() as { rates: Record<string, number> };
    const cache: RatesCache = { base, rates: { ...data.rates, [base]: 1 }, fetchedAt: Date.now() };
    memCache = cache;
    await AsyncStorage.setItem(RATES_KEY, JSON.stringify(cache));
    return cache.rates;
  } catch {
    return memCache?.rates ?? {};
  }
}

export function convertAmount(amount: number, fromCode: string, toCode: string, rates: Record<string, number>): number {
  if (fromCode === toCode) return amount;
  const fromRate = rates[fromCode] ?? 1;
  const toRate = rates[toCode] ?? 1;
  // rates are relative to base; convert via base
  const baseAmount = fromRate === 1 ? amount : amount / fromRate;
  return baseAmount * toRate;
}
