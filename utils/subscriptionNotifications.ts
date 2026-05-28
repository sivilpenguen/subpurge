import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Locale } from '../constants/i18n';
import { Subscription, getTrackedDate } from '../store/useSubscriptionStore';
import { parseDateValue } from './subscriptionDates';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOTIFICATION_CHANNEL_ID = 'subscription-reminders';
const NOTIFICATION_SOURCE = 'subscription-reminders';
const IMMEDIATE_CACHE_KEY = 'subpurge_notification_immediate_cache';
const INACTIVITY_DAYS = 7;
const TRACKED_DATE_REMINDER_DAYS = 4;
const DEFAULT_REMINDER_HOUR = 10;

type ReminderPlan = {
  fingerprint: string;
  triggerDate: Date;
  title: string;
  body: string;
  subscriptionId: string;
  kind: 'inactivity' | 'tracked-date';
};

type LocalizedCopy = {
  inactivityTitle: (name: string) => string;
  inactivityBody: string;
  renewalTitle: (name: string) => string;
  renewalBody: string;
  expiryTitle: (name: string) => string;
  expiryBody: string;
  testTitle: string;
  testInactivityBody: string;
  testTrackedDateBody: string;
};

type NotificationPermissionOptions = {
  requestPermissions?: boolean;
};

const COPY: Record<Locale, LocalizedCopy> = {
  tr: {
    inactivityTitle: name => `${name}'i 7 gündür kullanmıyorsun`,
    inactivityBody: 'Purge zamanı geldi mi?',
    renewalTitle: name => `${name} 4 gün sonra yenilenecek`,
    renewalBody: 'Devam etmek isteyip istemediğini kontrol et.',
    expiryTitle: name => `${name} 4 gün sonra bitecek`,
    expiryBody: 'Uzatmak mı purgelemek mi karar verme zamanı.',
    testTitle: 'SubPurge bildirim testi',
    testInactivityBody: '7 gün kullanılmama bildirimi hazır.',
    testTrackedDateBody: '4 gün kala hatırlatması hazır.',
  },
  en: {
    inactivityTitle: name => `You have not used ${name} for 7 days`,
    inactivityBody: 'Is it time to purge it?',
    renewalTitle: name => `${name} renews in 4 days`,
    renewalBody: 'Check whether you still want to keep it.',
    expiryTitle: name => `${name} ends in 4 days`,
    expiryBody: 'It is time to decide whether to extend or purge it.',
    testTitle: 'SubPurge notification test',
    testInactivityBody: '7-day inactivity reminder is ready.',
    testTrackedDateBody: '4-day reminder is ready.',
  },
  es: {
    inactivityTitle: name => `No usas ${name} desde hace 7 dias`,
    inactivityBody: 'Ya es momento de hacer purge?',
    renewalTitle: name => `${name} se renovara en 4 dias`,
    renewalBody: 'Comprueba si aun quieres mantenerlo.',
    expiryTitle: name => `${name} terminara en 4 dias`,
    expiryBody: 'Es momento de decidir si lo extiendes o lo purgas.',
    testTitle: 'Prueba de notificaciones SubPurge',
    testInactivityBody: 'El recordatorio de 7 dias esta listo.',
    testTrackedDateBody: 'El recordatorio de 4 dias esta listo.',
  },
  de: {
    inactivityTitle: name => `Du hast ${name} seit 7 Tagen nicht genutzt`,
    inactivityBody: 'Ist es Zeit fur einen Purge?',
    renewalTitle: name => `${name} erneuert sich in 4 Tagen`,
    renewalBody: 'Prufe, ob du das Abo behalten willst.',
    expiryTitle: name => `${name} endet in 4 Tagen`,
    expiryBody: 'Zeit zu entscheiden, ob du es verlangerst oder purgst.',
    testTitle: 'SubPurge Benachrichtigungstest',
    testInactivityBody: 'Die 7-Tage-Erinnerung ist bereit.',
    testTrackedDateBody: 'Die 4-Tage-Erinnerung ist bereit.',
  },
  fr: {
    inactivityTitle: name => `Tu n'as pas utilise ${name} depuis 7 jours`,
    inactivityBody: 'Est-ce le moment de le purger ?',
    renewalTitle: name => `${name} sera renouvelle dans 4 jours`,
    renewalBody: 'Verifie si tu veux toujours le garder.',
    expiryTitle: name => `${name} se termine dans 4 jours`,
    expiryBody: "C'est le moment de decider si tu le prolonges ou le purges.",
    testTitle: 'Test de notification SubPurge',
    testInactivityBody: 'Le rappel de 7 jours est pret.',
    testTrackedDateBody: 'Le rappel des 4 jours est pret.',
  },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + (days * DAY_MS));
}

function atReminderHour(date: Date): Date {
  const next = new Date(date);
  next.setHours(DEFAULT_REMINDER_HOUR, 0, 0, 0);
  return next;
}

function getCopy(locale: Locale): LocalizedCopy {
  return COPY[locale] ?? COPY.en;
}

