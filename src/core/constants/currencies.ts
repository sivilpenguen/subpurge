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
