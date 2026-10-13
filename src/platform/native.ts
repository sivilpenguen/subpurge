/** Thin wrappers over Capacitor plugins that degrade gracefully in the browser. */
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import type { ThemeMode } from '../core/store/logic';

const isNative = Capacitor.isNativePlatform();

export async function openSubscriptionLink(primaryUrl?: string | null, fallbackUrl?: string | null): Promise<boolean> {
  const candidates = [primaryUrl, fallbackUrl].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    try {
      if (isNative) {
        const { completed } = await AppLauncher.openUrl({ url: candidate });
        if (completed) return true;
      } else if (/^https?:/i.test(candidate)) {
        window.open(candidate, '_blank', 'noopener');
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

export const haptic = {
  tap() {
    if (isNative) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  },
  medium() {
    if (isNative) void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
  },
  success() {
    if (isNative) void Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  },
  warning() {
    if (isNative) void Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
  },
};

export function syncStatusBar(mode: ThemeMode) {
  if (!isNative) return;
  // Style.Dark = light text, for dark backgrounds.
  void StatusBar.setStyle({ style: mode === 'dark' ? Style.Dark : Style.Light }).catch(() => {});
}