async function ensureNotificationSupportAsync(options: NotificationPermissionOptions = {}): Promise<boolean> {
  const { requestPermissions = false } = options;
  if (Platform.OS === 'web') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Subscription reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  const existingPermissions = await Notifications.getPermissionsAsync();
  if (existingPermissions.granted) {
    return true;
  }

  if (!requestPermissions) {
    return false;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync();
  return requestedPermissions.granted;
}

async function readImmediateCacheAsync() {
  try {
    const raw = await AsyncStorage.getItem(IMMEDIATE_CACHE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, true>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

async function writeImmediateCacheAsync(cache: Record<string, true>) {
  await AsyncStorage.setItem(IMMEDIATE_CACHE_KEY, JSON.stringify(cache));
}

function createInactivityReminder(subscription: Subscription, locale: Locale): ReminderPlan | null {
  if (!subscription.isActive || !subscription.lastUsedAt) {
    return null;
  }

  const lastUsedDate = parseDateValue(subscription.lastUsedAt);
  if (Number.isNaN(lastUsedDate.getTime())) {
    return null;
  }

  const triggerDate = atReminderHour(addDays(lastUsedDate, INACTIVITY_DAYS));
  const copy = getCopy(locale);

  return {
    fingerprint: `${subscription.id}:inactivity:${subscription.lastUsedAt}`,
    triggerDate,
    title: copy.inactivityTitle(subscription.name),
    body: copy.inactivityBody,
    subscriptionId: subscription.id,
    kind: 'inactivity',
  };
}

function createTrackedDateReminder(subscription: Subscription, locale: Locale): ReminderPlan | null {
  if (!subscription.isActive) {
    return null;
  }

  const trackedDate = getTrackedDate(subscription);
  if (!trackedDate) {
    return null;
  }

  const targetDate = parseDateValue(trackedDate);
  if (Number.isNaN(targetDate.getTime())) {
    return null;
  }

  const triggerDate = atReminderHour(addDays(targetDate, -TRACKED_DATE_REMINDER_DAYS));
  const copy = getCopy(locale);

  return {
    fingerprint: `${subscription.id}:tracked-date:${trackedDate}:${subscription.trackingType}`,
    triggerDate,
    title: subscription.trackingType === 'expiry'
      ? copy.expiryTitle(subscription.name)
      : copy.renewalTitle(subscription.name),
    body: subscription.trackingType === 'expiry'
      ? copy.expiryBody
      : copy.renewalBody,
    subscriptionId: subscription.id,
    kind: 'tracked-date',
  };
}

async function scheduleReminderAsync(reminder: ReminderPlan) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.body,
      sound: 'default',
      data: {
        source: NOTIFICATION_SOURCE,
        fingerprint: reminder.fingerprint,
        subscriptionId: reminder.subscriptionId,
        kind: reminder.kind,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminder.triggerDate,
    },
  });
}

export async function syncSubscriptionNotificationsAsync(
  subscriptions: Subscription[],
  locale: Locale,
  options: NotificationPermissionOptions = {},
): Promise<boolean> {
  const supported = await ensureNotificationSupportAsync(options);
  if (!supported) {
    return false;
  }

  const now = new Date();
  const desiredReminders = subscriptions
    .filter(subscription => subscription.isActive)
    .flatMap(subscription => {
      const reminders = [
        createInactivityReminder(subscription, locale),
        createTrackedDateReminder(subscription, locale),
      ];

      return reminders.filter((reminder): reminder is ReminderPlan => (
        reminder !== null && reminder.triggerDate.getTime() > now.getTime()
      ));
    });

  const desiredFingerprints = new Set(desiredReminders.map(reminder => reminder.fingerprint));
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const scheduledSubscriptionNotifications = scheduledNotifications.filter(request => (
    request.content.data?.source === NOTIFICATION_SOURCE
  ));
  const scheduledFingerprintToId = new Map(
    scheduledSubscriptionNotifications
      .map(request => {
        const fingerprint = request.content.data?.fingerprint;
        return typeof fingerprint === 'string' ? [fingerprint, request.identifier] as const : null;
      })
      .filter((entry): entry is readonly [string, string] => entry !== null),
  );

  await Promise.all(
    scheduledSubscriptionNotifications
      .filter(request => {
        const fingerprint = request.content.data?.fingerprint;
        return typeof fingerprint === 'string' && !desiredFingerprints.has(fingerprint);
      })
      .map(request => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );

  for (const reminder of desiredReminders) {
    if (!scheduledFingerprintToId.has(reminder.fingerprint)) {
      await scheduleReminderAsync(reminder);
    }
  }

  const immediateCache = await readImmediateCacheAsync();
  const nextCacheEntries = Object.entries(immediateCache)
    .filter(([fingerprint]) => desiredFingerprints.has(fingerprint));
  await writeImmediateCacheAsync(Object.fromEntries(nextCacheEntries));

  return true;
}

export async function scheduleNotificationTestAsync(locale: Locale): Promise<boolean> {
  const supported = await ensureNotificationSupportAsync({ requestPermissions: true });
  if (!supported) {
    return false;
  }

  const copy = getCopy(locale);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.testTitle,
      body: copy.testInactivityBody,
      sound: 'default',
      data: {
        source: NOTIFICATION_SOURCE,
        fingerprint: `test-inactivity-${Date.now()}`,
        kind: 'inactivity',
      },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.testTitle,
      body: copy.testTrackedDateBody,
      sound: 'default',
      data: {
        source: NOTIFICATION_SOURCE,
        fingerprint: `test-tracked-date-${Date.now()}`,
        kind: 'tracked-date',
      },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10 },
  });

  return true;
}
