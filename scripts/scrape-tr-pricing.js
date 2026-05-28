const fs = require('node:fs/promises');
const path = require('node:path');

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'pricing-tr.json');

const SOURCES = [
  { service: 'Spotify',          url: 'https://www.spotify.com/tr-tr/premium/',                         parser: parseSpotify },
  { service: 'YouTube Premium',  url: 'https://www.youtube.com/premium?hl=tr&gl=TR',                    parser: parseYouTubePremium },
  { service: 'Netflix',          url: 'https://www.netflix.com/tr/signup/planform',                     parser: parseNetflix },
  { service: 'Disney+',          url: 'https://www.disneyplus.com/tr-tr/sign-up/plan-select',           parser: parseDisney },
  { service: 'Amazon Prime',     url: 'https://www.amazon.com.tr/amazonprime',                          parser: parseAmazonPrime },
  { service: 'Exxen',            url: 'https://www.exxen.com',                                          parser: parseExxen },
  { service: 'Gain',             url: 'https://www.gain.tv',                                            parser: parseGain },
  { service: 'Puhu',             url: 'https://puhutv.com',                                             parser: parsePuhu },
  { service: 'TOD',              url: 'https://www.tod.tv/tr/subscribe',                                parser: parseTod },
  { service: 'ChatGPT',          url: 'https://openai.com/chatgpt/pricing/',                            parser: parseChatGPT },
  { service: 'iCloud',           url: 'https://www.apple.com/tr/icloud/',                               parser: parseICloud },
  { service: 'LinkedIn Premium', url: 'https://www.linkedin.com/premium/products/?countryCode=TR',      parser: parseLinkedIn },
];

