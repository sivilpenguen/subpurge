import AsyncStorage from '@react-native-async-storage/async-storage';

const REMOTE_URL =
  'https://raw.githubusercontent.com/sivilpenguen/subpurge/main/data/pricing-tr.json';
const CACHE_KEY = 'remote_pricing_tr_v1';
const TTL_MS = 24 * 60 * 60 * 1000;

export interface RemotePricingPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
}

export interface RemotePricingData {
  country: string;
  currency: string;
  updatedAt: string;
  services: Record<string, { plans: RemotePricingPlan[] }>;
}

export async function fetchRemotePricing(): Promise<RemotePricingData | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, fetchedAt } = JSON.parse(cached) as {
        data: RemotePricingData;
        fetchedAt: number;
      };
      if (Date.now() - fetchedAt < TTL_MS) return data;
    }
  } catch {}

  try {
    const res = await fetch(REMOTE_URL);
    if (!res.ok) return null;
    const data = (await res.json()) as RemotePricingData;
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, fetchedAt: Date.now() }),
    );
    return data;
  } catch {
    return null;
  }
}
