import { CURRENCIES, type Currency } from '../core/constants/currencies';
import type { Locale } from '../core/constants/i18n';
import { convertAmount } from '../core/utils/exchangeRates';
import type { Subscription } from '../core/store/logic';

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: Locale, digits: number) {
  const key = `${locale}:${digits}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
    formatters.set(key, formatter);
  }
  return formatter;
}

// Euro amounts are written "12,99 €" in German, French and Spanish.
const SUFFIX_EURO: ReadonlySet<Locale> = new Set(['de', 'fr', 'es']);

/** "₺1.299,99" in TR, "$1,299.99" in EN, "12,99 €" in DE/FR/ES. */
export function money(amount: number, symbol: string, locale: Locale, digits = 2): string {
  const value = getFormatter(locale, digits).format(Number.isFinite(amount) ? amount : 0);
  return symbol === '€' && SUFFIX_EURO.has(locale) ? `${value} €` : `${symbol}${value}`;
}

export function currencyFor(code: string | undefined, fallback: Currency): Currency {
  return (code && CURRENCIES.find(c => c.code === code)) || fallback;
}

/** Converts a subscription amount into the display currency (no-op when codes match or rates are missing). */
export function toDisplay(amount: number, sub: Pick<Subscription, 'currencyCode'>, display: Currency, rates: Record<string, number>): number {
  if (!sub.currencyCode || sub.currencyCode === display.code) return amount;
  return convertAmount(amount, sub.currencyCode, display.code, rates);
}

/** Localised currency name ("US Dollar" / "ABD Doları"), falling back to the bundled Turkish name. */
export function currencyName(currency: Currency, locale: Locale): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'currency' }).of(currency.code) ?? currency.name;
  } catch {
    return currency.name;
  }
}