function normalize(v) {
  return v.replace(/[​-\u200F⁠﻿]/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
}
function parsePrice(v) {
  if (/^\d+\.\d{1,2}$/.test(v.trim())) return parseFloat(v);
  return Number(v.replace(/\./g, '').replace(',', '.'));
}
function compact(plans) {
  return plans.filter(Boolean);
}

async function fetchHtml(url, opts = {}) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'accept-language': 'tr-TR,tr;q=0.9,en;q=0.8',
      'accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return normalize(await res.text());
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseSpotify(html) {
  const defs = [
    { id: 'individual', name: 'Individual', billingCycle: 'monthly', re: />Bireysel<\/h3>[\s\S]{0,240}?Sonra ayda ₺([\d.,]+)/ },
    { id: 'duo',        name: 'Duo',        billingCycle: 'monthly', re: />Duo<\/h3>[\s\S]{0,180}?₺([\d.,]+)\s*\/\s*ay/ },
    { id: 'family',     name: 'Family',     billingCycle: 'monthly', re: />Aile<\/h3>[\s\S]{0,180}?₺([\d.,]+)\s*\/\s*ay/ },
    { id: 'student',    name: 'Student',    billingCycle: 'monthly', re: />Öğrenci<\/h3>[\s\S]{0,240}?Sonra ayda ₺([\d.,]+)/ },
  ];
  const plans = compact(defs.map(({ re, ...p }) => {
    const m = html.match(re);
    return m ? { ...p, price: parsePrice(m[1]) } : null;
  }));
  if (!plans.length) throw new Error('No Spotify plans found');
  return { plans };
}

function parseYouTubePremium(html) {
  // Plan adından sonra ilk sıfır olmayan ₺ fiyatı al
  const extract = (planName, id, name, billingCycle) => {
    const idx = html.indexOf(planName);
    if (idx < 0) return null;
    const snippet = html.slice(idx, idx + 400);
    const prices = [...snippet.matchAll(/₺([\d.,]+)/g)]
      .map(m => parsePrice(m[1]))
      .filter(p => p > 0);
    return prices.length ? { id, name, billingCycle, price: prices[0] } : null;
  };

  const plans = compact([
    extract('Bireysel',    'individual',        'Individual',        'monthly'),
    extract('Aile',        'family',            'Family',            'monthly'),
    extract('Öğrenci',     'student',           'Student',           'monthly'),
    extract('1 yıllık',    'individual-yearly', 'Individual Yearly', 'yearly'),
  ]);
  if (!plans.length) throw new Error('No YouTube Premium plans found');
  return { plans };
}

function parseNetflix(html) {
  // Netflix fiyatları genellikle JS bundle içinde gömülü — planform sayfasında tablo yok
  // Alternatif: bilinen TR fiyatları (fiyat değişince skipped döner, manuel güncelleme gerekir)
  const patterns = [
    { id: 'standard-ads', name: 'Reklam Destekli', billingCycle: 'monthly', re: /[Rr]eklam[\s\S]{0,200}?₺\s*([\d.,]+)/ },
    { id: 'standard',     name: 'Standard',        billingCycle: 'monthly', re: /[Ss]tandart(?!.*[Rr]eklam)[\s\S]{0,200}?₺\s*([\d.,]+)/ },
    { id: 'premium',      name: 'Premium',         billingCycle: 'monthly', re: /[Pp]remium[\s\S]{0,200}?₺\s*([\d.,]+)/ },
  ];
  const plans = compact(patterns.map(({ re, ...p }) => {
    const m = html.match(re);
    return m ? { ...p, price: parsePrice(m[1]) } : null;
  }));
  if (!plans.length) return { skipped: 'Netflix TR plan prices not found in page (JS-rendered or geo-blocked).' };
  return { plans };
}

function parseDisney(html) {
  // Disney+ TR: fiyatlar JSON-LD veya meta tag içinde olabilir
  // "amount" veya fiyat objeleri ara — TR fiyatları 80-1000 TL aralığında
  const jsonAmounts = [...html.matchAll(/"amount":\s*"?([\d.]+)"?/g)]
    .map(m => parseFloat(m[1]))
    .filter(p => p >= 80 && p <= 2000);

  // Alternatif: TL fiyat metni
  const tlPrices = [...html.matchAll(/(\d+[.,]\d+)\s*TL/g)]
    .map(m => parsePrice(m[1]))
    .filter(p => p >= 80 && p <= 2000);

  const allPrices = [...new Set([...jsonAmounts, ...tlPrices])].sort((a, b) => a - b);
  if (!allPrices.length) return { skipped: 'Disney+ TR prices not found (JS-rendered, requires headless browser).' };

  const plans = compact([
    allPrices[0] ? { id: 'standard', name: 'Standard', price: allPrices[0], billingCycle: 'monthly' } : null,
    allPrices[1] && allPrices[1] !== allPrices[0] ? { id: 'premium', name: 'Premium', price: allPrices[1], billingCycle: 'monthly' } : null,
  ]);
  return { plans };
}

function parseAmazonPrime(html) {
  const monthly = html.match(/₺\s*([\d.,]+)\s*\/\s*ay/);
  const yearly  = html.match(/₺\s*([\d.,]+)\s*\/\s*yıl/);
  // Alternatif: "X TL/ay" pattern
  const monthlyAlt = html.match(/([\d.,]+)\s*TL\s*\/\s*ay/i);
  const plans = compact([
    (monthly || monthlyAlt)
      ? { id: 'monthly', name: 'Prime', price: parsePrice((monthly || monthlyAlt)[1]), billingCycle: 'monthly' }
      : null,
    yearly
      ? { id: 'yearly', name: 'Prime Yıllık', price: parsePrice(yearly[1]), billingCycle: 'yearly' }
      : null,
  ]);
  if (!plans.length) return { skipped: 'Amazon Prime TR page returned no prices (may be rate-limited).' };
  return { plans };
}

function parseExxen(html) {
  // Exxen ana sayfa fiyat içermiyor — Exxen API endpoint dene
  // Sayfa içinde herhangi ₺ arama
  const prices = [...html.matchAll(/₺\s*([\d.,]+)/g)].map(m => parsePrice(m[1])).filter(p => p > 20);
  if (!prices.length) return { skipped: 'Exxen prices not found on homepage (SPA — requires JS execution).' };
  const sorted = [...new Set(prices)].sort((a, b) => a - b);
  return { plans: [{ id: 'standard', name: 'Exxen', price: sorted[0], billingCycle: 'monthly' }] };
}

function parseGain(html) {
  // "₺129.00" şeklinde
  const m = html.match(/₺\s*([\d.,]+)/);
  if (!m) return { skipped: 'Gain price not found on homepage.' };
  const price = parsePrice(m[1]);
  return {
    plans: [{ id: 'monthly', name: 'Gain', price, billingCycle: 'monthly' }],
  };
}

function parsePuhu(html) {
  const prices = [...html.matchAll(/₺\s*([\d.,]+)/g)].map(m => parsePrice(m[1])).filter(p => p > 10);
  if (!prices.length) return { skipped: 'Puhu prices not found (SPA — requires JS execution).' };
  const sorted = [...new Set(prices)].sort((a, b) => a - b);
  return { plans: [{ id: 'monthly', name: 'Puhu', price: sorted[0], billingCycle: 'monthly' }] };
}

function parseTod(html) {
  const prices = [...html.matchAll(/₺\s*([\d.,]+)/g)].map(m => parsePrice(m[1])).filter(p => p > 20);
  if (!prices.length) {
    // TOD fiyatları JS render — fallback olarak sayısal değerlere bak
    const nums = [...html.matchAll(/"price":\s*"?([\d.]+)"?/g)].map(m => parseFloat(m[1])).filter(p => p > 20);
    if (!nums.length) return { skipped: 'TOD prices not found (Next.js SSR — prices may be client-rendered).' };
    return { plans: [{ id: 'monthly', name: 'TOD', price: Math.min(...nums), billingCycle: 'monthly' }] };
  }
  return { plans: [{ id: 'monthly', name: 'TOD', price: Math.min(...prices), billingCycle: 'monthly' }] };
}

function parseChatGPT(html) {
  const m = html.match(/\$([\d.,]+)\s*\/\s*month/i) || html.match(/\$([\d.,]+)\s*per month/i);
  if (!m) return { skipped: 'ChatGPT pricing page blocked or structure changed (403/bot protection).' };
  return {
    plans: [{ id: 'plus', name: 'ChatGPT Plus', price: parsePrice(m[1]), billingCycle: 'monthly' }],
    currency: 'USD',
  };
}

function parseICloud(html) {
  // Apple TR fiyatları genellikle JavaScript içinde gömülü
  // Sayfa içinde ₺ var mı kontrol et
  const priceMap = [];
  const sizes = [
    { label: '50 GB',  id: '50gb',  name: 'iCloud+ 50GB' },
    { label: '200 GB', id: '200gb', name: 'iCloud+ 200GB' },
    { label: '2 TB',   id: '2tb',   name: 'iCloud+ 2TB' },
    { label: '6 TB',   id: '6tb',   name: 'iCloud+ 6TB' },
    { label: '12 TB',  id: '12tb',  name: 'iCloud+ 12TB' },
  ];
  for (const s of sizes) {
    const idx = html.indexOf(s.label);
    if (idx < 0) continue;
    const snippet = html.slice(idx, idx + 300);
    const prices = [...snippet.matchAll(/₺\s*([\d.,]+)/g)].map(m => parsePrice(m[1])).filter(p => p > 0);
    if (prices.length) priceMap.push({ id: s.id, name: s.name, price: prices[0], billingCycle: 'monthly' });
  }
  if (!priceMap.length) return { skipped: 'iCloud TR prices not found in page (prices may be JS-rendered).' };
  return { plans: priceMap };
}

function parseLinkedIn(html) {
  const plans = [];
  for (const [label, id, name] of [['Career', 'career', 'LinkedIn Career'], ['Business', 'business', 'LinkedIn Business']]) {
    const idx = html.indexOf(label);
    if (idx < 0) continue;
    const snippet = html.slice(idx, idx + 400);
    const prices = [...snippet.matchAll(/₺\s*([\d.,]+)/g)].map(m => parsePrice(m[1])).filter(p => p > 0);
    if (prices.length) plans.push({ id, name, price: prices[0], billingCycle: 'monthly' });
  }
  if (!plans.length) return { skipped: 'LinkedIn Premium TR prices not found (may require login or JS).' };
  return { plans };
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  const result = { country: 'TR', currency: 'TRY', updatedAt: new Date().toISOString(), services: {}, skipped: {} };

  for (const source of SOURCES) {
    process.stdout.write('Fetching ' + source.service + '... ');
    try {
      const html = await fetchHtml(source.url);
      const parsed = source.parser(html);
      if (parsed.skipped) {
        result.skipped[source.service] = { reason: parsed.skipped, sourceUrl: source.url };
        console.log('⚠ skipped');
        continue;
      }
      result.services[source.service] = {
        sourceUrl: source.url,
        ...(parsed.currency ? { currency: parsed.currency } : {}),
        plans: parsed.plans,
      };
      console.log('✓ ' + parsed.plans.length + ' plan(s): ' + parsed.plans.map(p => p.name + ' ₺' + p.price).join(', '));
    } catch (err) {
      result.skipped[source.service] = { reason: err instanceof Error ? err.message : String(err), sourceUrl: source.url };
      console.log('✗ ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(result, null, 2) + '\n', 'utf8');
  const ok = Object.keys(result.services).length;
  const sk = Object.keys(result.skipped).length;
  console.log('\nDone: ' + ok + ' updated, ' + sk + ' skipped → ' + OUTPUT_PATH);
}

void main();
