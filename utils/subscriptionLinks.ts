import { Linking } from 'react-native';

export async function openSubscriptionLink(primaryUrl?: string | null, fallbackUrl?: string | null): Promise<boolean> {
  const candidates = [primaryUrl, fallbackUrl].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    try {
      await Linking.openURL(candidate);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}
