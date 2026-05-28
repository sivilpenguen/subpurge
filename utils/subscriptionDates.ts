import { BillingCycle } from '../constants/services';

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_LABELS = {
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  de: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  fr: ['janv.', 'fevr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'aout', 'sept.', 'oct.', 'nov.', 'dec.'],
} as const;

const RELATIVE_LABELS = {
  tr: {
    today: 'Bugün',
    tomorrow: 'Yarın',
    yesterday: 'Dün',
    inDays: (days: number) => `${days} gün sonra`,
    daysAgo: (days: number) => `${days} gün önce`,
  },
  en: {
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    inDays: (days: number) => `In ${days} days`,
    daysAgo: (days: number) => `${days} days ago`,
  },
  es: {
    today: 'Hoy',
    tomorrow: 'Manana',
    yesterday: 'Ayer',
    inDays: (days: number) => `En ${days} dias`,
    daysAgo: (days: number) => `Hace ${days} dias`,
  },
  de: {
    today: 'Heute',
    tomorrow: 'Morgen',
    yesterday: 'Gestern',
    inDays: (days: number) => `In ${days} Tagen`,
    daysAgo: (days: number) => `Vor ${days} Tagen`,
  },
  fr: {
    today: "Aujourd'hui",
    tomorrow: 'Demain',
    yesterday: 'Hier',
    inDays: (days: number) => `Dans ${days} jours`,
    daysAgo: (days: number) => `Il y a ${days} jours`,
  },
} as const;

type SupportedLocale = keyof typeof MONTH_LABELS;

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() !== originalDay) {
    result.setDate(0);
  }
  return result;
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  const originalMonth = result.getMonth();
  result.setFullYear(result.getFullYear() + years);
  if (result.getMonth() !== originalMonth) {
    result.setDate(0);
  }
  return result;
}

export function isCalendarDate(value: string): boolean {
  if (!CALENDAR_DATE_PATTERN.test(value)) {
    return false;
  }

  const date = parseDateValue(value);
  return !Number.isNaN(date.getTime()) && formatDateInput(date) === value;
}

export function parseDateValue(value: string): Date {
  if (CALENDAR_DATE_PATTERN.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
  }

  return new Date(value);
}

export function formatDateInput(value: Date | string): string {
  const date = typeof value === 'string' ? parseDateValue(value) : value;

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addBillingCycleToDate(dateValue: string, cycle: BillingCycle): string {
  const date = parseDateValue(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  if (cycle === 'weekly') {
    return formatDateInput(new Date(date.getTime() + (7 * DAY_MS)));
  }

  if (cycle === 'monthly') {
    return formatDateInput(addMonths(date, 1));
  }

  return formatDateInput(addYears(date, 1));
}

export function getUpcomingBillingDate(startDateValue: string, cycle: BillingCycle, referenceDate = new Date()): string {
  const normalizedStartDate = formatDateInput(startDateValue);
  let candidate = addBillingCycleToDate(normalizedStartDate, cycle);
  const normalizedReferenceDate = formatDateInput(referenceDate);

  if (!candidate || !normalizedReferenceDate) {
    return '';
  }

  while (compareDateValues(candidate, normalizedReferenceDate) < 0) {
    candidate = addBillingCycleToDate(candidate, cycle);
  }

  return candidate;
}

export function addMonthsToDateValue(dateValue: string, months: number): string {
  const date = parseDateValue(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return formatDateInput(addMonths(date, months));
}

export function compareDateValues(left: string, right: string): number {
  return parseDateValue(left).getTime() - parseDateValue(right).getTime();
}

function resolveLocale(locale: string): SupportedLocale {
  const baseLocale = locale.slice(0, 2).toLowerCase() as SupportedLocale;
  return baseLocale in MONTH_LABELS ? baseLocale : 'en';
}

export function differenceInCalendarDays(targetDateValue: string, now = new Date()): number {
  const targetDate = parseDateValue(targetDateValue);

  if (Number.isNaN(targetDate.getTime())) {
    return Number.NaN;
  }

  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  return Math.round((targetDay.getTime() - nowDay.getTime()) / DAY_MS);
}

export function formatDisplayDate(dateValue: string, locale: string): string {
  const date = parseDateValue(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  const resolvedLocale = resolveLocale(locale);
  const months = MONTH_LABELS[resolvedLocale];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

export function formatRelativeDayLabel(dateValue: string, locale: string, now = new Date()): string {
  const days = differenceInCalendarDays(dateValue, now);

  if (Number.isNaN(days)) {
    return dateValue;
  }

  const resolvedLocale = resolveLocale(locale);
  const labels = RELATIVE_LABELS[resolvedLocale];

  if (days === 0) return labels.today;
  if (days === 1) return labels.tomorrow;
  if (days === -1) return labels.yesterday;
  if (days > 1) return labels.inDays(days);
  return labels.daysAgo(Math.abs(days));
}
