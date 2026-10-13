import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Locale } from '../core/constants/i18n';
import { getTrackedDate } from '../core/store/logic';
import type { Subscription } from '../core/store/logic';
import { parseDateValue } from '../core/utils/subscriptionDates';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOTIFICATION_SOURCE = 'subscription-reminders';
// Test notifications use ids above this; reminder ids are hashed below it.
const TEST_ID_BASE = 2_000_000_000;
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

/** Stable positive int32 id for a reminder fingerprint (LocalNotifications needs numeric ids). */
export function reminderIdFor(fingerprint: string): number {
  let hash = 0;
  for (let index = 0; index < fingerprint.length; index++) {
    hash = (Math.imul(31, hash) + fingerprint.charCodeAt(index)) | 0;
  }
  return (Math.abs(hash) % (TEST_ID_BASE - 1)) + 1;
}

async function ensureNotificationSupportAsync(options: NotificationPermissionOptions = {}): Promise<boolean> {
  const { requestPermissions = false } = options;
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  const existingPermissions = await LocalNotifications.checkPermissions();
  if (existingPermissions.display === 'granted') {
    return true;
  }

  if (!requestPermissions || existingPermissions.display === 'denied') {
    return false;
  }

  const requestedPermissions = await LocalNotifications.requestPermissions();
  return requestedPermissions.display === 'granted';
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

export function planReminders(subscriptions: Subscription[], locale: Locale, now = new Date()): ReminderPlan[] {
  return subscriptions
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

  const desired = new Map(planReminders(subscriptions, locale).map(reminder => [reminderIdFor(reminder.fingerprint), reminder]));
  const { notifications: pending } = await LocalNotifications.getPending();
  const pendingIds = new Set(pending.map(notification => notification.id));

  const stale = pending.filter(notification => notification.id < TEST_ID_BASE && !desired.has(notification.id));
  if (stale.length > 0) {
    await LocalNotifications.cancel({ notifications: stale.map(notification => ({ id: notification.id })) });
  }

  const missing = [...desired.entries()].filter(([id]) => !pendingIds.has(id));
  if (missing.length > 0) {
    await LocalNotifications.schedule({
      notifications: missing.map(([id, reminder]) => ({
        id,
        title: reminder.title,
        body: reminder.body,
        schedule: { at: reminder.triggerDate, allowWhileIdle: true },
        extra: {
          source: NOTIFICATION_SOURCE,
          fingerprint: reminder.fingerprint,
          subscriptionId: reminder.subscriptionId,
          kind: reminder.kind,
        },
      })),
    });
  }

  return true;
}

export async function scheduleNotificationTestAsync(locale: Locale): Promise<boolean> {
  const supported = await ensureNotificationSupportAsync({ requestPermissions: true });
  if (!supported) {
    return false;
  }

  const copy = getCopy(locale);
  const now = Date.now();
  const baseId = TEST_ID_BASE + (Math.floor(now / 1000) % 100_000) * 2;

  await LocalNotifications.schedule({
    notifications: [
      {
        id: baseId,
        title: copy.testTitle,
        body: copy.testInactivityBody,
        schedule: { at: new Date(now + 5_000) },
        extra: { source: NOTIFICATION_SOURCE, kind: 'inactivity' },
      },
      {
        id: baseId + 1,
        title: copy.testTitle,
        body: copy.testTrackedDateBody,
        schedule: { at: new Date(now + 10_000) },
        extra: { source: NOTIFICATION_SOURCE, kind: 'tracked-date' },
      },
    ],
  });

  return true;
}
