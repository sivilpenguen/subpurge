import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'subpurge_pricing_tr';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

// GitHub repo'nuzun raw URL'i — kendi repo adresinizle değiştirin
const PRICING_URL =
  'https://raw.githubusercontent.com/sivilpenguen/subpurge/main/data/pricing-tr.json';

interface CachedPricing {
  fetchedAt: number;
  data: unknown;
}

export async function fetchAndCachePricing(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: CachedPricing = JSON.parse(raw);
      const age = Date.now() - cached.fetchedAt;
      if (age < CACHE_TTL_MS) return; // Cache taze, güncelleme gerek yok
    }
  } catch {
    // Cache okunamazsa devam et, yeniden çek
  }

  try {
    const res = await fetch(PRICING_URL, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const entry: CachedPricing = { fetchedAt: Date.now(), data };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ağ hatası — APK'ya gömülü versiyon kullanılmaya devam eder
  }
}

export async function getCachedPricing(): Promise<unknown | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedPricing = JSON.parse(raw);
    return cached.data;
  } catch {
    return null;
  }
}
