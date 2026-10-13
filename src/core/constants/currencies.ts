export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'TRY', symbol: '₺', name: 'Türk Lirası' },
  { code: 'USD', symbol: '$', name: 'Amerikan Doları' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japon Yeni' },
  { code: 'GBP', symbol: '£', name: 'İngiliz Sterlini' },
  { code: 'CNY', symbol: '¥', name: 'Çin Yuanı' },
  { code: 'AUD', symbol: 'A$', name: 'Avustralya Doları' },
  { code: 'CAD', symbol: 'C$', name: 'Kanada Doları' },
  { code: 'CHF', symbol: 'Fr', name: 'İsviçre Frangı' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Doları' },
  { code: 'SGD', symbol: 'S$', name: 'Singapur Doları' },
  { code: 'SEK', symbol: 'kr', name: 'İsveç Kronu' },
  { code: 'KRW', symbol: '₩', name: 'Güney Kore Wonu' },
  { code: 'NOK', symbol: 'kr', name: 'Norveç Kronu' },
  { code: 'NZD', symbol: 'NZ$', name: 'Yeni Zelanda Doları' },
  { code: 'INR', symbol: '₹', name: 'Hindistan Rupisi' },
  { code: 'MXN', symbol: 'MX$', name: 'Meksika Pesosu' },
  { code: 'ZAR', symbol: 'R', name: 'Güney Afrika Randı' },
  { code: 'BRL', symbol: 'R$', name: 'Brezilya Reali' },
  { code: 'DKK', symbol: 'kr', name: 'Danimarka Kronu' },
  { code: 'PLN', symbol: 'zł', name: 'Polonya Zlotisi' },
];

export const DEFAULT_CURRENCY = CURRENCIES[0];

// Region → currency for the currencies above (euro area collapsed to EUR).
const REGION_CURRENCY: Record<string, string> = {
  TR: 'TRY', US: 'USD', GB: 'GBP', JP: 'JPY', CN: 'CNY', AU: 'AUD', CA: 'CAD', CH: 'CHF', HK: 'HKD',
  SG: 'SGD', SE: 'SEK', KR: 'KRW', NO: 'NOK', NZ: 'NZD', IN: 'INR', MX: 'MXN', ZA: 'ZAR', BR: 'BRL',
  DK: 'DKK', PL: 'PLN',
};
const EURO_AREA = new Set(['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK']);

/**
 * Default currency from the device *region* (not its language: a Turkish
 * speaker in Germany pays in euros). Falls back to USD when unknown.
 */
export function getRegionCurrency(languageTag: string): Currency {
  let region: string | undefined;
  try {
    region = new Intl.Locale(languageTag).maximize().region;
  } catch {
    region = languageTag.split('-')[1];
  }
  const code = region ? (EURO_AREA.has(region) ? 'EUR' : REGION_CURRENCY[region]) : undefined;
  return CURRENCIES.find(c => c.code === (code ?? 'USD')) ?? CURRENCIES[1];
}
